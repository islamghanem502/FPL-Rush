const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    // ── Authentication ───────────────────────────────────────────────────────
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        default: null   // null for Google OAuth users (future)
    },

    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },

    googleId: {
        type: String,
        default: null,
        sparse: true
    },

    // ── Email Verified removed — no verification step on register ──────────

    // ── Password Reset (via Resend email) ───────────────────────────────────
    passwordResetToken: {
        type: String,
        default: null
    },

    passwordResetExpires: {
        type: Date,
        default: null
    },

    // ── Account Status (2-stage flow) ────────────────────────────────────────
    // registered   → signed up, can browse (read-only)
    // fpl_linked   → FPL ID connected, full access
    accountStatus: {
        type: String,
        enum: ['registered', 'fpl_linked'],
        default: 'registered'
    },

    // ── FPL Identity (linked AFTER email verification) ───────────────────────
    fpl_id: {
        type: Number,
        unique: true,
        sparse: true,    // allows multiple null values
        default: null
    },

    fpl_linked_at: {
        type: Date,
        default: null
    },

    // ── FPL Profile Data (fetched from FPL API on link) ──────────────────────
    teamName: {
        type: String,
        trim: true
    },

    managerName: {
        type: String,
        trim: true
    },

    // ── FPL Stats (updated by CRON) ─────────────────────────────────────────
    startedEvent: {
        type: Number
    },

    currentEvent: {
        type: Number
    },

    totalPoints: {
        type: Number,
        default: 0
    },

    lastGwPoints: {
        type: Number,
        default: 0
    },

    overallRank: {
        type: Number,
        default: 0
    },

    // ── League Verification (still used by challenges) ───────────────────────
    // true = user is a member of the private FPL Rush league
    isVerified: {
        type: Boolean,
        default: false
    },

    // ── Challenge Participation ─────────────────────────────────────────────
    joinedChallenges: [{
        challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
        initialPoints:    { type: Number, default: 0 },
        finalNetPoints:   { type: Number, default: null },
        joinedAt:         { type: Date, default: Date.now }
    }],

    // ── Role ────────────────────────────────────────────────────────────────
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    // ── Contact ─────────────────────────────────────────────────────────────
    phone: {
        type: String,
        trim: true
    },

}, {
    timestamps: true
});

// 🔐 Hide sensitive fields in JSON output
UserSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    delete user.googleId;
    return user;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
