const mongoose = require('mongoose');
const Challenge = require('../models/challenge.model');
const ChallengeParticipant = require('../models/challengeParticipant.model');
const {
    hashInviteCode,
    decryptInviteCode,
    createInviteFields
} = require('../services/invite.service');

const isAdmin = (user) => user?.role === 'admin';
const sameId = (left, right) => left && right && String(left) === String(right);

const cleanString = (value, { required = false, max = 2000 } = {}) => {
    if (value === undefined || value === null) {
        if (required) throw new Error('هذا الحقل مطلوب');
        return undefined;
    }
    const normalized = String(value).trim();
    if (required && !normalized) throw new Error('هذا الحقل مطلوب');
    if (normalized.length > max) throw new Error('القيمة أطول من المسموح');
    return normalized;
};

const asInteger = (value, field, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback } = {}) => {
    if (value === undefined || value === null || value === '') {
        if (fallback !== undefined) return fallback;
        throw new Error(`${field} مطلوب`);
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${field} غير صالح`);
    }
    return parsed;
};

const challengePayload = (body) => {
    const startEvent = asInteger(body.startEvent, 'جولة البداية', { min: 1, max: 100 });
    const endEvent = asInteger(body.endEvent, 'جولة النهاية', { min: startEvent, max: 100 });

    return {
        title: cleanString(body.title, { required: true, max: 160 }),
        description: cleanString(body.description, { max: 5000 }) || '',
        image: cleanString(body.image, { max: 2048 }) || '',
        backgroundImage: cleanString(body.backgroundImage, { max: 2048 }) || '',
        prize: cleanString(body.prize, { max: 300 }) || '',
        prizeSecond: cleanString(body.prizeSecond, { max: 300 }) || '',
        prizeThird: cleanString(body.prizeThird, { max: 300 }) || '',
        startEvent,
        endEvent,
        minTotalPoints: asInteger(body.minTotalPoints, 'الحد الأدنى للنقاط', { min: 0, max: 100000, fallback: 0 }),
        maxOverallRank: asInteger(body.maxOverallRank, 'أقصى ترتيب عام', { min: 1, max: 100000000, fallback: 10000000 }),
        latestStartedEvent: asInteger(
            body.latestStartedEvent ?? body.minStartedEvent,
            'آخر جولة مسموح البدء فيها',
            { min: 1, max: 100, fallback: 38 }
        ),
        requiresPlatformLeagueMembership: Boolean(body.requiresPlatformLeagueMembership)
    };
};

const safeChallenge = (challenge, extras = {}) => {
    const result = challenge?.toObject ? challenge.toObject() : { ...challenge };
    if (!result) return null;
    delete result.inviteCodeHash;
    delete result.inviteCodeCiphertext;
    delete result.joinCode;
    delete result.__v;
    return { ...result, ...extras };
};

const ensureChallengeId = (id) => {
    if (!mongoose.isValidObjectId(id)) {
        const error = new Error('معرف التحدي غير صالح');
        error.status = 400;
        throw error;
    }
};

const getChallengeOrThrow = async (id, select = '') => {
    ensureChallengeId(id);
    const challenge = await Challenge.findById(id).select(select);
    if (!challenge) {
        const error = new Error('التحدي غير موجود');
        error.status = 404;
        throw error;
    }
    return challenge;
};

const canManageChallenge = (challenge, user) => isAdmin(user)
    || (challenge.visibility === 'private' && sameId(challenge.ownerId, user?._id));

const getAccess = async (challenge, user) => {
    if (isAdmin(user) || sameId(challenge.ownerId, user?._id)) {
        return { allowed: true, isOwner: sameId(challenge.ownerId, user?._id) };
    }

    const participant = await ChallengeParticipant.findOne({
        challengeId: challenge._id,
        userId: user._id
    }).lean();

    if (challenge.visibility === 'public') {
        return { allowed: true, isOwner: false, participant };
    }

    return { allowed: Boolean(participant), isOwner: false, participant };
};

const eligibilityError = (user, challenge) => {
    if (challenge.status !== 'active') return 'هذا التحدي غير متاح للانضمام الآن';
    if (Number(user.currentEvent || 0) > challenge.endEvent) {
        return `انتهى التسجيل لهذا التحدي في الجولة ${challenge.endEvent}`;
    }
    if (Number(user.totalPoints || 0) < challenge.minTotalPoints) {
        return `نقاطك الحالية ${user.totalPoints || 0}، والمطلوب ${challenge.minTotalPoints} على الأقل`;
    }
    if (Number(user.overallRank || Number.MAX_SAFE_INTEGER) > challenge.maxOverallRank) {
        return `ترتيبك العام لا يطابق حد التحدي (#${challenge.maxOverallRank.toLocaleString()})`;
    }
    if (!user.startedEvent || Number(user.startedEvent) > challenge.latestStartedEvent) {
        return `التحدي متاح لمن بدأوا FPL حتى الجولة ${challenge.latestStartedEvent}`;
    }
    if (challenge.requiresPlatformLeagueMembership && !user.isVerified) {
        return 'هذا التحدي يتطلب عضوية دوري FPL Rush';
    }
    return null;
};

const startingPointsFor = (user, challenge) => {
    const total = Number(user.totalPoints || 0);
    if (Number(user.currentEvent || 0) >= challenge.startEvent) {
        return total - Number(user.lastGwPoints || 0);
    }
    return total;
};

const enrollUser = async ({ challenge, user }) => {
    const invalidReason = eligibilityError(user, challenge);
    if (invalidReason) {
        const error = new Error(invalidReason);
        error.status = 400;
        throw error;
    }

    const participant = new ChallengeParticipant({
        challengeId: challenge._id,
        userId: user._id,
        initialPoints: startingPointsFor(user, challenge),
        eligibilitySnapshot: {
            totalPoints: Number(user.totalPoints || 0),
            overallRank: Number(user.overallRank || 0),
            startedEvent: Number(user.startedEvent || 0),
            checkedAt: new Date()
        }
    });

    try {
        await participant.save();
    } catch (error) {
        if (error?.code === 11000) {
            error.message = 'أنت مشترك بالفعل في هذا التحدي';
            error.status = 409;
        }
        throw error;
    }

    await Challenge.updateOne({ _id: challenge._id }, { $inc: { participantCount: 1 } });
    return participant;
};

// GET /api/challenges/public
exports.getPublicChallenges = async (req, res) => {
    try {
        const challenges = await Challenge.find({
            visibility: 'public',
            status: { $in: ['active', 'finished'] }
        })
            .sort({ position: 1, createdAt: -1 })
            .lean();

        res.json(challenges.map((challenge) => safeChallenge(challenge)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Legacy alias kept while clients move to /public.
exports.getChallenges = exports.getPublicChallenges;

// GET /api/challenges/mine
exports.getMyChallenges = async (req, res) => {
    try {
        const [owned, joinedEntries] = await Promise.all([
            Challenge.find({ ownerId: req.user._id, visibility: 'private' })
                .sort({ createdAt: -1 })
                .lean(),
            ChallengeParticipant.find({ userId: req.user._id })
                .sort({ joinedAt: -1 })
                .populate({ path: 'challengeId' })
                .lean()
        ]);

        const joined = joinedEntries
            .filter((entry) => entry.challengeId)
            .map((entry) => safeChallenge(entry.challengeId, {
                myParticipant: {
                    id: entry._id,
                    joinedAt: entry.joinedAt,
                    initialPoints: entry.initialPoints,
                    finalNetPoints: entry.finalNetPoints
                }
            }));

        res.json({
            owned: owned.map((challenge) => safeChallenge(challenge, { isOwner: true })),
            joined
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/challenges/:id
exports.getChallenge = async (req, res) => {
    try {
        const challenge = await getChallengeOrThrow(req.params.id);
        const access = await getAccess(challenge, req.user);
        if (!access.allowed) return res.status(404).json({ message: 'التحدي غير موجود' });

        res.json(safeChallenge(challenge, {
            isOwner: access.isOwner,
            isJoined: Boolean(access.participant)
        }));
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

const createChallenge = async (req, res, visibility) => {
    const payload = challengePayload(req.body);
    const invite = visibility === 'private' ? createInviteFields() : null;
    let position = 0;

    if (visibility === 'public') {
        const last = await Challenge.findOne({ visibility: 'public' })
            .sort({ position: -1 })
            .select('position')
            .lean();
        if (last && Number.isFinite(last.position)) position = last.position + 1;
    }

    const challenge = await Challenge.create({
        ...payload,
        visibility,
        ownerId: visibility === 'private' ? req.user._id : req.user._id,
        createdBy: req.user._id,
        position,
        status: 'active',
        ...(invite && {
            inviteCodeHash: invite.inviteCodeHash,
            inviteCodeCiphertext: invite.inviteCodeCiphertext,
            inviteCodeLast4: invite.inviteCodeLast4
        })
    });

    const response = safeChallenge(challenge, { isOwner: true });
    if (invite) {
        response.inviteCode = invite.inviteCode;
        response.inviteUrl = `/#/join/${invite.inviteCode}`;
    }
    return response;
};

// POST /api/challenges/private
exports.createPrivateChallenge = async (req, res) => {
    try {
        const challenge = await createChallenge(req, res, 'private');
        res.status(201).json(challenge);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// POST /api/challenges/public (admin only)
exports.createPublicChallenge = async (req, res) => {
    try {
        const challenge = await createChallenge(req, res, 'public');
        res.status(201).json(challenge);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Legacy alias for the existing admin client.
exports.createChallenge = exports.createPublicChallenge;

// PATCH /api/challenges/:id
exports.updateChallenge = async (req, res) => {
    try {
        const challenge = await getChallengeOrThrow(req.params.id);
        if (!canManageChallenge(challenge, req.user)) {
            return res.status(403).json({ message: 'لا تملك صلاحية تعديل هذا التحدي' });
        }

        if (challenge.status === 'finished' || challenge.status === 'cancelled') {
            return res.status(400).json({ message: 'لا يمكن تعديل تحدٍ منتهٍ أو ملغى' });
        }

        const participantCount = await ChallengeParticipant.countDocuments({ challengeId: challenge._id });
        if (participantCount > 0 || Number(req.user.currentEvent || 0) >= challenge.startEvent) {
            return res.status(409).json({
                message: 'لا يمكن تغيير شروط أو جولات تحدٍ بعد انضمام مشارك أو بدء التحدي'
            });
        }

        const payload = challengePayload({ ...challenge.toObject(), ...req.body });
        Object.assign(challenge, payload);
        await challenge.save();
        res.json(safeChallenge(challenge, { isOwner: sameId(challenge.ownerId, req.user._id) }));
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
};

// DELETE /api/challenges/:id
exports.deleteChallenge = async (req, res) => {
    try {
        const challenge = await getChallengeOrThrow(req.params.id);
        if (!canManageChallenge(challenge, req.user)) {
            return res.status(403).json({ message: 'لا تملك صلاحية حذف هذا التحدي' });
        }

        const participantCount = await ChallengeParticipant.countDocuments({ challengeId: challenge._id });
        if (participantCount > 0) {
            return res.status(409).json({
                message: 'لا يمكن حذف تحدٍ له مشاركون؛ أغلقه أو ألغِه للحفاظ على السجل'
            });
        }

        await challenge.deleteOne();
        res.status(200).json({ message: 'تم حذف التحدي بنجاح' });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// POST /api/challenges/reorder (admin only, public challenges only)
exports.reorderChallenges = async (req, res) => {
    try {
        const orderedIds = Array.isArray(req.body)
            ? req.body
            : Array.isArray(req.body?.orderedIds)
                ? req.body.orderedIds
                : null;

        if (!orderedIds?.length) {
            return res.status(400).json({ message: 'orderedIds array is required' });
        }

        const normalized = [...new Set(orderedIds.map((id) => String(id).trim()))];
        if (normalized.some((id) => !mongoose.isValidObjectId(id))) {
            return res.status(400).json({ message: 'كل المعرفات يجب أن تكون صالحة' });
        }

        const publicCount = await Challenge.countDocuments({
            _id: { $in: normalized },
            visibility: 'public'
        });
        if (publicCount !== normalized.length) {
            return res.status(400).json({ message: 'يمكن ترتيب التحديات العامة فقط' });
        }

        await Challenge.bulkWrite(normalized.map((id, index) => ({
            updateOne: {
                filter: { _id: id, visibility: 'public' },
                update: { $set: { position: index } }
            }
        })));

        res.json({ message: 'تم حفظ الترتيب' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/challenges/:id/invite (private owner/admin only)
exports.getPrivateInvite = async (req, res) => {
    try {
        const challenge = await getChallengeOrThrow(req.params.id, '+inviteCodeCiphertext');
        if (challenge.visibility !== 'private' || !canManageChallenge(challenge, req.user)) {
            return res.status(404).json({ message: 'رابط الدعوة غير موجود' });
        }

        const inviteCode = decryptInviteCode(challenge.inviteCodeCiphertext);
        if (!inviteCode) return res.status(409).json({ message: 'لا يوجد كود دعوة صالح؛ أنشئ كودًا جديدًا' });
        res.json({ inviteCode, inviteUrl: `/#/join/${inviteCode}` });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// POST /api/challenges/:id/invite/rotate (private owner/admin only)
exports.rotatePrivateInvite = async (req, res) => {
    try {
        const challenge = await getChallengeOrThrow(req.params.id, '+inviteCodeHash +inviteCodeCiphertext');
        if (challenge.visibility !== 'private' || !canManageChallenge(challenge, req.user)) {
            return res.status(404).json({ message: 'التحدي الخاص غير موجود' });
        }

        const invite = createInviteFields();
        challenge.inviteCodeHash = invite.inviteCodeHash;
        challenge.inviteCodeCiphertext = invite.inviteCodeCiphertext;
        challenge.inviteCodeLast4 = invite.inviteCodeLast4;
        await challenge.save();
        res.json({ inviteCode: invite.inviteCode, inviteUrl: `/#/join/${invite.inviteCode}` });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

const findPrivateInvite = async (inviteCode) => {
    const codeHash = hashInviteCode(inviteCode);
    return Challenge.findOne({ visibility: 'private', inviteCodeHash: codeHash });
};

// GET /api/challenges/invite/:inviteCode
exports.previewPrivateInvite = async (req, res) => {
    try {
        const challenge = await findPrivateInvite(req.params.inviteCode);
        if (!challenge) return res.status(404).json({ message: 'رابط الدعوة غير صالح أو انتهت صلاحيته' });
        const alreadyJoined = await ChallengeParticipant.exists({ challengeId: challenge._id, userId: req.user._id });
        res.json(safeChallenge(challenge, {
            isInvitePreview: true,
            isJoined: Boolean(alreadyJoined),
            canJoin: !alreadyJoined && !eligibilityError(req.user, challenge)
        }));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// POST /api/challenges/invite/:inviteCode/enroll
exports.enrollWithPrivateInvite = async (req, res) => {
    try {
        const challenge = await findPrivateInvite(req.params.inviteCode);
        if (!challenge) return res.status(404).json({ message: 'رابط الدعوة غير صالح أو انتهت صلاحيته' });
        const participant = await enrollUser({ challenge, user: req.user });
        res.status(201).json({
            message: 'تم الانضمام إلى التحدي الخاص بنجاح',
            challengeId: challenge._id,
            participantId: participant._id
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// POST /api/challenges/:challengeId/enroll (public only)
exports.enrollInChallenge = async (req, res) => {
    try {
        const challenge = await getChallengeOrThrow(req.params.challengeId);
        if (challenge.visibility !== 'public') {
            return res.status(400).json({ message: 'استخدم رابط الدعوة للانضمام إلى التحدي الخاص' });
        }
        const participant = await enrollUser({ challenge, user: req.user });
        res.status(201).json({
            message: 'تم الانضمام إلى التحدي بنجاح',
            challengeId: challenge._id,
            participantId: participant._id
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// GET /api/challenges/:challengeId/standings
exports.getChallengeStandings = async (req, res) => {
    try {
        const challenge = await getChallengeOrThrow(req.params.challengeId);
        const access = await getAccess(challenge, req.user);
        if (!access.allowed) return res.status(404).json({ message: 'التحدي غير موجود' });

        const participants = await ChallengeParticipant.find({ challengeId: challenge._id })
            .sort({ joinedAt: 1 })
            .populate({ path: 'userId', select: 'teamName managerName totalPoints currentEvent avatar country' })
            .lean();

        const standings = participants
            .filter((participant) => participant.userId)
            .map((participant) => {
                const user = participant.userId;
                const challengePoints = challenge.status === 'finished'
                    ? Number(participant.finalNetPoints || 0)
                    : Number(user.currentEvent || 0) < challenge.startEvent
                        ? 0
                        : Number(user.totalPoints || 0) - Number(participant.initialPoints || 0);
                return {
                    userId: String(user._id),
                    teamName: user.teamName,
                    managerName: user.managerName,
                    avatar: user.avatar,
                    country: user.country,
                    challengePoints,
                    joinedAt: participant.joinedAt
                };
            })
            .sort((left, right) => right.challengePoints - left.challengePoints
                || new Date(left.joinedAt) - new Date(right.joinedAt));

        res.json(standings);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// PATCH /api/challenges/:challengeId/close
exports.closeChallengeManual = async (req, res) => {
    try {
        const challenge = await getChallengeOrThrow(req.params.challengeId);
        if (!canManageChallenge(challenge, req.user)) {
            return res.status(403).json({ message: 'لا تملك صلاحية إغلاق هذا التحدي' });
        }
        if (challenge.status === 'finished') {
            return res.status(409).json({ message: 'التحدي مغلق بالفعل' });
        }

        const participants = await ChallengeParticipant.find({ challengeId: challenge._id })
            .populate({ path: 'userId', select: 'teamName managerName totalPoints currentEvent' })
            .lean();

        const standings = participants
            .filter((participant) => participant.userId)
            .map((participant) => ({
                participantId: participant._id,
                userId: participant.userId._id,
                teamName: participant.userId.teamName,
                managerName: participant.userId.managerName,
                points: Number(participant.userId.currentEvent || 0) < challenge.startEvent
                    ? 0
                    : Number(participant.userId.totalPoints || 0) - Number(participant.initialPoints || 0),
                joinedAt: participant.joinedAt
            }))
            .sort((left, right) => right.points - left.points || new Date(left.joinedAt) - new Date(right.joinedAt));

        if (standings.length) {
            await ChallengeParticipant.bulkWrite(standings.map((entry) => ({
                updateOne: {
                    filter: { _id: entry.participantId },
                    update: { $set: { finalNetPoints: entry.points } }
                }
            })));
        }

        challenge.status = 'finished';
        challenge.winners = standings.slice(0, 3).map((entry, index) => ({
            userId: entry.userId,
            teamName: entry.teamName,
            managerName: entry.managerName,
            points: entry.points,
            rank: index + 1
        }));
        challenge.participantCount = participants.length;
        await challenge.save();

        res.json({
            message: `تم إغلاق التحدي وتثبيت النتائج (${standings.length} مشارك)`,
            challenge: safeChallenge(challenge)
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
