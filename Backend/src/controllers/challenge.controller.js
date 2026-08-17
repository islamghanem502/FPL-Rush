const mongoose = require('mongoose');
const Challenge = require('../models/challenge.model');
const User = require('../models/user.model');


// For Admin Create Challenge
exports.createChallenge = async (req, res) => {
    try {
        // Auto-append challenge at the end of the current order
        let position = 0;
        const last = await Challenge.findOne({}).sort({ position: -1 }).select('position').lean();
        if (last && Number.isFinite(last.position)) position = last.position + 1;

        const challenge = new Challenge({ ...req.body, position });
        await challenge.save();
        res.status(201).json(challenge);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findByIdAndDelete(req.params.id);
        if (!challenge) return res.status(404).json({ message: "التحدي غير موجود" });
        res.status(200).json({ message: "تم الحذف بنجاح" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// for user and Admin
exports.getChallenges = async (req, res) => {
    try {
        // Return challenges in the persisted admin-defined order.
        // Also does a lightweight migration if old docs have displayOrder but no position yet.
        const challenges = await Challenge.find({})
            .sort({ position: 1, displayOrder: 1, createdAt: -1 })
            .lean();

        const needsMigration = challenges.some(c => c.position === undefined || c.position === null);
        if (needsMigration) {
            const bulkOps = [];
            challenges.forEach((c, idx) => {
                if (c.position === undefined || c.position === null) {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: c._id },
                            update: { $set: { position: idx } }
                        }
                    });
                    c.position = idx;
                }
            });
            if (bulkOps.length) {
                await Challenge.bulkWrite(bulkOps, { ordered: false });
            }
        }

        res.json(challenges);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin reorder challenges (drag & drop)
exports.reorderChallenges = async (req, res) => {
    try {
        const body = req.body;
        const orderedIds = Array.isArray(body)
            ? body
            : Array.isArray(body?.orderedIds)
                ? body.orderedIds
                : Array.isArray(body?.ids)
                    ? body.ids
                    : null;

        if (!orderedIds || !orderedIds.length) {
            return res.status(400).json({ message: "orderedIds array is required" });
        }

        const seen = new Set();
        const normalized = [];
        for (const id of orderedIds) {
            if (typeof id !== 'string' || !id.trim()) {
                return res.status(400).json({ message: "All IDs must be non-empty strings" });
            }
            const s = id.trim();
            if (seen.has(s)) continue;
            seen.add(s);
            normalized.push(s);
        }

        const bulkOps = normalized.map((id, index) => ({
            updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(id) },
                update: { $set: { position: index } }
            }
        }));

        await Challenge.bulkWrite(bulkOps, { ordered: false });

        res.status(200).json({ message: "Reordered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Enroll Challenge 
exports.enrollInChallenge = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const userId = req.user.id;

        const challenge = await Challenge.findById(challengeId);
        const user = await User.findById(userId);

        if (!challenge) return res.status(404).json({ message: "التحدي غير موجود" });

        // إذا كان التحدي يتطلب كود انضمام، التحقق من تطابقه
        const providedCode = (req.body && req.body.joinCode) ? String(req.body.joinCode).trim() : '';
        if (challenge.joinCode && challenge.joinCode.trim()) {
            if (!providedCode || providedCode !== challenge.joinCode.trim()) {
                return res.status(400).json({ message: "كود الانضمام غير صحيح أو مطلوب للانضمام لهذا التحدي" });
            }
        }

        // منع الانضمام إذا كان التحدي قد انتهى زمنياً
        if (user.currentEvent > challenge.endEvent) {
            return res.status(400).json({
                message: `نعتذر، هذا التحدي انتهى في الجولة ${challenge.endEvent}. لا يمكنك الانضمام الآن.`
            });
        }

        const alreadyJoined = user.joinedChallenges.some(c => c.challengeId.toString() === challengeId);
        if (alreadyJoined) return res.status(400).json({ message: "أنت مشترك بالفعل في هذا التحدي" });

        // شروط الإدارة (نقاط، ترتيب، جولة البداية)
        if (user.totalPoints < challenge.minTotalPoints) {
            return res.status(400).json({ message: `نقطك الحالية ${user.totalPoints}، المطلوب على الأقل ${challenge.minTotalPoints}` });
        }

        if (user.overallRank > challenge.maxOverallRank) {
            return res.status(400).json({ message: `ترتيبك العالمي ${user.overallRank}، المطلوب أقل من ${challenge.maxOverallRank}` });
        }

        if (user.playerStartedEvent > challenge.minStartedEvent) {
            return res.status(400).json({ message: `هذا التحدي مخصص للمدربين الذين بدأوا قبل الجولة ${challenge.minStartedEvent}` });
        }

        /**
         * 💡 اللوجيك المطور لضمان احتساب نقاط الجولة الحالية:
         * إذا دخل المستخدم في الجولة 29 والتحدي يبدأ من 29، نطرح نقاطه في الجولة 29 من الـ initialPoints
         * لكي تظهر له نقاط الجولة 29 بالكامل في الـ challengePoints لاحقاً.
         */
        let startingPoints = user.totalPoints;

        // إذا كان التحدي قد بدأ (أو نحن في جولة البداية)
        if (user.currentEvent >= challenge.startEvent) {
            // نطرح نقاط الجولة الحالية التي جمعها حتى لحظة الاشتراك
            // ملاحظة: lastGwPoints تعبر عن نقاطه في الجولة الحالية حتى الآن
            startingPoints = user.totalPoints - (user.lastGwPoints || 0);
        }

        user.joinedChallenges.push({
            challengeId: challenge._id,
            initialPoints: startingPoints,
            joinedAt: new Date()
        });

        await user.save();

        res.status(200).json({
            message: "تم الانضمام بنجاح! سيتم احتساب نقاطك من بداية الجولة الحالية 🏆",
            joinedChallenges: user.joinedChallenges
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Challenge Standings
exports.getChallengeStandings = async (req, res) => {
    try {
        const { challengeId } = req.params;

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) return res.status(404).json({ message: "التحدي غير موجود" });

        // ── Finished challenge → read frozen finalNetPoints ───────────────────
        if (challenge.status === 'finished') {
            const standings = await User.aggregate([
                { $match: { "joinedChallenges.challengeId": new mongoose.Types.ObjectId(challengeId) } },
                { $unwind: "$joinedChallenges" },
                { $match: { "joinedChallenges.challengeId": new mongoose.Types.ObjectId(challengeId) } },
                {
                    $project: {
                        teamName: 1,
                        managerName: 1,
                        totalPoints: 1,
                        // finalNetPoints is set once on close — guaranteed not null here
                        challengePoints: { $ifNull: ["$joinedChallenges.finalNetPoints", 0] },
                        joinedAt: "$joinedChallenges.joinedAt"
                    }
                },
                { $sort: { challengePoints: -1, joinedAt: 1 } }
            ]);
            return res.status(200).json(standings);
        }

        // ── Active challenge → live calculation (totalPoints - initialPoints) ─
        const standings = await User.aggregate([
            { $match: { "joinedChallenges.challengeId": new mongoose.Types.ObjectId(challengeId) } },
            { $unwind: "$joinedChallenges" },
            { $match: { "joinedChallenges.challengeId": new mongoose.Types.ObjectId(challengeId) } },
            {
                $project: {
                    teamName: 1,
                    managerName: 1,
                    totalPoints: 1,
                    challengePoints: {
                        $cond: {
                            if: { $lt: ["$currentEvent", challenge.startEvent] },
                            then: 0,
                            else: { $subtract: ["$totalPoints", "$joinedChallenges.initialPoints"] }
                        }
                    },
                    joinedAt: "$joinedChallenges.joinedAt"
                }
            },
            { $sort: { challengePoints: -1, joinedAt: 1 } }
        ]);

        res.status(200).json(standings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Close challenge by Admin
exports.closeChallengeManual = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const objId = new mongoose.Types.ObjectId(challengeId);

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) return res.status(404).json({ message: "التحدي غير موجود" });

        // ── Step 1: Calculate final net points for ALL participants ───────────
        const allStandings = await User.aggregate([
            { $match: { "joinedChallenges.challengeId": objId } },
            { $unwind: "$joinedChallenges" },
            { $match: { "joinedChallenges.challengeId": objId } },
            {
                $project: {
                    teamName: 1,
                    managerName: 1,
                    challengePoints: { $subtract: ["$totalPoints", "$joinedChallenges.initialPoints"] }
                }
            },
            { $sort: { challengePoints: -1 } }
        ]);

        // ── Step 2: Persist finalNetPoints on every participant's subdocument ─
        const bulkOps = allStandings.map(s => ({
            updateOne: {
                filter: {
                    _id: s._id,
                    "joinedChallenges.challengeId": objId
                },
                update: {
                    $set: { "joinedChallenges.$.finalNetPoints": s.challengePoints }
                }
            }
        }));

        if (bulkOps.length) {
            await User.bulkWrite(bulkOps, { ordered: false });
        }

        // ── Step 3: Mark challenge as finished + save top-3 winners ──────────
        const top3 = allStandings.slice(0, 3);
        const updatedChallenge = await Challenge.findByIdAndUpdate(
            challengeId,
            {
                status: 'finished',
                winners: top3.map((s, index) => ({
                    userId: s._id,
                    teamName: s.teamName,
                    managerName: s.managerName,
                    points: s.challengePoints,
                    rank: index + 1
                }))
            },
            { new: true }
        );

        res.status(200).json({
            message: `تم إغلاق التحدي وتحديد الفائزين بنجاح 🏆 (${allStandings.length} مشارك)`,
            challenge: updatedChallenge
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};