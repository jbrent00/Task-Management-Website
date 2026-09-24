import { prisma } from '../services/prisma';
import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { getProjectTaskCapabilities, serializeTask, taskInclude } from './taskResponse';

export default async function getAllTasks(req: Request, res: Response) {
    const { userId } = getAuth(req);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    try {
        const tasks = await prisma.task.findMany({
            where: { OR: [
                { projectId: null, createdById: userId },
                { assignments: { some: { userId } }, project: { archivedAt: null, memberships: { some: { userId } } } },
            ] },
            include: taskInclude,
        });
        const projectIds = [...new Set(tasks.flatMap((task) => task.projectId ? [task.projectId] : []))];
        const memberships = await prisma.projectMembership.findMany({ where: { userId, projectId: { in: projectIds } } });
        const roles = new Map(memberships.map((item) => [item.projectId, item.role]));
        res.json(tasks.map((task) => {
            if (!task.projectId || !task.project) return serializeTask(task);
            const role = roles.get(task.projectId);
            return serializeTask(task, role ? getProjectTaskCapabilities(role, task.project, task, userId) : false);
        }));
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
}
