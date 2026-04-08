const express = require('express');
const router = express.Router();
const {
    checkId,
    setupPin,
    login,
    saveContact,
    verifyUserLeague,
    getCurrentUser,
} = require('../controllers/auth.controller');

const authMiddleware = require('../middlewares/auth.middleware');

// ── Public Routes ─────────────────────────────────────────────────────────────

// Step 1: Check if fpl_id exists and its migration status
router.post('/check-id', checkId);

// Step 2A: New user or legacy user sets up a PIN
router.post('/setup-pin', setupPin);

// Step 2B: Existing (migrated) user logs in with their PIN
router.post('/login', login);

// ── Protected Routes ──────────────────────────────────────────────────────────

// Step 3 (Optional): Save email/phone contact info
router.post('/save-contact', authMiddleware, saveContact);

// Verify league membership (unchanged)
router.post('/verify-league', authMiddleware, verifyUserLeague);

// Get current authenticated user info
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;