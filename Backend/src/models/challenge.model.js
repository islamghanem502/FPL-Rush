const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    backgroundImage: { type: String },
    prize: { type: String },
    prizeSecond: { type: String },
    prizeThird: { type: String },
    joinCode: { type: String },
    // Used to persist admin-defined ordering (drag & drop)
    position: { type: Number, default: 0, index: true },
    startEvent: { type: Number, required: true },
    endEvent: { type: Number, required: true },
    // Conditions
    minTotalPoints: { type: Number, default: 0 },
    maxOverallRank: { type: Number, default: 10000000 },
    minStartedEvent: { type: Number, default: 1 },

    status: { type: String, enum: ['active', 'finished'], default: 'active' },

    winners: [{
        userId: mongoose.Schema.Types.ObjectId,
        teamName: String,
        managerName: String,
        points: Number,
        rank: Number
    }]

}, { timestamps: true });

module.exports = mongoose.model('Challenge', ChallengeSchema);