const mongoose = require('mongoose');

const pvpChallengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    backgroundImage: { type: String },
    prize: { type: String },
    prizeSecond: { type: String },
    prizeThird: { type: String },
    joinCode: { type: String },

    position: { type: Number, default: 0, index: true },

    gw: { type: Number, required: true },
    minStartedEvent: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'finished'], default: 'active' },


    matchups: [{
        p1_id: Number,
        p1_name: String,
        p1_photo: String,
        p2_id: Number,
        p2_name: String,
        p2_photo: String,
        isDouble: { type: Boolean, default: false },
        result: {
            type: String,
            enum: ['p1', 'p2', 'draw', null],
            default: null
        }
    }],

    winners: [{
        userId: mongoose.Schema.Types.ObjectId,
        teamName: String,
        managerName: String,
        points: Number,
        fplPoints: Number,
        rank: Number
    }]

}, { timestamps: true });

module.exports = mongoose.model('PvPChallenge', pvpChallengeSchema);