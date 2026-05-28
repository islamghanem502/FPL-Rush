const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    // ── Primary Identifier ──────────────────────────────────────────────────
    fpl_id: {
        type: Number,
        required: true,
        unique: true
    },

    // ── Authentication ──────────────────────────────────────────────────────
    pin_code: {
        type: String,        // Bcrypt-hashed 4-digit PIN
        required: true
    },

    is_migrated: {
        type: Boolean,
        default: false       // false = new user or legacy needing PIN setup
    },

    // ── Optional Contact Info ───────────────────────────────────────────────
    email: {
        type: String,
        unique: true,
        sparse: true,        // allows multiple null values
        lowercase: true,
        trim: true
    },

    phone: {
        type: String,
        trim: true
    },

    // ── FPL Profile Data (fetched from FPL API on first login) ──────────────
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

    // ── League Verification ─────────────────────────────────────────────────
    isVerified: {
        type: Boolean,
        default: false
    },

    // ── Challenge Participation ─────────────────────────────────────────────
    joinedChallenges: [{
        challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
        initialPoints:    { type: Number, default: 0 },
        finalNetPoints:   { type: Number, default: null }, // set when challenge is closed → freezes the leaderboard
        joinedAt:         { type: Date, default: Date.now }
    }],

    // ── Role ────────────────────────────────────────────────────────────────
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

}, {
    timestamps: true
});

// 🔐 Hide sensitive fields in JSON output
UserSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.pin_code;
    return user;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
