const mongoose = require('mongoose');

const ChallengeParticipantSchema = new mongoose.Schema({
    challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // The team total used as the scoring baseline for this participant.
    // It may be refreshed while the challenge has not started yet.
    initialPoints: { type: Number, required: true, default: 0 },
    finalNetPoints: { type: Number, default: null },
    finalRank: { type: Number, default: null },
    // Immutable display snapshot written when the challenge is finalized. The
    // standings page must not change if the user later edits their FPL team
    // name or profile image.
    finalTeamName: { type: String, default: null },
    finalManagerName: { type: String, default: null },
    finalAvatar: { type: String, default: null },
    finalCountry: { type: String, default: null },
    participationType: {
        type: String,
        enum: ['participant', 'owner'],
        default: 'participant'
    },
    joinedAt: { type: Date, default: Date.now },
    eligibilitySnapshot: {
        totalPoints: Number,
        overallRank: Number,
        startedEvent: Number,
        checkedAt: Date
    }
}, { timestamps: true });

ChallengeParticipantSchema.index({ challengeId: 1, userId: 1 }, { unique: true });
ChallengeParticipantSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ChallengeParticipant', ChallengeParticipantSchema);
