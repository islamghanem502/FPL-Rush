/*
 * One-time migration from User.joinedChallenges to ChallengeParticipant.
 * Run with --dry-run (default) first, then repeat with --apply.
 */
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user.model');
const Challenge = require('../models/challenge.model');
const ChallengeParticipant = require('../models/challengeParticipant.model');
const { createInviteFields } = require('../services/invite.service');

const apply = process.argv.includes('--apply');
const ownerId = process.env.LEGACY_CHALLENGE_OWNER_ID || null;
const privateIds = new Set(
  String(process.env.LEGACY_PRIVATE_CHALLENGE_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
);

const uniqueInvite = async () => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const invite = createInviteFields();
    if (!await Challenge.exists({ inviteCodeHash: invite.inviteCodeHash })) return invite;
  }
  throw new Error('Unable to allocate a unique invite code');
};

const run = async () => {
  if (!process.env.MONGO_URL) throw new Error('MONGO_URL is not configured');
  await mongoose.connect(process.env.MONGO_URL);

  const stats = {
    users: 0,
    legacyEntries: 0,
    participantsCreated: 0,
    participantsSkipped: 0,
    orphanedLegacyEntries: 0,
    privateChallenges: 0,
    publicVisibilityInitialized: 0,
    membershipFlagsRemoved: 0,
    inviteCodesCreated: 0,
    participantCountsUpdated: 0
  };

  const users = await User.find({}).select('+joinedChallenges');
  stats.users = users.length;

  // Mongoose defaults do not backfill existing MongoDB documents. Explicitly
  // mark legacy records public before applying the selected private IDs.
  const legacyVisibility = await Challenge.countDocuments({ visibility: { $exists: false } });
  stats.publicVisibilityInitialized = legacyVisibility;
  if (apply && legacyVisibility) {
    await Challenge.updateMany({ visibility: { $exists: false } }, { $set: { visibility: 'public' } });
  }

  // This flag is no longer a challenge rule: every player reaches challenges
  // through the linked-FPL flow, so remove stale values from old documents.
  const membershipFlags = await Challenge.countDocuments({ requiresPlatformLeagueMembership: { $exists: true } });
  stats.membershipFlagsRemoved = membershipFlags;
  if (apply && membershipFlags) {
    await Challenge.updateMany({ requiresPlatformLeagueMembership: { $exists: true } }, { $unset: { requiresPlatformLeagueMembership: '' } });
  }

  for (const user of users) {
    const entries = Array.isArray(user.joinedChallenges) ? user.joinedChallenges : [];
    for (const entry of entries) {
      stats.legacyEntries += 1;
      if (!entry.challengeId || !mongoose.isValidObjectId(entry.challengeId)) {
        stats.orphanedLegacyEntries += 1;
        continue;
      }
      const challenge = await Challenge.findById(entry.challengeId);
      if (!challenge) {
        stats.orphanedLegacyEntries += 1;
        continue;
      }
      const exists = await ChallengeParticipant.exists({ challengeId: challenge._id, userId: user._id });
      if (exists) {
        stats.participantsSkipped += 1;
        continue;
      }

      stats.participantsCreated += 1;
      if (apply) {
        await ChallengeParticipant.create({
          challengeId: challenge._id,
          userId: user._id,
          initialPoints: Number(entry.initialPoints ?? user.totalPoints ?? 0),
          finalNetPoints: entry.finalNetPoints ?? null,
          joinedAt: entry.joinedAt || new Date(),
          eligibilitySnapshot: {
            totalPoints: Number(user.totalPoints || 0),
            overallRank: Number(user.overallRank || 0),
            startedEvent: Number(user.startedEvent || 0),
            checkedAt: entry.joinedAt || new Date()
          }
        });
      }
    }
    if (apply && entries.length) {
      await User.updateOne({ _id: user._id }, { $unset: { joinedChallenges: '' } });
    }
  }

  const privateIdList = [...privateIds].filter((id) => mongoose.isValidObjectId(id));
  const challengeFilter = privateIdList.length ? { _id: { $in: privateIdList } } : {};
  const challenges = await Challenge.find(challengeFilter).select('+inviteCodeHash +inviteCodeCiphertext');
  for (const challenge of challenges) {
    const shouldBePrivate = privateIds.has(String(challenge._id)) || challenge.visibility === 'private';
    if (!shouldBePrivate) continue;
    stats.privateChallenges += 1;
    const update = { visibility: 'private' };
    if (!challenge.ownerId && ownerId && mongoose.isValidObjectId(ownerId)) {
      update.ownerId = ownerId;
      update.createdBy = ownerId;
    }
    if (!challenge.inviteCodeHash || !challenge.inviteCodeCiphertext) {
      const invite = await uniqueInvite();
      update.inviteCodeHash = invite.inviteCodeHash;
      update.inviteCodeCiphertext = invite.inviteCodeCiphertext;
      update.inviteCodeLast4 = invite.inviteCodeLast4;
      stats.inviteCodesCreated += 1;
    }
    if (apply) await Challenge.updateOne({ _id: challenge._id }, { $set: update });
  }

  const counts = await ChallengeParticipant.aggregate([{ $group: { _id: '$challengeId', count: { $sum: 1 } } }]);
  const countByChallenge = new Map(counts.map(({ _id, count }) => [String(_id), count]));
  const allChallenges = await Challenge.find({}).select('_id').lean();
  if (apply && allChallenges.length) {
    await Challenge.bulkWrite(allChallenges.map(({ _id }) => ({
      updateOne: {
        filter: { _id },
        update: { $set: { participantCount: countByChallenge.get(String(_id)) || 0 } }
      }
    })));
    stats.participantCountsUpdated = allChallenges.length;
  }

  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...stats }, null, 2));
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
