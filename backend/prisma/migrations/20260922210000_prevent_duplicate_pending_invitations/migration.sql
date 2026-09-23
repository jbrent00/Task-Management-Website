-- Expired invitations should not continue occupying the pending-invitation slot.
UPDATE "ProjectInvitation"
SET "status" = 'expired', "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" = 'pending' AND "expiresAt" <= CURRENT_TIMESTAMP;

-- Preserve the earliest pending invitation and revoke duplicates created by races.
WITH ranked_invitations AS (
    SELECT "id", ROW_NUMBER() OVER (
        PARTITION BY "projectId", "normalizedEmail"
        ORDER BY "createdAt", "id"
    ) AS duplicate_rank
    FROM "ProjectInvitation"
    WHERE "status" = 'pending'
)
UPDATE "ProjectInvitation" AS invitation
SET "status" = 'revoked', "updatedAt" = CURRENT_TIMESTAMP
FROM ranked_invitations
WHERE invitation."id" = ranked_invitations."id"
  AND ranked_invitations.duplicate_rank > 1;

CREATE UNIQUE INDEX "ProjectInvitation_one_pending_per_project_email"
ON "ProjectInvitation" ("projectId", "normalizedEmail")
WHERE "status" = 'pending';
