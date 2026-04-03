const express = require('express');
const router = express.Router();
const pvpController = require('../controllers/pvpChallenge.controller');

const auth = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/admin.middleware');
const verify = require("../middlewares/isVerified.middleware");


router.get('/', auth, verify, pvpController.getPvPChallenges);
router.post('/create', auth, isAdmin, pvpController.createPvPChallenge);
router.get('/search-players', auth, isAdmin, pvpController.searchPlayers);


router.get('/:id', auth, verify, pvpController.getPvPChallengeById);
router.patch('/:id/sync', auth, isAdmin, pvpController.syncPvPResults);
router.patch('/:id/close', auth, isAdmin, pvpController.closePvPChallengeManual);
router.delete('/:id', auth, isAdmin, pvpController.deletePvPChallenge);

router.post('/:id/predict', auth, verify, pvpController.submitPvPPrediction);
router.get('/:id/my-prediction', auth, verify, pvpController.getMyPvPPrediction);
router.get('/:id/standings', auth, verify, pvpController.getPvPStandings);

module.exports = router;