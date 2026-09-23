import { prisma } from '../services/prisma';
import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { validatePersonalTags } from './taskAssignments';
import { serializeTask, taskInclude } from './taskResponse';
import { cleanOptionalText, cleanRequiredText, isChecklistItemsInput, isNonNegativeInteger, isTaskPriority, parseOptionalDate } from './validation';

export default async function createTask(req: Request, res: Response) {
    const { userId } = getAuth(req);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { priority, orderIndex, tagIds = [], checklistItems = [] } = req.body;
    const title = cleanRequiredText(req.body.title, 100);
    const description = cleanOptionalText(req.body.description, 500);
    const dueDate = parseOptionalDate(req.body.dueDate);
    if (!title || description === undefined || !isTaskPriority(priority) || dueDate === undefined || !isNonNegativeInteger(orderIndex) || !isChecklistItemsInput(checklistItems)) {
        res.status(400).json({ error: 'Invalid task details.' }); return;
    }
    if (req.body.projectId !== null && req.body.projectId !== undefined) {
        res.status(400).json({ error: 'Project tasks must be created inside their project.' }); return;
    }
    if (!await validatePersonalTags(userId, tagIds)) { res.status(400).json({ error: 'Tags are invalid' }); return; }
    try {
        const task = await prisma.task.create({
            data: {
                title, description, createdById: userId, priority, status: 'todo', dueDate, orderIndex,
                taskTags: { create: (tagIds as number[]).map((tagId) => ({ tagId })) },
                checklistItems: { create: checklistItems.map((item: { text: string }, index: number) => ({ text: item.text.trim(), orderIndex: index })) },
            },
            include: taskInclude,
        });
        res.status(201).json(serializeTask(task));
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
}
