const axios = require('axios');
const Challenge = require('../models/challenge.model'); 
const User = require('../models/user.model');

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

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


module.exports = {
  validateTeamId, 
  syncMultipleUsers, 
  checkLeagueMembership 
};
