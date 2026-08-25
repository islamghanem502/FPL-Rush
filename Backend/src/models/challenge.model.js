const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    backgroundImage: { type: String },
    prize: { type: String },
    prizeSecond: { type: String },
    prizeThird: { type: String },
    // Public challenges are discoverable by everyone. Private challenges are
    // reachable only by their owner, participants, or a valid invite link.
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public',
        index: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Invite secrets are deliberately excluded from normal reads. The raw
    // value is encrypted so the owner can retrieve/copy the link later.
    inviteCodeHash: { type: String, unique: true, sparse: true, select: false },
    inviteCodeCiphertext: { type: String, select: false },
    inviteCodeLast4: { type: String, default: null },

    // Kept only while legacy challenges are migrated. Never return this value
    // from an API response and never use it for new challenges.
    joinCode: { type: String, select: false },

    // Used to persist admin-defined ordering for public challenges only.
    position: { type: Number, default: 0, index: true },
    startEvent: { type: Number, required: true },
    endEvent: { type: Number, required: true },
    // Conditions
    minTotalPoints: { type: Number, default: 0 },
    maxOverallRank: { type: Number, default: 10000000 },
    // The previous name, minStartedEvent, was ambiguous and its controller
    // referenced a non-existent user field. This means “the user started FPL
    // no later than this gameweek”.
    latestStartedEvent: { type: Number, default: 38 },
    // Read only by the migration script; never expose or use for new data.
    minStartedEvent: { type: Number, select: false },
    requiresPlatformLeagueMembership: { type: Boolean, default: false },

    status: {
        type: String,
        enum: ['draft', 'active', 'finished', 'cancelled'],
        default: 'active',
        index: true
    },
    participantCount: { type: Number, default: 0 },

    winners: [{
        userId: mongoose.Schema.Types.ObjectId,
        teamName: String,
        managerName: String,
        points: Number,
        rank: Number
    }]

}, { timestamps: true });

ChallengeSchema.index({ visibility: 1, status: 1, position: 1, createdAt: -1 });

module.exports = mongoose.model('Challenge', ChallengeSchema);
