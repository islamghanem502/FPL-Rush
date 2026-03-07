const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // User Data
    teamId: {
        type: Number,          
        required: true,
        unique: true           
    },

    teamName: {
        type: String,
        trim: true
    },

    managerName: {
        type: String,
        trim: true
    },
        
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true 
    },

    password: {          
        type: String,
        required: true,
        minlength: 6
    },

    // FPL data - for ( CRON ) 
    startedEvent: {
        type: Number,
        required: true
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

    // is Verified (Joined to FPL RUSH league)
    isVerified: {
        type: Boolean,
        default: false
    },

    // To join Challenge
    joinedChallenges: [{
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    initialPoints: { type: Number, default: 0 }, // إجمالي نقاط اللاعب لحظة الدخول
    joinedAt: { type: Date, default: Date.now }
    }],

    // For Auth
    otp: {                
        type: String,
    },

    otpExpiry: {
        type: Date,
    },
    
    role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
},

}, { 
    timestamps: true 
});



// 🔐 Hide sensitive fields
UserSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.otp;
    delete user.otpExpiry;
    return user;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
