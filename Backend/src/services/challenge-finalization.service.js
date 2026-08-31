const Challenge = require('../models/challenge.model');
const ChallengeParticipant = require('../models/challengeParticipant.model');
const {
    getBootstrapStatic,
    getFixturesForGameweek,
    getEventStatus,
    getUserFplHistoryStrict
} = require('./fpl.service');

const STALE_CLOSING_AFTER_MS = 30 * 60 * 1000;

const isTruthyFlag = (value) => value === true || value === 1 || value === '1' || value === 'true';

const statusEntries = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.status)) return payload.status;
    if (payload?.status && typeof payload.status === 'object') return [payload.status];
    return [];
};

const findEventStatus = (payload, gameweek) => statusEntries(payload)
    .find((entry) => Number(entry.event) === Number(gameweek));

// This is the single finality gate used by both cron and the protected manual
// endpoint. It intentionally waits for the event to be checked and for every
// fixture to be finished. event-status is an additional confirmation when FPL
// provides it; older responses may omit the per-event status after the season.
const isFinalEventData = ({ event, fixtures = [], statusEntry }) => {
    if (!event || !isTruthyFlag(event.finished) || !isTruthyFlag(event.data_checked)) return false;

    const fixturesComplete = fixtures.length === 0
        || fixtures.every((fixture) => isTruthyFlag(fixture.finished));
    if (!fixturesComplete) return false;

    if (!statusEntry) return true;

    const status = String(statusEntry.status || '').toLowerCase();
    const statusFinal = ['a', 'f', 'final', 'finished', 'complete', 'completed'].includes(status);
    const bonusReady = statusEntry.bonus_added === undefined || isTruthyFlag(statusEntry.bonus_added);
    const leaguesReady = statusEntry.league_updates === undefined || isTruthyFlag(statusEntry.league_updates);

    return statusEntry.status === undefined
        ? (bonusReady && leaguesReady)
        : (statusFinal && bonusReady && leaguesReady);
};

const getFinalityContext = async (gameweek, { bootstrap, eventStatus, fixtures } = {}) => {
    const bootstrapData = bootstrap || await getBootstrapStatic();
    const event = (bootstrapData.events || []).find((entry) => Number(entry.id) === Number(gameweek));
    if (!event) return { ready: false, reason: 'FPL event not found', event: null, fixtures: [] };

    const fixturesData = fixtures || await getFixturesForGameweek(gameweek);
    const statusData = eventStatus || await getEventStatus();
    const statusEntry = findEventStatus(statusData, gameweek);

    const ready = isFinalEventData({ event, fixtures: fixturesData, statusEntry });
    return {
        ready,
        reason: ready
            ? null
            : 'FPL has not marked this gameweek as final',
        event,
        fixtures: fixturesData,
        statusEntry
    };
};

const historyRowForEvent = (history, gameweek) => history.current
    .find((row) => Number(row.event) === Number(gameweek));

const numericTotalPoints = (row) => {
    const value = Number(row?.total_points);
    return Number.isFinite(value) ? value : null;
};

const loadHistories = async (participants) => {
    const fplIds = [...new Set(participants
        .map((participant) => participant.userId?.fpl_id)
        .filter(Boolean)
        .map(String))];
    const histories = new Map();
    let cursor = 0;
    const workerCount = Math.min(5, fplIds.length);

    const worker = async () => {
        while (cursor < fplIds.length) {
            const id = fplIds[cursor++];
            histories.set(id, await getUserFplHistoryStrict(id));
        }
    };

    await Promise.all(Array.from({ length: workerCount }, worker));
    return histories;
};

const buildFinalResults = async (challenge) => {
    const participants = await ChallengeParticipant.find({ challengeId: challenge._id })
        .populate({
            path: 'userId',
            select: 'fpl_id teamName managerName avatar country'
        })
        .lean();

    const historyCache = await loadHistories(participants);
    const results = [];

    for (const participant of participants) {
        const user = participant.userId;
        if (!user?.fpl_id) {
            const error = new Error('أحد المشاركين لا يملك FPL ID صالحًا');
            error.code = 'PARTICIPANT_FPL_ID_MISSING';
            throw error;
        }

        const history = historyCache.get(String(user.fpl_id));
        if (!history) {
            const error = new Error(`تعذر جلب سجل النقاط للفريق ${user.fpl_id}`);
            error.code = 'FPL_HISTORY_INCOMPLETE';
            throw error;
        }
        const endRow = historyRowForEvent(history, challenge.endEvent);
        const finalTotal = numericTotalPoints(endRow);
        const initialPoints = Number(participant.initialPoints);

        if (finalTotal === null || !Number.isFinite(initialPoints)) {
            const error = new Error(`سجل النقاط للجولة ${challenge.endEvent} غير مكتمل للفريق ${user.fpl_id}`);
            error.code = 'FPL_HISTORY_INCOMPLETE';
            throw error;
        }

        results.push({
            participantId: participant._id,
            userId: user._id,
            fplId: user.fpl_id,
            teamName: user.teamName || '',
            managerName: user.managerName || '',
            avatar: user.avatar || null,
            country: user.country || null,
            points: finalTotal - initialPoints,
            joinedAt: participant.joinedAt
        });
    }

    return results.sort((left, right) => right.points - left.points
        || new Date(left.joinedAt) - new Date(right.joinedAt)
        || String(left.userId).localeCompare(String(right.userId)));
};

const finishClaimedChallenge = async (challenge) => {
    const results = await buildFinalResults(challenge);
    const finalizedAt = new Date();

    if (results.length) {
        await ChallengeParticipant.bulkWrite(results.map((entry, index) => ({
            updateOne: {
                filter: { _id: entry.participantId, challengeId: challenge._id },
                update: {
                    $set: {
                        finalNetPoints: entry.points,
                        finalRank: index + 1,
                        finalTeamName: entry.teamName,
                        finalManagerName: entry.managerName,
                        finalAvatar: entry.avatar,
                        finalCountry: entry.country
                    }
                }
            }
        })), { ordered: true });
    }

    const winners = results.slice(0, 3).map((entry, index) => ({
        userId: entry.userId,
        teamName: entry.teamName,
        managerName: entry.managerName,
        points: entry.points,
        rank: index + 1
    }));

    const finished = await Challenge.findOneAndUpdate(
        { _id: challenge._id, status: 'closing' },
        {
            $set: {
                status: 'finished',
                winners,
                participantCount: results.length,
                finalizedAt
            },
            $unset: { finalizationStartedAt: '', finalizationError: '' }
        },
        { new: true }
    );

    if (!finished) {
        const error = new Error('تعذر تثبيت حالة التحدي بعد حفظ النتائج');
        error.code = 'CHALLENGE_FINAL_STATE_WRITE_FAILED';
        throw error;
    }

    return { finalized: true, challenge: finished, results };
};

const claimChallenge = async (challengeId) => Challenge.findOneAndUpdate(
    { _id: challengeId, status: 'active' },
    {
        $set: { status: 'closing', finalizationStartedAt: new Date() },
        $unset: { finalizationError: '' }
    },
    { new: true }
);

const finalizeChallengeById = async (challengeId, { context } = {}) => {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
        const error = new Error('التحدي غير موجود');
        error.status = 404;
        throw error;
    }
    if (challenge.status === 'finished') return { finalized: false, alreadyFinished: true, challenge };
    if (challenge.status !== 'active') return { finalized: false, inProgress: challenge.status === 'closing', challenge };

    const finality = context || await getFinalityContext(challenge.endEvent);
    if (!finality.ready) return { finalized: false, reason: finality.reason, challenge };

    const claimed = await claimChallenge(challenge._id);
    if (!claimed) {
        const latest = await Challenge.findById(challenge._id);
        return {
            finalized: false,
            alreadyFinished: latest?.status === 'finished',
            inProgress: latest?.status === 'closing',
            challenge: latest || challenge
        };
    }

    try {
        return await finishClaimedChallenge(claimed);
    } catch (error) {
        await Challenge.updateOne(
            { _id: claimed._id, status: 'closing' },
            {
                $set: {
                    status: 'active',
                    finalizationError: error.message,
                    finalizationStartedAt: null
                }
            }
        );
        throw error;
    }
};

const recoverStaleClosingChallenges = async () => {
    const cutoff = new Date(Date.now() - STALE_CLOSING_AFTER_MS);
    return Challenge.updateMany(
        { status: 'closing', finalizationStartedAt: { $lt: cutoff } },
        {
            $set: {
                status: 'active',
                finalizationError: 'تمت إعادة المحاولة بعد توقف عملية التثبيت السابقة',
                finalizationStartedAt: null
            }
        }
    );
};

const finalizeEligibleChallenges = async () => {
    await recoverStaleClosingChallenges();

    const challenges = await Challenge.find({
        status: 'active',
        endEvent: { $gte: 1, $lte: 38 }
    }).select('_id endEvent status');

    if (!challenges.length) return { checked: 0, finalized: 0 };

    let bootstrap;
    let eventStatus;
    try {
        [bootstrap, eventStatus] = await Promise.all([
            getBootstrapStatic(),
            getEventStatus()
        ]);
    } catch (error) {
        console.error('Automatic challenge finalization postponed:', error.message);
        return { checked: challenges.length, finalized: 0, postponed: challenges.length };
    }

    const contexts = new Map();
    const uniqueGameweeks = [...new Set(challenges.map((challenge) => Number(challenge.endEvent)))];
    for (const gameweek of uniqueGameweeks) {
        try {
            const fixtures = await getFixturesForGameweek(gameweek);
            contexts.set(gameweek, await getFinalityContext(gameweek, { bootstrap, eventStatus, fixtures }));
        } catch (error) {
            console.error(`Could not verify finality for GW${gameweek}:`, error.message);
            contexts.set(gameweek, { ready: false, reason: error.message });
        }
    }

    let finalized = 0;
    for (const challenge of challenges) {
        const context = contexts.get(Number(challenge.endEvent));
        if (!context?.ready) continue;
        try {
            const result = await finalizeChallengeById(challenge._id, { context });
            if (result.finalized) finalized += 1;
        } catch (error) {
            console.error(`Failed to finalize challenge ${challenge._id}:`, error.message);
        }
    }

    return { checked: challenges.length, finalized };
};

module.exports = {
    isFinalEventData,
    getFinalityContext,
    finalizeChallengeById,
    finalizeEligibleChallenges,
    recoverStaleClosingChallenges
};
