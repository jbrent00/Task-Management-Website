import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getTaskAccess } from '../services/authorization';
import { getProjectTaskCapabilities, serializeTask, taskInclude } from './taskResponse';
import { syncTaskAssignments } from './taskAssignmentChanges';

async function participation(req: Request, res: Response, action: 'join' | 'leave') {
    const { userId } = getAuth(req); const taskId = Number(req.params.id);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!Number.isInteger(taskId)) { res.status(400).json({ error: 'Invalid task id' }); return; }
    const access = await getTaskAccess(taskId, userId);
    if (!access || !access.task.projectId || !access.task.project || !access.role) { res.status(404).json({ error: 'Project task not found' }); return; }
    const editorAllowed = action === 'join' ? access.task.project.editorsCanJoinTasks : access.task.project.editorsCanLeaveTasks;
    if (access.task.project.archivedAt || access.role === 'viewer' || (access.role === 'editor' && !editorAllowed)) {
        res.status(403).json({ error: `You cannot ${action} this task` }); return;
    }
    try {
        const task = await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(${taskId})`;
            const currentIds = (await tx.taskAssignment.findMany({ where: { taskId }, select: { userId: true } })).map((item) => item.userId);
            const assigned = currentIds.includes(userId);
            if ((action === 'join' && assigned) || (action === 'leave' && !assigned)) return null;
            const nextIds = action === 'join' ? [...currentIds, userId] : currentIds.filter((id) => id !== userId);
            await syncTaskAssignments(tx, { taskId, projectId: access.task.projectId!, projectTitle: access.task.project!.title, taskTitle: access.task.title, actorId: userId, currentIds, nextIds });
            return tx.task.findUniqueOrThrow({ where: { id: taskId }, include: taskInclude });
        });
        if (!task) { res.status(409).json({ error: action === 'join' ? 'You have already joined this task' : 'You are no longer assigned to this task' }); return; }
        res.json(serializeTask(task, getProjectTaskCapabilities(access.role, access.task.project, task, userId)));
    } catch (error) {
        console.error(error);
        res.status(409).json({ error: `The task changed before you could ${action}. Refresh and try again.` });
    }
}

export const joinTask = (req: Request, res: Response) => participation(req, res, 'join');
export const leaveTask = (req: Request, res: Response) => participation(req, res, 'leave');
