const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challenge.controller');
const auth = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/admin.middleware');
const verify = require("../middlewares/isVerified.middleware");


router.get('/', auth, verify, challengeController.getChallenges);
router.post('/create', auth, isAdmin, challengeController.createChallenge);
router.post('/reorder', auth, isAdmin, challengeController.reorderChallenges);
router.delete('/:id', auth, isAdmin, challengeController.deleteChallenge);



// Enroll
router.post('/:challengeId/enroll', auth, verify, challengeController.enrollInChallenge);

// Standings
router.get('/:challengeId/standings', auth, verify, challengeController.getChallengeStandings);

//close challenge
router.patch('/:challengeId/close', auth, isAdmin, challengeController.closeChallengeManual);

module.exports = router;