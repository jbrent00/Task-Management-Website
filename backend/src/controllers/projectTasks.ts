import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getProjectAccess } from '../services/authorization';
import { validateProjectAssignments } from './taskAssignments';
import { getProjectTaskCapabilities, serializeTask, taskInclude } from './taskResponse';
import { canChangeAssignments, canCreateProjectTask } from '../services/projectPolicy';
import { cleanOptionalText, cleanRequiredText, isChecklistItemsInput, isNonNegativeInteger, isTaskPriority, isTaskStatus, parseOptionalDate } from './validation';
import { recordActivity } from '../services/activity';
import { syncTaskAssignments } from './taskAssignmentChanges';

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
    const { priority, orderIndex, tagIds = [], checklistItems = [], assigneeIds = [], status = 'todo' } = req.body;
    const title = cleanRequiredText(req.body.title, 100); const description = cleanOptionalText(req.body.description, 500); const dueDate = parseOptionalDate(req.body.dueDate);
    if (!title || description === undefined || !isTaskPriority(priority) || !isTaskStatus(status) || dueDate === undefined || !isNonNegativeInteger(orderIndex) || !isChecklistItemsInput(checklistItems) || !await validateProjectAssignments(projectId, assigneeIds, tagIds)) {
        res.status(400).json({ error: 'Invalid task details, assignee, or tags' }); return;
    }
    if (!canChangeAssignments(access.role, access.project, userId, [], assigneeIds)) { res.status(403).json({ error: 'You cannot assign this task to one or more selected members' }); return; }
    const task = await prisma.$transaction(async (tx) => {
        const created = await tx.task.create({ data: {
            projectId, createdById: userId, title, description, priority, status, dueDate, orderIndex, completedAt: status === 'completed' ? new Date() : null,
            projectTaskTags: { create: (tagIds as number[]).map((tagId) => ({ tagId })) },
            checklistItems: { create: checklistItems.map((item: { text: string }, index: number) => ({ text: item.text.trim(), orderIndex: index })) },
        } });
        await recordActivity(tx, { projectId, taskId: created.id, actorId: userId, type: 'task_created', metadata: { taskTitle: created.title } });
        await syncTaskAssignments(tx, { taskId: created.id, projectId, projectTitle: access.project.title, taskTitle: created.title, actorId: userId, currentIds: [], nextIds: assigneeIds });
        return tx.task.findUniqueOrThrow({ where: { id: created.id }, include: taskInclude });
    });
    res.status(201).json(serializeTask(task, getProjectTaskCapabilities(access.role, access.project, task, userId)));
}
