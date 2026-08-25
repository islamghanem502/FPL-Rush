const axios = require('axios');
const User = require('../models/user.model');
const ChallengeParticipant = require('../models/challengeParticipant.model');

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

// Helper: check if a GW's deadline has passed
const isGwDeadlinePassed = async (gw) => {
  try {
    const response = await axios.get(`${FPL_BASE_URL}/bootstrap-static/`);
    const event = response.data.events.find(e => e.id === gw);
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
  try {
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
              && Number(user.currentEvent || 0) < participant.challengeId.startEvent)
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
    const response = await axios.get(`${FPL_BASE_URL}/entry/${fplId}/history/`);
    return {
      current: response.data.current || [],
      chips: response.data.chips || [],
      past: response.data.past || []
    };
  } catch (error) {
    console.error(`Error fetching FPL history for entry ${fplId}:`, error.message);
    return { current: [], chips: [], past: [] };
  }
};

module.exports = {
  validateTeamId,
  syncMultipleUsers,
  checkLeagueMembership,
  getPlayersForSearch,
  isGwDeadlinePassed,
  getUserFplHistory
};
