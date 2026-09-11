-- Projects and tags are private to the authenticated application user.
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "normalizedTitle" TEXT;
WITH duplicate_projects AS (
  SELECT "id", MIN("id") OVER (PARTITION BY "userId", LOWER("title")) AS "keptId"
  FROM "Project"
), reassigned_tasks AS (
  UPDATE "Task" AS task
  SET "projectId" = duplicate_projects."keptId"
  FROM duplicate_projects
  WHERE task."projectId" = duplicate_projects."id"
    AND duplicate_projects."id" <> duplicate_projects."keptId"
)
DELETE FROM "Project" AS project
USING duplicate_projects
WHERE project."id" = duplicate_projects."id"
  AND duplicate_projects."id" <> duplicate_projects."keptId";
UPDATE "Project" SET "normalizedTitle" = LOWER("title");
ALTER TABLE "Project" ALTER COLUMN "normalizedTitle" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Project_userId_normalizedTitle_key') THEN
    ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_normalizedTitle_key" UNIQUE ("userId", "normalizedTitle");
  END IF;
END $$;

ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "normalizedName" TEXT;
ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT 'slate';
ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "userId" TEXT;
-- Tags were global before this migration, so they cannot be safely attributed to one user.
-- The feature intentionally does not preserve those legacy tags or their assignments.
DELETE FROM "TaskTag";
DELETE FROM "Tag";
ALTER TABLE "Tag" ALTER COLUMN "normalizedName" SET NOT NULL;
ALTER TABLE "Tag" ALTER COLUMN "userId" SET NOT NULL;
DROP INDEX IF EXISTS "Tag_name_key";
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tag_userId_normalizedName_key') THEN
    ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_normalizedName_key" UNIQUE ("userId", "normalizedName");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tag_userId_fkey') THEN
    ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "TaskTag" DROP CONSTRAINT IF EXISTS "TaskTag_tagId_fkey";
ALTER TABLE "TaskTag" DROP CONSTRAINT IF EXISTS "TaskTag_taskId_fkey";
ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
