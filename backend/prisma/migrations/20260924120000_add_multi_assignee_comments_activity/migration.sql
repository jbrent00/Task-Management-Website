-- CreateEnum
CREATE TYPE "ProjectActivityType" AS ENUM (
    'task_created',
    'task_status_changed',
    'task_assignees_changed',
    'comment_created',
    'comment_edited',
    'comment_deleted',
    'member_joined',
    'member_removed',
    'member_role_changed',
    'ownership_transferred',
    'project_settings_updated',
    'project_archived',
    'project_restored'
);

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'task_commented';
ALTER TYPE "NotificationType" ADD VALUE 'comment_mentioned';

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "taskId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("taskId", "userId")
);

-- Preserve all existing assignments before removing the legacy column.
INSERT INTO "TaskAssignment" ("taskId", "userId", "assignedAt")
SELECT "id", "assigneeId", "updatedAt"
FROM "Task"
WHERE "assigneeId" IS NOT NULL;

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentMention" (
    "commentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,

    CONSTRAINT "CommentMention_pkey" PRIMARY KEY ("commentId", "start")
);

-- CreateTable
CREATE TABLE "ProjectActivity" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "taskId" INTEGER,
    "actorId" TEXT,
    "type" "ProjectActivityType" NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskAssignment_userId_taskId_idx" ON "TaskAssignment"("userId", "taskId");
CREATE INDEX "TaskComment_taskId_createdAt_id_idx" ON "TaskComment"("taskId", "createdAt", "id");
CREATE INDEX "CommentMention_userId_commentId_idx" ON "CommentMention"("userId", "commentId");
CREATE INDEX "ProjectActivity_projectId_createdAt_id_idx" ON "ProjectActivity"("projectId", "createdAt", "id");
CREATE INDEX "ProjectActivity_taskId_createdAt_id_idx" ON "ProjectActivity"("taskId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommentMention" ADD CONSTRAINT "CommentMention_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "TaskComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentMention" ADD CONSTRAINT "CommentMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Remove legacy single-assignee relation.
DROP INDEX "Task_assigneeId_projectId_idx";
ALTER TABLE "Task" DROP CONSTRAINT "Task_assigneeId_fkey";
ALTER TABLE "Task" DROP COLUMN "assigneeId";
