import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getProjectAccess } from '../services/authorization';
import type { ProjectActivityType } from '../../generated/prisma/client';

const categories: Record<string, ProjectActivityType[]> = {
    tasks: ['task_created', 'task_status_changed', 'task_assignees_changed'],
    comments: ['comment_created', 'comment_edited', 'comment_deleted'],
    members: ['member_joined', 'member_removed', 'member_role_changed', 'ownership_transferred'],
    settings: ['project_settings_updated', 'project_archived', 'project_restored'],
};

export async function getProjectActivity(req: Request, res: Response) {
    const { userId } = getAuth(req); const projectId = Number(req.params.projectId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!await getProjectAccess(projectId, userId)) { res.status(404).json({ error: 'Project not found' }); return; }
    const requestedLimit = Number(req.query.limit ?? 30); const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 30;
    const cursor = req.query.cursor === undefined ? null : Number(req.query.cursor);
    const taskId = req.query.taskId === undefined ? null : Number(req.query.taskId);
    const category = String(req.query.category ?? 'all');
    if ((cursor !== null && !Number.isInteger(cursor)) || (taskId !== null && !Number.isInteger(taskId)) || (category !== 'all' && !categories[category])) { res.status(400).json({ error: 'Invalid activity query' }); return; }
    const activityTypes = category === 'all' ? null : categories[category]!;
    const rows = await prisma.projectActivity.findMany({
        where: { projectId, ...(cursor ? { id: { lt: cursor } } : {}), ...(taskId ? { taskId } : {}), ...(activityTypes ? { type: { in: activityTypes } } : {}) },
        include: { actor: { select: { id: true, fname: true, lname: true, primaryEmail: true, imageUrl: true } } },
        orderBy: { id: 'desc' }, take: limit + 1,
    });
    const hasMore = rows.length > limit; if (hasMore) rows.pop();
    res.json({ items: rows, nextCursor: hasMore ? rows.at(-1)!.id : null });
}
