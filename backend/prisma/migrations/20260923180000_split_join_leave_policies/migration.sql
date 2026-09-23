ALTER TABLE "Project"
ADD COLUMN "editorsCanJoinTasks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "editorsCanLeaveTasks" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Project"
SET "editorsCanJoinTasks" = "editorsCanSelfAssign",
    "editorsCanLeaveTasks" = "editorsCanSelfAssign";

ALTER TABLE "Project"
DROP COLUMN "editorsCanSelfAssign";
