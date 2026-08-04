const express = require('express');
const router = express.Router();
const { getLiveBonus, getCurrentGW, getBootstrapTeams } = require('../controllers/bonus.controller');

// GET /api/bonus/current-gw  — returns the active/current gameweek number
router.get('/current-gw', getCurrentGW);

// GET /api/bonus/teams  — returns FPL team id->name map
router.get('/teams', getBootstrapTeams);

// GET /api/bonus/live/:event
router.get('/live/:event', getLiveBonus);

module.exports = router;
