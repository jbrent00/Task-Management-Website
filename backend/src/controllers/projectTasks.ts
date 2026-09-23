import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getProjectAccess, isProjectWriter } from '../services/authorization';
import { validateProjectAssignments } from './taskAssignments';
import { serializeTask, taskInclude } from './taskResponse';
import { cleanOptionalText, cleanRequiredText, isChecklistItemsInput, isNonNegativeInteger, isTaskPriority, parseOptionalDate } from './validation';

export async function getProjectTasks(req: Request, res: Response) {
    const { userId } = getAuth(req); const projectId = Number(req.params.projectId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(projectId, userId); if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    const tasks = await prisma.task.findMany({ where: { projectId }, include: taskInclude });
    res.json(tasks.map((task) => serializeTask(task, !access.project.archivedAt && isProjectWriter(access.role))));
}

export async function createProjectTask(req: Request, res: Response) {
    const { userId } = getAuth(req); const projectId = Number(req.params.projectId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(projectId, userId); if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    if (!isProjectWriter(access.role) || access.project.archivedAt) { res.status(403).json({ error: 'You cannot create tasks in this project' }); return; }
    const { priority, orderIndex, tagIds = [], checklistItems = [], assigneeId = null } = req.body;
    const title = cleanRequiredText(req.body.title, 100); const description = cleanOptionalText(req.body.description, 500); const dueDate = parseOptionalDate(req.body.dueDate);
    if (!title || description === undefined || !isTaskPriority(priority) || dueDate === undefined || !isNonNegativeInteger(orderIndex) || !isChecklistItemsInput(checklistItems) || !await validateProjectAssignments(projectId, assigneeId, tagIds)) {
        res.status(400).json({ error: 'Invalid task details, assignee, or tags' }); return;
    }
    const task = await prisma.task.create({ data: {
        projectId, createdById: userId, assigneeId, title, description, priority, status: 'todo', dueDate, orderIndex,
        projectTaskTags: { create: (tagIds as number[]).map((tagId) => ({ tagId })) },
        checklistItems: { create: checklistItems.map((item: { text: string }, index: number) => ({ text: item.text.trim(), orderIndex: index })) },
    }, include: taskInclude });
    res.status(201).json(serializeTask(task));
}
