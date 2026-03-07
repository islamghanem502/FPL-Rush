const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    forgotPassword, 
    verifyOTP, 
    resetPassword, 
    resendOTP, 
    getCurrentUser,
    verifyUserLeague 
} = require('../controllers/auth.controller');

const authMiddleware = require('../middlewares/auth.middleware');


router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);


router.post('/verify-league', authMiddleware, verifyUserLeague);

router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;