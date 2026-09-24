import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getTaskAccess } from '../services/authorization';
import { isNonNegativeInteger, isTaskStatus, type TaskStatus } from './validation';
import { recordActivity } from '../services/activity';

type TaskUpdate = { id: number; orderIndex: number; status: TaskStatus };
function isTaskUpdate(value: unknown): value is TaskUpdate {
    if (!value || typeof value !== 'object') return false;
    const task = value as Record<string, unknown>;
    return Number.isInteger(task.id) && isNonNegativeInteger(task.orderIndex) && isTaskStatus(task.status);
}

export default async function bulkUpdateTasks(req: Request, res: Response) {
    const { userId } = getAuth(req); if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const tasks: unknown = req.body.tasks;
    if (!Array.isArray(tasks) || !tasks.every(isTaskUpdate) || new Set(tasks.map((task) => task.id)).size !== tasks.length) {
        res.status(400).json({ error: 'Tasks must contain unique valid updates' }); return;
    }
    const accesses = await Promise.all(tasks.map((task) => getTaskAccess(task.id, userId)));
    if (accesses.some((access) => !access)) { res.status(404).json({ error: 'One or more tasks were not found' }); return; }
    if (accesses.some((access) => !access?.canEdit)) { res.status(403).json({ error: 'You cannot reorder one or more tasks' }); return; }
    const statusById = new Map(accesses.map((access) => [access!.task.id, access!.task.status]));
    try {
        const completedAt = new Date();
        await prisma.$transaction(async (tx) => {
            for (const [index, task] of tasks.entries()) {
                const access = accesses[index]!;
                await tx.task.update({ where: { id: task.id }, data: {
                    orderIndex: task.orderIndex, status: task.status,
                    ...(statusById.get(task.id) !== task.status ? { completedAt: task.status === 'completed' ? completedAt : null } : {}),
                } });
                if (access.task.projectId && statusById.get(task.id) !== task.status) {
                    await recordActivity(tx, { projectId: access.task.projectId, taskId: task.id, actorId: userId, type: 'task_status_changed', metadata: { taskTitle: access.task.title, from: statusById.get(task.id), to: task.status } });
                }
            }
        });
        res.json({ message: 'Tasks updated successfully' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to bulk update tasks' }); }
}
