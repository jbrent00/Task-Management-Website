import { prisma } from '../services/prisma';
import type { Request, Response } from "express";
import { getAuth } from '@clerk/express';
import { validateTaskAssignments } from './taskAssignments';
import { serializeTask, taskInclude } from './taskResponse';

async function createTask(req: Request, res: Response) {
    try {
        const { title, description, priority, dueDate, orderIndex, projectId = null, tagIds = [] } = req.body;
        const { userId } = getAuth(req);
        const parsedOrderIndex = Number(orderIndex);

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (!Number.isInteger(parsedOrderIndex) || parsedOrderIndex < 0) {
            res.status(400).json({ error: "orderIndex must be a non-negative integer" });
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
                dueDate: dueDate ? new Date(dueDate) : null, // Convert to Date object if provided, otherwise set to null
                orderIndex: parsedOrderIndex,
                projectId,
                taskTags: { create: tagIds.map((tagId: number) => ({ tagId })) },
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
