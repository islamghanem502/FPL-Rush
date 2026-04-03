const mongoose = require('mongoose');
const PvPChallenge = require('../models/pvpChallenge.model');
const Challenge = require('../models/challenge.model');
const User = require('../models/user.model');
const PvPPrediction = require('../models/pvpPrediction.model');
const fplService = require('../services/fpl.service');
const { isGwDeadlinePassed } = require('../services/fpl.service');

// --- [NEW] Admin: Search Players with Autocomplete ---
exports.searchPlayers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) return res.json([]);

        const allPlayers = await fplService.getPlayersForSearch();

        // فلترة اللاعبين بناءً على الاسم المكتوب
        const filteredPlayers = allPlayers.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.full_name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10); // عرض 10 نتائج فقط للسرعة

        res.json(filteredPlayers);
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب قائمة اللاعبين" });
    }
};

// --- Admin: Create PvP Challenge ---
exports.createPvPChallenge = async (req, res) => {
    try {

        const lastClassic = await Challenge.findOne({}).sort({ position: -1 }).select('position').lean();
        const lastPvP = await PvPChallenge.findOne({}).sort({ position: -1 }).select('position').lean();

        const lastPosClassic = lastClassic?.position || 0;
        const lastPosPvP = lastPvP?.position || 0;
        const newPosition = Math.max(lastPosClassic, lastPosPvP) + 1;


        const pvpChallenge = new PvPChallenge({
            ...req.body,
            position: newPosition,
        });

        await pvpChallenge.save();
        res.status(201).json(pvpChallenge);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --- Admin: Delete PvP Challenge ---
exports.deletePvPChallenge = async (req, res) => {
    try {
        const pvpChallenge = await PvPChallenge.findByIdAndDelete(req.params.id);
        if (!pvpChallenge) {
            return res.status(404).json({ message: 'PvP Challenge not found' });
        }

        await PvPPrediction.deleteMany({ challengeId: req.params.id });

        res.status(200).json({ message: 'تم حذف التحدي وكل التوقعات المرتبطة به بنجاح' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- User & Admin: Get All PvP Challenges ---
exports.getPvPChallenges = async (req, res) => {
    try {
        const pvpChallenges = await PvPChallenge.find({}).sort({ position: 1, createdAt: -1 }).lean();
        res.json(pvpChallenges);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- User: Get Specific PvP Challenge (Matchups) ---
exports.getPvPChallengeById = async (req, res) => {
    try {
        const challenge = await PvPChallenge.findById(req.params.id).lean();
        if (!challenge) return res.status(404).json({ message: "التحدي غير موجود" });

        // Attach live deadline status so frontend can hide prediction form
        const gwDeadlinePassed = await isGwDeadlinePassed(challenge.gw);
        res.json({ ...challenge, gwDeadlinePassed });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- User: Submit PvP Prediction ---
exports.submitPvPPrediction = async (req, res) => {
    try {
        const { id: challengeId } = req.params;
        const userId = req.user.id;
        const { predictions } = req.body;

        const challenge = await PvPChallenge.findById(challengeId);
        if (!challenge) return res.status(404).json({ message: "التحدي غير موجود" });

        if (challenge.status === 'finished') {
            return res.status(400).json({ message: "نعتذر، هذا التحدي انتهى بالفعل" });
        }

        // Block predictions once the GW deadline has passed
        const deadlinePassed = await isGwDeadlinePassed(challenge.gw);
        if (deadlinePassed) {
            return res.status(400).json({ message: "انتهى وقت التوقع، الجولة بدأت بالفعل ⏰" });
        }

        if (!predictions || predictions.length !== challenge.matchups.length) {
            return res.status(400).json({
                message: `يجب تقديم توقعات لكل المقارنات الـ ${challenge.matchups.length} الموجودة.`
            });
        }

        const existingPrediction = await PvPPrediction.findOne({ challengeId, userId });
        if (existingPrediction) {
            return res.status(400).json({ message: "لقد قمت بالفعل بتقديم توقع لهذا التحدي" });
        }

        const newPrediction = new PvPPrediction({
            challengeId,
            userId,
            gw: challenge.gw,
            predictions
        });

        await newPrediction.save();
        res.status(201).json({
            message: "تم حفظ توقعاتك بنجاح! حظ سعيد 🏆",
            prediction: newPrediction
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- User: Get My PvP Prediction ---
exports.getMyPvPPrediction = async (req, res) => {
    try {
        const { id: challengeId } = req.params;
        const userId = req.user.id;
        const prediction = await PvPPrediction.findOne({ challengeId, userId });
        if (!prediction) return res.status(404).json({ message: "لم تقم بتقديم توقعات لهذا التحدي" });
        res.json(prediction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Get PvP Standings (With Live Tie-breaker) ---
exports.getPvPStandings = async (req, res) => {
    try {
        const { id: challengeId } = req.params;

        const standings = await PvPPrediction.aggregate([
            {
                $match: { challengeId: new mongoose.Types.ObjectId(challengeId) }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    _id: 1,
                    totalPoints: 1,
                    fplGwPointsAtTime: '$userInfo.lastGwPoints',
                    fplTotalPointsAtTime: '$userInfo.totalPoints',
                    teamName: '$userInfo.teamName',
                    managerName: '$userInfo.managerName',
                    userId: '$userInfo._id'
                }
            },
            {
                $sort: {
                    totalPoints: -1,
                    fplGwPointsAtTime: -1,
                    fplTotalPointsAtTime: -1
                }
            }
        ]);

        res.status(200).json(standings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Manual Sync for Admin ---
exports.syncPvPResults = async (req, res) => {
    try {
        await fplService.syncPvPChallenges();
        res.status(200).json({ message: "تم تحديث نتائج الـ PvP بنجاح ✅" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Admin: Close PvP Challenge Manually (lock final standings) ---
exports.closePvPChallengeManual = async (req, res) => {
    try {
        const { id: challengeId } = req.params;

        const challenge = await PvPChallenge.findById(challengeId);
        if (!challenge) return res.status(404).json({ message: "التحدي غير موجود" });
        if (challenge.status === 'finished') {
            return res.status(400).json({ message: "هذا التحدي منتهٍ بالفعل" });
        }

        // Get top 3 from current standings
        const topStandings = await PvPPrediction.aggregate([
            { $match: { challengeId: new mongoose.Types.ObjectId(challengeId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    _id: 1,
                    totalPoints: 1,
                    fplGwPointsAtTime: '$userInfo.lastGwPoints',
                    fplTotalPointsAtTime: '$userInfo.totalPoints',
                    teamName: '$userInfo.teamName',
                    managerName: '$userInfo.managerName',
                    userId: '$userInfo._id'
                }
            },
            {
                $sort: {
                    totalPoints: -1,
                    fplGwPointsAtTime: -1,
                    fplTotalPointsAtTime: -1
                }
            },
            { $limit: 3 }
        ]);

        // Save winners and mark as finished
        const updatedChallenge = await PvPChallenge.findByIdAndUpdate(
            challengeId,
            {
                status: 'finished',
                winners: topStandings.map((s, index) => ({
                    userId: s.userId,
                    teamName: s.teamName,
                    managerName: s.managerName,
                    points: s.totalPoints,
                    rank: index + 1
                }))
            },
            { new: true }
        );

        res.status(200).json({
            message: "تم إغلاق تحدي PvP وتحديد الفائزين بنجاح 🏆",
            challenge: updatedChallenge
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};