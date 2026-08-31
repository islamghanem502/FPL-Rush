const axios = require('axios');
const User = require('../models/user.model');
const ChallengeParticipant = require('../models/challengeParticipant.model');

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

const getBootstrapStatic = async () => {
  const response = await axios.get(`${FPL_BASE_URL}/bootstrap-static/`, {
    timeout: 15000,
    headers: { 'Cache-Control': 'no-cache' }
  });
  return response.data || {};
};

const getFixturesForGameweek = async (gameweek) => {
  const response = await axios.get(`${FPL_BASE_URL}/fixtures/?event=${Number(gameweek)}`, {
    timeout: 15000,
    headers: { 'Cache-Control': 'no-cache' }
  });
  if (!Array.isArray(response.data)) {
    const error = new Error('FPL returned an invalid fixtures response');
    error.code = 'FPL_FIXTURES_INVALID';
    throw error;
  }
  return response.data;
};

const getEventStatus = async () => {
  const response = await axios.get(`${FPL_BASE_URL}/event-status/`, {
    timeout: 15000,
    headers: { 'Cache-Control': 'no-cache' }
  });
  const data = response.data;
  const valid = Array.isArray(data)
    || Array.isArray(data?.status)
    || (data?.status && typeof data.status === 'object');
  if (!valid) {
    const error = new Error('FPL returned an invalid event status response');
    error.code = 'FPL_EVENT_STATUS_INVALID';
    throw error;
  }
  return data;
};

// FPL exposes the current/next gameweek on the event objects. We deliberately
// return the next event when there is a gap between gameweeks: joining during
// that gap should start scoring from the upcoming gameweek.
const getCurrentGameweek = async () => {
  const data = await getBootstrapStatic();
  const events = Array.isArray(data.events) ? data.events : [];
  if (!events.length) {
    const error = new Error('FPL returned no gameweek data');
    error.code = 'FPL_EVENTS_UNAVAILABLE';
    throw error;
  }
  const current = events.find((event) => event.is_current);
  if (current?.id) return Number(current.id);

  const next = events.find((event) => event.is_next);
  if (next?.id) return Number(next.id);

  const latest = events
    .filter((event) => event.finished)
    .sort((left, right) => Number(right.id) - Number(left.id))[0];
  return latest?.id ? Number(latest.id) : 1;
};

// Helper: check if a GW's deadline has passed
const isGwDeadlinePassed = async (gw) => {
  try {
    const data = await getBootstrapStatic();
    const event = data.events?.find(e => e.id === gw);
    if (!event) return true;
    const deadline = new Date(event.deadline_time);
    return new Date() >= deadline;
  } catch (err) {
    console.error('Error checking GW deadline:', err.message);
    return true;
  }
};


const validateTeamId = async (teamId) => {
  try {
    const response = await axios.get(`${FPL_BASE_URL}/entry/${teamId}/`);
    const data = response.data;
    // NOTE: we intentionally do NOT return teamId here — fpl_id is set
    // explicitly in the controller to avoid the stale teamId_1 index conflict.
    return {
      teamName: data.name,
      managerName: `${data.player_first_name} ${data.player_last_name}`,
      startedEvent: data.started_event,
      currentEvent: data.current_event,
      totalPoints: data.summary_overall_points,
      overallRank: data.summary_overall_rank,
      lastGwPoints: data.summary_event_points,
      country: data.player_region_name,
      countryCode: data.player_region_iso_code_short
    };
  } catch (error) {
    console.error(`Error fetching FPL data for team ${teamId}:`, error.message);
    return null;
  }
};

const syncMultipleUsers = async (users) => {
  const updatedData = [];
  let currentGameweek = null;
  try {
    try {
      currentGameweek = await getCurrentGameweek();
    } catch (error) {
      // Do not touch participant baselines when the global FPL event cannot
      // be determined. Updating them from a stale user.currentEvent could
      // overwrite the correct baseline of a late joiner.
      console.error('Unable to determine current FPL gameweek:', error.message);
    }

    for (const user of users) {
      try {
        if (!user.fpl_id) continue;
        const freshData = await validateTeamId(user.fpl_id);
        if (freshData) {
          user.totalPoints = freshData.totalPoints;
          user.overallRank = freshData.overallRank;
          user.lastGwPoints = freshData.lastGwPoints;
          user.currentEvent = freshData.currentEvent;
          if (freshData.startedEvent !== undefined) user.startedEvent = freshData.startedEvent;
          if (freshData.country) user.country = freshData.country;
          if (freshData.countryCode) user.countryCode = freshData.countryCode;

          // Keep the existing scoring behaviour: when a user joins before the
          // challenge starts, their baseline follows their FPL total until the
          // start gameweek. Participants now live in their own collection.
          const pendingParticipants = await ChallengeParticipant.find({
            userId: user._id,
            finalNetPoints: null
          }).populate({ path: 'challengeId', select: 'status startEvent' });

          const baselineUpdates = pendingParticipants
            .filter((participant) => participant.challengeId
              && participant.challengeId.status === 'active'
              && currentGameweek !== null
              && Number(currentGameweek) < participant.challengeId.startEvent)
            .map((participant) => ({
              updateOne: {
                filter: { _id: participant._id },
                update: { $set: { initialPoints: user.totalPoints } }
              }
            }));

          if (baselineUpdates.length) {
            await ChallengeParticipant.bulkWrite(baselineUpdates, { ordered: false });
          }

          await user.save();
          updatedData.push(user);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Failed to sync user ${user.fpl_id}:`, err.message);
      }
    }
  } catch (globalErr) {
    console.error("Critical error in syncMultipleUsers:", globalErr.message);
  }
  return updatedData;
};

const checkLeagueMembership = async (teamId, targetLeagueId) => {
  try {
    const response = await axios.get(`${FPL_BASE_URL}/entry/${teamId}/`);
    const data = response.data;
    const classicLeagues = data.leagues.classic;
    const isMember = classicLeagues.some(league => league.id === Number(targetLeagueId));
    return {
      isMember,
      playerInfo: {
        teamName: data.name,
        managerName: `${data.player_first_name} ${data.player_last_name}`,
        totalPoints: data.summary_overall_points
      }
    };
  } catch (error) {
    console.error(`Error in FPL League Check:`, error.message);
    throw new Error('فشل في جلب بيانات الفانتزي');
  }
};

const getPlayersForSearch = async () => {
  try {
    const response = await axios.get(`${FPL_BASE_URL}/bootstrap-static/`);

    const players = response.data.elements.map(player => ({
      id: player.id,
      name: player.web_name,
      full_name: `${player.first_name} ${player.second_name}`,
      photo: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`,
      team_code: player.team_code
    }));

    return players;
  } catch (error) {
    console.error("Error fetching bootstrap-static for players:", error.message);
    throw new Error('فشل في جلب قائمة اللاعبين');
  }
};

const getUserFplHistory = async (fplId) => {
  try {
    const response = await axios.get(`${FPL_BASE_URL}/entry/${fplId}/history/`, {
      timeout: 15000,
      headers: { 'Cache-Control': 'no-cache' }
    });
    return {
      current: Array.isArray(response.data?.current) ? response.data.current : [],
      chips: Array.isArray(response.data?.chips) ? response.data.chips : [],
      past: Array.isArray(response.data?.past) ? response.data.past : []
    };
  } catch (error) {
    console.error(`Error fetching FPL history for entry ${fplId}:`, error.message);
    return { current: [], chips: [], past: [] };
  }
};

// Finalization must distinguish a temporary API failure from an empty history.
// Keep the existing forgiving helper for profile screens, and expose a strict
// variant for the challenge finalizer so it can retry instead of writing a
// partial result.
const getUserFplHistoryStrict = async (fplId) => {
  const response = await axios.get(`${FPL_BASE_URL}/entry/${fplId}/history/`, {
    timeout: 15000,
    headers: { 'Cache-Control': 'no-cache' }
  });
  const data = response.data || {};
  return {
    current: Array.isArray(data.current) ? data.current : [],
    chips: Array.isArray(data.chips) ? data.chips : [],
    past: Array.isArray(data.past) ? data.past : []
  };
};

// `history.current` is an array, but its array position is not the gameweek
// identifier. Always match the explicit `event` field. GW1 has no previous
// row, so its baseline is zero by definition.
const getPointsBeforeGameweek = async (fplId, gameweek) => {
  const previousEvent = Number(gameweek) - 1;
  if (previousEvent <= 0) return 0;

  const history = await getUserFplHistory(fplId);
  const previousRow = history.current.find((row) => Number(row.event) === previousEvent);

  if (!previousRow || !Number.isFinite(Number(previousRow.total_points))) {
    const error = new Error(`تعذر العثور على نقاط الجولة ${previousEvent} لفريق FPL`);
    error.code = 'FPL_HISTORY_INCOMPLETE';
    error.status = 503;
    throw error;
  }

  return Number(previousRow.total_points);
};

module.exports = {
  validateTeamId,
  syncMultipleUsers,
  checkLeagueMembership,
  getPlayersForSearch,
  isGwDeadlinePassed,
  getBootstrapStatic,
  getFixturesForGameweek,
  getEventStatus,
  getUserFplHistory,
  getUserFplHistoryStrict,
  getCurrentGameweek,
  getPointsBeforeGameweek
};
