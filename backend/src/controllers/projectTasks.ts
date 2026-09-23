import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getProjectAccess } from '../services/authorization';
import { validateProjectAssignments } from './taskAssignments';
import { getProjectTaskCapabilities, serializeTask, taskInclude } from './taskResponse';
import { canChangeAssignment, canCreateProjectTask } from '../services/projectPolicy';
import { cleanOptionalText, cleanRequiredText, isChecklistItemsInput, isNonNegativeInteger, isTaskPriority, parseOptionalDate } from './validation';

export async function getProjectTasks(req: Request, res: Response) {
    const { userId } = getAuth(req); const projectId = Number(req.params.projectId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(projectId, userId); if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    const tasks = await prisma.task.findMany({ where: { projectId }, include: taskInclude });
    res.json(tasks.map((task) => serializeTask(task, getProjectTaskCapabilities(access.role, access.project, task, userId))));
}

export async function createProjectTask(req: Request, res: Response) {
    const { userId } = getAuth(req); const projectId = Number(req.params.projectId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(projectId, userId); if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    if (!canCreateProjectTask(access.role, access.project)) { res.status(403).json({ error: 'You cannot create tasks in this project' }); return; }
    const { priority, orderIndex, tagIds = [], checklistItems = [], assigneeId = null } = req.body;
    const title = cleanRequiredText(req.body.title, 100); const description = cleanOptionalText(req.body.description, 500); const dueDate = parseOptionalDate(req.body.dueDate);
    if (!title || description === undefined || !isTaskPriority(priority) || dueDate === undefined || !isNonNegativeInteger(orderIndex) || !isChecklistItemsInput(checklistItems) || !await validateProjectAssignments(projectId, assigneeId, tagIds)) {
        res.status(400).json({ error: 'Invalid task details, assignee, or tags' }); return;
    }
    if (!canChangeAssignment(access.role, access.project, userId, null, assigneeId)) { res.status(403).json({ error: 'You cannot assign this task to that member' }); return; }
    const task = await prisma.$transaction(async (tx) => {
        const created = await tx.task.create({ data: {
            projectId, createdById: userId, assigneeId, title, description, priority, status: 'todo', dueDate, orderIndex,
            projectTaskTags: { create: (tagIds as number[]).map((tagId) => ({ tagId })) },
            checklistItems: { create: checklistItems.map((item: { text: string }, index: number) => ({ text: item.text.trim(), orderIndex: index })) },
        }, include: taskInclude });
        if (assigneeId && assigneeId !== userId) await tx.notification.create({ data: { userId: assigneeId, actorId: userId, projectId, taskId: created.id, type: 'task_assigned', metadata: { projectTitle: access.project.title, taskTitle: created.title } } });
        return created;
    });
    res.status(201).json(serializeTask(task, getProjectTaskCapabilities(access.role, access.project, task, userId)));
}
