-- Before collaborative projects, every project task belonged to the project's user.
-- Restore that My Tasks behavior for rows created before the collaboration migration,
-- provided the original creator is still an assignable project member.
UPDATE "Task" AS task
SET "assigneeId" = task."createdById",
    "updatedAt" = CURRENT_TIMESTAMP
FROM "ProjectMembership" AS membership,
     "_prisma_migrations" AS collaboration_migration
WHERE collaboration_migration.migration_name = '20260922190000_add_collaborative_projects'
  AND collaboration_migration.rolled_back_at IS NULL
  AND collaboration_migration.finished_at IS NOT NULL
  AND task."createdAt" < collaboration_migration.finished_at
  AND task."projectId" = membership."projectId"
  AND task."createdById" = membership."userId"
  AND membership."role" IN ('owner', 'editor')
  AND task."assigneeId" IS NULL;
