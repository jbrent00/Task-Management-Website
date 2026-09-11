import { prisma } from '../services/prisma';
import type { Request, Response } from "express";
import { getAuth } from '@clerk/express';
import { validateTaskAssignments } from './taskAssignments';
import { serializeTask, taskInclude } from './taskResponse';

async function updateTask(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { title, description, priority, status, dueDate, projectId = null, tagIds = [] } = req.body;
        const { userId } = getAuth(req);

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const taskId = Number(id);
        const existingTask = await prisma.task.findFirst({ where: { id: taskId, userId } });

        if (!existingTask) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        if (!await validateTaskAssignments(userId, projectId, tagIds)) {
            res.status(400).json({ error: 'Project or tags are invalid' });
            return;
        }

        const completionChanged = existingTask.status !== status;
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                title,
                description,
                priority,
                status,
                dueDate: dueDate ? new Date(dueDate) : null, // Convert to Date object if provided, otherwise set to null
                projectId,
                taskTags: { deleteMany: {}, create: tagIds.map((tagId: number) => ({ tagId })) },
                ...(completionChanged ? { completedAt: status === "completed" ? new Date() : null } : {}),
            },
            include: taskInclude,
        });

        res.status(200).json(serializeTask(updatedTask));
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

export default updateTask;
