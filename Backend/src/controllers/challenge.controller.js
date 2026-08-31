const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Challenge = require('../models/challenge.model');
const ChallengeParticipant = require('../models/challengeParticipant.model');
const {
    getCurrentGameweek,
    getPointsBeforeGameweek
} = require('../services/fpl.service');
const { finalizeChallengeById } = require('../services/challenge-finalization.service');
const {
    hashInviteCode,
    decryptInviteCode,
    createInviteFields
} = require('../services/invite.service');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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

const challengePayload = (body, { minimumStartEvent = 1 } = {}) => {
    const startEvent = asInteger(body.startEvent, 'جولة البداية', { min: minimumStartEvent, max: 38 });
    const endEvent = asInteger(body.endEvent, 'جولة النهاية', { min: startEvent, max: 38 });

    const descriptionLinks = Array.isArray(body.descriptionLinks)
        ? body.descriptionLinks.slice(0, 10).map((link) => ({
            label: cleanString(link?.label, { required: true, max: 100 }),
            url: cleanString(link?.url, { required: true, max: 2048 })
        }))
        : [];

    for (const link of descriptionLinks) {
        let parsed;
        try { parsed = new URL(link.url); } catch { throw new Error('أحد الروابط غير صالح'); }
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('الروابط يجب أن تبدأ بـ http أو https');
    }

    for (const field of ['image', 'backgroundImage']) {
        const value = cleanString(body[field], { max: 2048 });
        if (!value) continue;
        let parsed;
        try { parsed = new URL(value); } catch { throw new Error(`${field} يجب أن يكون رابطًا صالحًا`); }
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`${field} يجب أن يبدأ بـ http أو https`);
    }

    return {
        title: cleanString(body.title, { required: true, max: 160 }),
        description: cleanString(body.description, { max: 5000 }) || '',
        image: cleanString(body.image, { max: 2048 }) || '',
        backgroundImage: cleanString(body.backgroundImage, { max: 2048 }) || '',
        descriptionLinks,
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
            { min: 1, max: 38, fallback: 38 }
        ),
    };
};

const safeChallenge = (challenge, extras = {}) => {
    const result = challenge?.toObject ? challenge.toObject() : { ...challenge };
    if (!result) return null;
    delete result.inviteCodeHash;
    delete result.inviteCodeCiphertext;
    delete result.joinCode;
    delete result.finalizationError;
    delete result.finalizationStartedAt;
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
    const participant = await ChallengeParticipant.findOne({
        challengeId: challenge._id,
        userId: user._id
    }).lean();
    const owner = sameId(challenge.ownerId, user?._id);

    if (isAdmin(user) || owner) {
        return { allowed: true, isOwner: owner, participant };
    }

    if (challenge.visibility === 'public') {
        return { allowed: true, isOwner: false, participant };
    }

    return { allowed: Boolean(participant), isOwner: false, participant };
};

const eligibilityError = (user, challenge, currentGameweek = Number(user.currentEvent || 0)) => {
    if (challenge.status !== 'active') return 'هذا التحدي غير متاح للانضمام الآن';
    if (Number(currentGameweek || 0) > challenge.endEvent) {
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
    return null;
};

// initialPoints is the participant's scoring baseline, not necessarily the
// baseline of the challenge itself. A user joining late starts scoring from
// the current gameweek, so the baseline is the cumulative total before it.
const startingPointsFor = async (user, challenge, currentGameweek) => {
    const total = Number(user.totalPoints || 0);
    const challengeStart = Number(challenge.startEvent);
    const joinGameweek = Math.max(challengeStart, Number(currentGameweek || 1));

    // The challenge has not started yet. syncMultipleUsers keeps this baseline
    // aligned with the user's FPL total until challengeStart.
    if (Number(currentGameweek || 1) < challengeStart) return total;

    // GW1 has no previous history row. A team created after the previous
    // gameweek also has no row before its first event, so zero is correct.
    if (joinGameweek <= 1 || Number(user.startedEvent || 1) > joinGameweek - 1) {
        return 0;
    }

    // getPointsBeforeGameweek matches history rows by their explicit `event`
    // field. Never use history array indexes as gameweek identifiers.
    return getPointsBeforeGameweek(user.fpl_id, joinGameweek);
};

const enrollUser = async ({ challenge, user, participationType = 'participant' }) => {
    let currentGameweek;
    try {
        currentGameweek = await getCurrentGameweek();
    } catch (error) {
        // Do not create a participant with an ambiguous scoring start. The
        // caller can retry once the FPL bootstrap endpoint is available.
        const serviceError = new Error('تعذر تحديد الجولة الحالية من FPL، حاول مرة أخرى');
        serviceError.status = 503;
        serviceError.cause = error;
        throw serviceError;
    }

    const invalidReason = eligibilityError(user, challenge, currentGameweek);
    if (invalidReason) {
        const error = new Error(invalidReason);
        error.status = 400;
        throw error;
    }

    const initialPoints = await startingPointsFor(user, challenge, currentGameweek);

    const participant = new ChallengeParticipant({
        challengeId: challenge._id,
        userId: user._id,
        participationType,
        initialPoints,
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

const uploadChallengeImage = async (imageData) => {
    const value = String(imageData || '');
    if (!value.startsWith('data:image/')) throw new Error('صورة التحدي غير صالحة');
    // A 5MB browser file is normally < 8MB once encoded as a data URI.
    if (value.length > 10 * 1024 * 1024) throw new Error('حجم صورة التحدي كبير جدًا (الحد 5MB)');
    const upload = await cloudinary.uploader.upload(value, {
        folder: 'fpl_rush_challenges',
        transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
    });
    return upload.secure_url;
};

// Invite codes are generated from a large code space, but checking the hash
// before insert gives callers a deterministic unique code even if a database
// already contains legacy records.
const createUniqueInvite = async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const invite = createInviteFields();
        const taken = await Challenge.exists({ inviteCodeHash: invite.inviteCodeHash });
        if (!taken) return invite;
    }
    throw new Error('تعذر إنشاء كود دعوة فريد، حاول مرة أخرى');
};

// POST /api/challenges/upload-image
// Kept as a small standalone endpoint for clients that want to upload before
// submitting the form. The create endpoint also accepts imageData directly.
exports.uploadChallengeImage = async (req, res) => {
    try {
        if (!req.body?.imageData) return res.status(400).json({ message: 'يرجى اختيار صورة للرفع' });
        const image = await uploadChallengeImage(req.body.imageData);
        res.status(201).json({ image });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// GET /api/challenges/public
exports.getPublicChallenges = async (req, res) => {
    try {
        const challenges = await Challenge.find({
            visibility: 'public',
            status: { $in: ['active', 'closing', 'finished'] }
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
            .filter((entry) => entry.challengeId
                && entry.challengeId.visibility === 'private'
                && !sameId(entry.challengeId.ownerId, req.user._id))
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

// The automatic finalizer is the only safe closing path. Keep this endpoint
// as an administrative retry, but never freeze live profile totals manually.
exports.closeChallengeManual = async (req, res) => {
    try {
        const challenge = await getChallengeOrThrow(req.params.challengeId);
        if (!canManageChallenge(challenge, req.user)) {
            return res.status(403).json({ message: 'لا تملك صلاحية إغلاق هذا التحدي' });
        }

        const result = await finalizeChallengeById(challenge._id);
        if (result.alreadyFinished) {
            return res.status(409).json({ message: 'التحدي مغلق بالفعل' });
        }
        if (result.inProgress) {
            return res.status(409).json({ message: 'جارٍ تثبيت نتائج التحدي' });
        }
        if (!result.finalized) {
            return res.status(409).json({ message: 'لم تصبح الجولة نهائية في FPL بعد' });
        }

        res.json({
            message: `تم تثبيت النتائج (${result.results.length} مشارك)`,
            challenge: safeChallenge(result.challenge)
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

const createChallenge = async (req, res, visibility) => {
    const minimumStartEvent = visibility === 'private'
        ? Math.min(38, Math.max(1, Number(req.user.currentEvent || 1)))
        : 1;
    const payload = challengePayload(req.body, { minimumStartEvent });
    if (req.body.imageData) {
        payload.image = await uploadChallengeImage(req.body.imageData);
    }
    const invite = visibility === 'private' ? await createUniqueInvite() : null;
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
        ownerId: req.user._id,
        createdBy: req.user._id,
        position,
        status: 'active',
        ownerParticipation: 'observer',
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

        if (challenge.status === 'finished' || challenge.status === 'closing' || challenge.status === 'cancelled') {
            return res.status(400).json({ message: 'لا يمكن تعديل تحدٍ منتهٍ أو ملغى' });
        }

        const participantCount = await ChallengeParticipant.countDocuments({ challengeId: challenge._id });
        if (participantCount > 0 || Number(req.user.currentEvent || 0) >= challenge.startEvent) {
            return res.status(409).json({
                message: 'لا يمكن تغيير شروط أو جولات تحدٍ بعد انضمام مشارك أو بدء التحدي'
            });
        }

        const payload = challengePayload({ ...challenge.toObject(), ...req.body }, {
            minimumStartEvent: challenge.startEvent
        });
        if (req.body.imageData) payload.image = await uploadChallengeImage(req.body.imageData);
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

        if (challenge.status === 'closing' || challenge.status === 'finished') {
            return res.status(409).json({ message: 'لا يمكن حذف تحدٍ جارٍ تثبيت نتائجه أو انتهى' });
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

        const invite = await createUniqueInvite();
        challenge.inviteCodeHash = invite.inviteCodeHash;
        challenge.inviteCodeCiphertext = invite.inviteCodeCiphertext;
        challenge.inviteCodeLast4 = invite.inviteCodeLast4;
        await challenge.save();
        res.json({ inviteCode: invite.inviteCode, inviteUrl: `/#/join/${invite.inviteCode}` });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// PATCH /api/challenges/:id/owner-participation
// A challenge owner is an observer by default and can opt into the standings.
exports.setOwnerParticipation = async (req, res) => {
    try {
        const challenge = await getChallengeOrThrow(req.params.id);
        if (challenge.visibility !== 'private' || !sameId(challenge.ownerId, req.user._id)) {
            return res.status(404).json({ message: 'التحدي الخاص غير موجود' });
        }
        // The owner may opt in during the selected starting gameweek. Once
        // that gameweek has fully passed, changing the baseline is unsafe.
        if (challenge.status !== 'active' || Number(req.user.currentEvent || 0) > challenge.startEvent) {
            return res.status(409).json({ message: 'لا يمكن تغيير وضع المالك بعد بدء التحدي' });
        }

        const mode = req.body?.mode;
        if (!['observer', 'participant'].includes(mode)) {
            return res.status(400).json({ message: 'وضع المالك يجب أن يكون observer أو participant' });
        }

        const existing = await ChallengeParticipant.findOne({ challengeId: challenge._id, userId: req.user._id });
        if (mode === 'participant') {
            if (!existing) {
                await enrollUser({ challenge, user: req.user, participationType: 'owner' });
            } else if (existing.participationType !== 'owner') {
                existing.participationType = 'owner';
                await existing.save();
            }
            challenge.ownerParticipation = 'participant';
        } else {
            // The owner is the only account allowed to use this endpoint, so
            // remove any owner participant record when switching to observer.
            if (existing) {
                await existing.deleteOne();
                await Challenge.updateOne({ _id: challenge._id, participantCount: { $gt: 0 } }, { $inc: { participantCount: -1 } });
            }
            challenge.ownerParticipation = 'observer';
        }
        await challenge.save();
        res.json({ ownerParticipation: challenge.ownerParticipation });
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
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
                const isFinalized = challenge.status === 'finished';
                const snapshotValue = (value, fallback) => value === undefined ? fallback : value;
                const challengePoints = isFinalized
                    ? (participant.finalNetPoints === null || participant.finalNetPoints === undefined
                        ? null
                        : Number(participant.finalNetPoints))
                    : challenge.status === 'closing'
                        ? (participant.finalNetPoints === null || participant.finalNetPoints === undefined
                            ? null
                            : Number(participant.finalNetPoints))
                        : Number(user.currentEvent || 0) < challenge.startEvent
                            ? 0
                            : Number(user.totalPoints || 0) - Number(participant.initialPoints || 0);
                return {
                    userId: String(user._id),
                    teamName: isFinalized ? snapshotValue(participant.finalTeamName, user.teamName) : user.teamName,
                    managerName: isFinalized ? snapshotValue(participant.finalManagerName, user.managerName) : user.managerName,
                    avatar: isFinalized ? snapshotValue(participant.finalAvatar, user.avatar) : user.avatar,
                    country: isFinalized ? snapshotValue(participant.finalCountry, user.country) : user.country,
                    challengePoints,
                    finalRank: participant.finalRank || null,
                    joinedAt: participant.joinedAt
                };
            })
            .sort((left, right) => (right.challengePoints ?? -Infinity) - (left.challengePoints ?? -Infinity)
                || new Date(left.joinedAt) - new Date(right.joinedAt));

        res.json(standings);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// Legacy implementation kept for reference; the routed endpoint above uses
// the guarded finalizer and never freezes live profile totals.
exports.legacyCloseChallengeManual = async (req, res) => {
    try {
        return exports.closeChallengeManual(req, res);

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
