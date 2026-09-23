CREATE TYPE "ProjectRole" AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'declined', 'revoked', 'expired');

ALTER TABLE "Project" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Project" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE TABLE "ProjectMembership" (
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectMembership_pkey" PRIMARY KEY ("projectId", "userId")
);
INSERT INTO "ProjectMembership" ("projectId", "userId", "role") SELECT "id", "userId", 'owner'::"ProjectRole" FROM "Project";
CREATE UNIQUE INDEX "ProjectMembership_one_owner_per_project" ON "ProjectMembership" ("projectId") WHERE "role" = 'owner';
CREATE INDEX "ProjectMembership_userId_role_idx" ON "ProjectMembership"("userId", "role");

CREATE TABLE "ProjectInvitation" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "inviterId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProjectInvitation_normalizedEmail_status_expiresAt_idx" ON "ProjectInvitation"("normalizedEmail", "status", "expiresAt");
CREATE INDEX "ProjectInvitation_projectId_normalizedEmail_status_idx" ON "ProjectInvitation"("projectId", "normalizedEmail", "status");

ALTER TABLE "Task" RENAME COLUMN "userId" TO "createdById";
ALTER TABLE "Task" ADD COLUMN "assigneeId" TEXT;
ALTER TABLE "Task" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_userId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_projectId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Task_createdById_projectId_idx" ON "Task"("createdById", "projectId");
CREATE INDEX "Task_assigneeId_projectId_idx" ON "Task"("assigneeId", "projectId");

CREATE TABLE "ProjectTag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectTag_projectId_normalizedName_key" ON "ProjectTag"("projectId", "normalizedName");
INSERT INTO "ProjectTag" ("name", "normalizedName", "color", "projectId")
SELECT MIN(tag."name"), tag."normalizedName", MIN(tag."color"), task."projectId"
FROM "TaskTag" task_tag JOIN "Task" task ON task."id" = task_tag."taskId" JOIN "Tag" tag ON tag."id" = task_tag."tagId"
WHERE task."projectId" IS NOT NULL GROUP BY task."projectId", tag."normalizedName";

CREATE TABLE "ProjectTaskTag" (
    "taskId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    CONSTRAINT "ProjectTaskTag_pkey" PRIMARY KEY ("taskId", "tagId")
);
INSERT INTO "ProjectTaskTag" ("taskId", "tagId")
SELECT DISTINCT task_tag."taskId", project_tag."id"
FROM "TaskTag" task_tag JOIN "Task" task ON task."id" = task_tag."taskId" JOIN "Tag" tag ON tag."id" = task_tag."tagId"
JOIN "ProjectTag" project_tag ON project_tag."projectId" = task."projectId" AND project_tag."normalizedName" = tag."normalizedName"
WHERE task."projectId" IS NOT NULL;
DELETE FROM "TaskTag" USING "Task" WHERE "TaskTag"."taskId" = "Task"."id" AND "Task"."projectId" IS NOT NULL;

ALTER TABLE "User" ADD COLUMN "primaryEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "imageUrl" TEXT;
CREATE TABLE "UserEmail" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserEmail_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserEmail_userId_normalizedEmail_key" ON "UserEmail"("userId", "normalizedEmail");
CREATE INDEX "UserEmail_normalizedEmail_idx" ON "UserEmail"("normalizedEmail");

ALTER TABLE "ProjectMembership" ADD CONSTRAINT "ProjectMembership_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMembership" ADD CONSTRAINT "ProjectMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTaskTag" ADD CONSTRAINT "ProjectTaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTaskTag" ADD CONSTRAINT "ProjectTaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ProjectTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserEmail" ADD CONSTRAINT "UserEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_userId_normalizedTitle_key";
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_userId_fkey";
ALTER TABLE "Project" DROP COLUMN "normalizedTitle";
ALTER TABLE "Project" DROP COLUMN "userId";
