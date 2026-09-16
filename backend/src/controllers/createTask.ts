import { prisma } from '../services/prisma';
import type { Request, Response } from "express";
import { getAuth } from '@clerk/express';
import { validateTaskAssignments } from './taskAssignments';
import { serializeTask, taskInclude } from './taskResponse';
import { cleanOptionalText, cleanRequiredText, isChecklistItemsInput, isNonNegativeInteger, isTaskPriority, parseOptionalDate } from './validation';

async function createTask(req: Request, res: Response) {
    try {
        const { priority, orderIndex, projectId = null, tagIds = [], checklistItems = [] } = req.body;
        const { userId } = getAuth(req);
        const title = cleanRequiredText(req.body.title, 100);
        const description = cleanOptionalText(req.body.description, 500);
        const dueDate = parseOptionalDate(req.body.dueDate);

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (!title || description === undefined || !isTaskPriority(priority) || dueDate === undefined || !isNonNegativeInteger(orderIndex) || !isChecklistItemsInput(checklistItems)) {
            res.status(400).json({ error: 'Invalid task details. Check the title, description, priority, due date, and order.' });
            return;
        }
        if (!await validateTaskAssignments(userId, projectId, tagIds)) {
            res.status(400).json({ error: 'Project or tags are invalid' });
            return;
        }
        
        const newTask = await prisma.task.create({
            data: {
                title,
                description,
                userId, 
                priority,
                status: "todo",
                dueDate,
                orderIndex,
                projectId,
                taskTags: { create: tagIds.map((tagId: number) => ({ tagId })) },
                checklistItems: { create: checklistItems.map((item: { text: string }, index: number) => ({ text: item.text.trim(), orderIndex: index })) },
            },
            include: taskInclude,
        });

        console.log('Created new task:', newTask); // REMOVE LATER ON

        res.status(201).json(serializeTask(newTask));
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
}

export default createTask;
