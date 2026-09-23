import { prisma } from '../services/prisma';
import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { getTaskAccess } from '../services/authorization';
import { validatePersonalTags, validateProjectAssignments } from './taskAssignments';
import { getProjectTaskCapabilities, serializeTask, taskInclude } from './taskResponse';
import { canChangeAssignment } from '../services/projectPolicy';
import { cleanOptionalText, cleanRequiredText, isTaskPriority, isTaskStatus, parseOptionalDate } from './validation';

export default async function updateTask(req: Request, res: Response) {
    const { userId } = getAuth(req); const taskId = Number(req.params.id);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!Number.isInteger(taskId)) { res.status(400).json({ error: 'Invalid task id' }); return; }
    const access = await getTaskAccess(taskId, userId);
    if (!access) { res.status(404).json({ error: 'Task not found' }); return; }
    if (!access.canEdit) { res.status(403).json({ error: 'You cannot edit this task' }); return; }
    const { priority, status, tagIds = [], assigneeId = access.task.assigneeId } = req.body;
    const title = cleanRequiredText(req.body.title, 100);
    const description = cleanOptionalText(req.body.description, 500);
    const dueDate = parseOptionalDate(req.body.dueDate);
    if (!title || description === undefined || !isTaskPriority(priority) || !isTaskStatus(status) || dueDate === undefined) {
        res.status(400).json({ error: 'Invalid task details.' }); return;
    }
    const validAssignments = access.task.projectId
        ? await validateProjectAssignments(access.task.projectId, assigneeId, tagIds)
        : assigneeId === null && await validatePersonalTags(userId, tagIds);
    if (!validAssignments) { res.status(400).json({ error: 'Assignee or tags are invalid' }); return; }
    if (access.task.projectId && access.role && access.task.project && assigneeId !== access.task.assigneeId
        && !canChangeAssignment(access.role, access.task.project, userId, access.task.assigneeId, assigneeId)) {
        res.status(403).json({ error: 'You cannot change this task assignment' }); return;
    }
    try {
        const task = await prisma.$transaction(async (tx) => {
            const updated = await tx.task.update({
                where: { id: taskId },
                data: {
                    title, description, priority, status, dueDate, assigneeId,
                    ...(access.task.status !== status ? { completedAt: status === 'completed' ? new Date() : null } : {}),
                    ...(access.task.projectId
                        ? { projectTaskTags: { deleteMany: {}, create: (tagIds as number[]).map((tagId) => ({ tagId })) } }
                        : { taskTags: { deleteMany: {}, create: (tagIds as number[]).map((tagId) => ({ tagId })) } }),
                },
                include: taskInclude,
            });
            if (access.task.projectId && access.task.project && assigneeId !== access.task.assigneeId) {
                const metadata = { projectTitle: access.task.project.title, taskTitle: updated.title };
                if (access.task.assigneeId && access.task.assigneeId !== userId) await tx.notification.create({ data: { userId: access.task.assigneeId, actorId: userId, projectId: access.task.projectId, taskId, type: 'task_unassigned', metadata } });
                if (assigneeId && assigneeId !== userId) await tx.notification.create({ data: { userId: assigneeId, actorId: userId, projectId: access.task.projectId, taskId, type: 'task_assigned', metadata } });
            }
            return updated;
        });
        const capabilities = access.task.projectId && access.role && access.task.project
            ? getProjectTaskCapabilities(access.role, access.task.project, task, userId)
            : true;
        res.json(serializeTask(task, capabilities));
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
}
