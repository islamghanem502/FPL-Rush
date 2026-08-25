# Challenge migration

The new challenge system separates public/private visibility and moves
participation records from `User.joinedChallenges` into
`ChallengeParticipant`.

## Before deployment

1. Back up MongoDB.
2. Create a long random `INVITE_CODE_SECRET` in the Backend environment. It
   encrypts private invite codes and must not be changed after launch.
3. List every old challenge that should become private. Old challenges without
   an explicit private ID are treated as public because that is how the legacy
   dashboard exposed them.
4. Choose the admin user ObjectId that owns legacy challenges.

## Dry run

```powershell
$env:LEGACY_CHALLENGE_OWNER_ID = "ADMIN_OBJECT_ID"
$env:LEGACY_PRIVATE_CHALLENGE_IDS = "PRIVATE_CHALLENGE_ID_1,PRIVATE_CHALLENGE_ID_2"
node src/scripts/migrate-challenge-participants.js --dry-run
```

Review the counts, especially `orphanedLegacyEntries`.

## Apply

```powershell
node src/scripts/migrate-challenge-participants.js --apply
```

The script is idempotent. It creates a separate participant only when the
`challengeId + userId` pair does not already exist, then recalculates each
challenge's `participantCount`.

Legacy invitation codes are considered compromised because the old API
returned them in the general challenge list. Every converted private challenge
receives a fresh encrypted invite code. Its owner can retrieve it from the new
private-challenge screen after deployment.
