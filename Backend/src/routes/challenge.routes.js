const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challenge.controller');
const auth = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/admin.middleware');
const requireFplLinked = require('../middlewares/fplLinked.middleware');

// Every challenge action requires an authenticated FPL-linked account. Platform
// league membership is now an explicit challenge condition, not a global gate.
router.use(auth);

router.get('/public', requireFplLinked, challengeController.getPublicChallenges);
router.get('/mine', requireFplLinked, challengeController.getMyChallenges);
router.post('/private', requireFplLinked, challengeController.createPrivateChallenge);
router.post('/public', isAdmin, challengeController.createPublicChallenge);

router.get('/invite/:inviteCode', requireFplLinked, challengeController.previewPrivateInvite);
router.post('/invite/:inviteCode/enroll', requireFplLinked, challengeController.enrollWithPrivateInvite);

// Backwards-compatible aliases used by the pre-migration client.
router.get('/', requireFplLinked, challengeController.getPublicChallenges);
router.post('/create', isAdmin, challengeController.createPublicChallenge);
router.post('/reorder', isAdmin, challengeController.reorderChallenges);

router.get('/:id/invite', requireFplLinked, challengeController.getPrivateInvite);
router.post('/:id/invite/rotate', requireFplLinked, challengeController.rotatePrivateInvite);
router.get('/:id', requireFplLinked, challengeController.getChallenge);
router.patch('/:id', requireFplLinked, challengeController.updateChallenge);
router.delete('/:id', requireFplLinked, challengeController.deleteChallenge);

router.post('/:challengeId/enroll', requireFplLinked, challengeController.enrollInChallenge);
router.get('/:challengeId/standings', requireFplLinked, challengeController.getChallengeStandings);
router.patch('/:challengeId/close', requireFplLinked, challengeController.closeChallengeManual);

module.exports = router;
