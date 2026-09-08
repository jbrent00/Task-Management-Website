-- AlterTable
ALTER TABLE "Task" ADD COLUMN "orderIndex" INTEGER NOT NULL DEFAULT 0;

-- Preserve a stable order for tasks that existed before this migration.
WITH ordered_tasks AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", status
      ORDER BY "createdAt", id
    ) - 1 AS "orderIndex"
  FROM "Task"
)
UPDATE "Task"
SET "orderIndex" = ordered_tasks."orderIndex"
FROM ordered_tasks
WHERE "Task".id = ordered_tasks.id;
