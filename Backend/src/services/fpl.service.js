const axios = require('axios');
const Challenge = require('../models/challenge.model');
const PvPChallenge = require('../models/pvpChallenge.model');
const PvPPrediction = require('../models/pvpPrediction.model');
const User = require('../models/user.model');

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

// Helper: check if a GW's deadline has passed (i.e. GW has started = no more predictions allowed)
const isGwDeadlinePassed = async (gw) => {
  try {
    const response = await axios.get(`${FPL_BASE_URL}/bootstrap-static/`);
    const event = response.data.events.find(e => e.id === gw);
    if (!event) return true; // unknown GW → block predictions
    const deadline = new Date(event.deadline_time);
    return new Date() >= deadline;
  } catch (err) {
    console.error('Error checking GW deadline:', err.message);
    return true; // fail-safe: block predictions if we can't check
  }
};


const validateTeamId = async (teamId) => {
  try {
    const response = await axios.get(`${FPL_BASE_URL}/entry/${teamId}/`);
    const data = response.data;
    return {
      teamId: data.id,
      teamName: data.name,
      managerName: `${data.player_first_name} ${data.player_last_name}`,
      startedEvent: data.started_event,
      currentEvent: data.current_event,
      totalPoints: data.summary_overall_points,
      overallRank: data.summary_overall_rank,
      lastGwPoints: data.summary_event_points
    };
  } catch (error) {
    console.error(`Error fetching FPL data for team ${teamId}:`, error.message);
    return null;
  }
};

const syncMultipleUsers = async (users) => {
  const updatedData = [];
  try {
    const allChallenges = await Challenge.find({});
    for (const user of users) {
      try {
        const freshData = await validateTeamId(user.teamId);
        if (freshData) {
          user.totalPoints = freshData.totalPoints;
          user.overallRank = freshData.overallRank;
          user.lastGwPoints = freshData.lastGwPoints;
          user.currentEvent = freshData.currentEvent;

          if (user.joinedChallenges && user.joinedChallenges.length > 0) {
            user.joinedChallenges.forEach(joined => {
              const challenge = allChallenges.find(c => c._id.equals(joined.challengeId));
              if (challenge && challenge.status === 'active') {
                if (user.currentEvent < challenge.startEvent) {
                  joined.initialPoints = user.totalPoints;
                }
              }
            });
          }
          await user.save();
          updatedData.push(user);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Failed to sync user ${user.teamId}:`, err.message);
      }
    }
  } catch (globalErr) {
    console.error("Critical error in syncMultipleUsers:", globalErr.message);
  }
  return updatedData;
};

const syncPvPChallenges = async () => {
  try {
    const activePvPs = await PvPChallenge.find({ status: 'active' });
    if (activePvPs.length === 0) return;

    for (const challenge of activePvPs) {
      try {
        // ✅ Only sync if the GW deadline has passed (i.e. the GW has actually started)
        const gwStarted = await isGwDeadlinePassed(challenge.gw);
        if (!gwStarted) {
          console.log(`⏳ Skipping PvP challenge ${challenge._id} — GW ${challenge.gw} hasn't started yet.`);
          continue;
        }

        const response = await axios.get(`${FPL_BASE_URL}/event/${challenge.gw}/live/`);
        const pointsMap = new Map();
        response.data.elements.forEach(el => pointsMap.set(el.id, el.stats.total_points));
        challenge.matchups.forEach(match => {
          const p1_pts = pointsMap.get(match.p1_id) || 0;
          const p2_pts = pointsMap.get(match.p2_id) || 0;

          if (p1_pts > p2_pts) match.result = 'p1';
          else if (p2_pts > p1_pts) match.result = 'p2';
          else match.result = 'draw';
        });
        challenge.markModified('matchups');
        await challenge.save();

        const userPredictions = await PvPPrediction.find({ challengeId: challenge._id });

        for (const pred of userPredictions) {
          let score = 0;
          pred.predictions.forEach(p => {
            const actual = challenge.matchups[p.matchupIndex].result;
            const isDouble = challenge.matchups[p.matchupIndex].isDouble;
            const multiplier = isDouble ? 2 : 1;

            if (p.selection === actual) {
              score += (3 * multiplier);
            } else {
              score -= (1 * multiplier);
            }
          });
          pred.totalPoints = score;
          await pred.save();
        }

        console.log(`✅ Synced PvP challenge ${challenge._id} — GW ${challenge.gw}`);
      } catch (err) {
        console.error(`Error syncing PvP challenge ${challenge._id}:`, err.message);
      }
    }
  } catch (error) {
    console.error("Critical error in syncPvPChallenges:", error.message);
  }
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

module.exports = {
  validateTeamId,
  syncMultipleUsers,
  syncPvPChallenges,
  checkLeagueMembership,
  getPlayersForSearch,
  isGwDeadlinePassed
};