import { prisma } from '../services/prisma';
import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { getTaskAccess } from '../services/authorization';

export default async function deleteTask(req: Request, res: Response) {
    const { userId } = getAuth(req); const taskId = Number(req.params.id);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!Number.isInteger(taskId)) { res.status(400).json({ error: 'Invalid task id' }); return; }
    const access = await getTaskAccess(taskId, userId);
    if (!access) { res.status(404).json({ error: 'Task not found' }); return; }
    if (!access.canEdit) { res.status(403).json({ error: 'You cannot delete this task' }); return; }
    try { await prisma.task.delete({ where: { id: taskId } }); res.status(204).end(); }
    catch { res.status(500).json({ error: 'Failed to delete task' }); }
}
