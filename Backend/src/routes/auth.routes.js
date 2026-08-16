const express = require('express');
const router = express.Router();
const {
    register,
    login,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    linkFplId,
    verifyUserLeague,
    getCurrentUser,
    googleAuth,
    updateProfile,
    uploadAvatar,
    getUserFplHistory
} = require('../controllers/auth.controller');

const authMiddleware = require('../middlewares/auth.middleware');

// ── Public Routes ─────────────────────────────────────────────────────────────

// Register with email + password → JWT returned immediately (no email step)
router.post('/register', register);

// Google Sign-In / OAuth
router.post('/google', googleAuth);

// Login with email + password
router.post('/login', login);

// Forgot password → sends reset link via Resend
router.post('/forgot-password', forgotPassword);

// Verify reset OTP code
router.post('/verify-reset-code', verifyResetCode);

// Reset password with token from email
router.post('/reset-password', resetPassword);

// ── Protected Routes (requires JWT) ──────────────────────────────────────────

// Link FPL ID (any logged-in user can do this)
router.post('/link-fpl', authMiddleware, linkFplId);

// Verify league membership (requires fpl_linked — enforced in controller)
router.post('/verify-league', authMiddleware, verifyUserLeague);

// Get current authenticated user
router.get('/me', authMiddleware, getCurrentUser);

// Update user profile info
router.put('/profile', authMiddleware, updateProfile);

// Upload profile avatar to Cloudinary
router.post('/upload-avatar', authMiddleware, uploadAvatar);

// Get user FPL gameweek history & chips
router.get('/fpl-history', authMiddleware, getUserFplHistory);

module.exports = router;