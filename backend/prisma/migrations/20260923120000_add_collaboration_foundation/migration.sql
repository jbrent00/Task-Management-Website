-- AlterTable
ALTER TABLE "Project"
ADD COLUMN "editorsCanCreateTasks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "editorsCanAssignOthers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "editorsCanEditAllTasks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "editorsCanSelfAssign" BOOLEAN NOT NULL DEFAULT true;

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('task_assigned', 'task_unassigned', 'role_changed', 'project_removed', 'ownership_transferred');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "projectId" INTEGER,
    "taskId" INTEGER,
    "type" "NotificationType" NOT NULL,
    "metadata" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_projectId_createdAt_idx" ON "Notification"("projectId", "createdAt");
CREATE INDEX "Notification_taskId_createdAt_idx" ON "Notification"("taskId", "createdAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
