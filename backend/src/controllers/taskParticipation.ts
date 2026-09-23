import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getTaskAccess } from '../services/authorization';
import { getProjectTaskCapabilities, serializeTask, taskInclude } from './taskResponse';

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
    const where = action === 'join'
        ? { id: taskId, assigneeId: null }
        : { id: taskId, assigneeId: userId };
    const result = await prisma.task.updateMany({ where, data: { assigneeId: action === 'join' ? userId : null } });
    if (!result.count) { res.status(409).json({ error: action === 'join' ? 'This task has already been claimed' : 'You are no longer assigned to this task' }); return; }
    const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId }, include: taskInclude });
    res.json(serializeTask(task, getProjectTaskCapabilities(access.role, access.task.project, task, userId)));
}

export const joinTask = (req: Request, res: Response) => participation(req, res, 'join');
export const leaveTask = (req: Request, res: Response) => participation(req, res, 'leave');
