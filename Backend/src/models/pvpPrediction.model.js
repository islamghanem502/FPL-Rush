const mongoose = require('mongoose');

const pvpPredictionSchema = new mongoose.Schema({
    challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PvPChallenge',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gw: { type: Number, required: true },
    predictions: [
        {
            matchupIndex: Number,
            selection: { type: String, enum: ['p1', 'p2', 'draw'] }
        }
    ],
    totalPoints: { type: Number, default: 0 },
    isProcessed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('PvPPrediction', pvpPredictionSchema);