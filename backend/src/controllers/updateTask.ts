import { prisma } from '../services/prisma';
import type { Request, Response } from "express";
import { getAuth } from '@clerk/express';
import { validateTaskAssignments } from './taskAssignments';
import { serializeTask, taskInclude } from './taskResponse';
import { cleanOptionalText, cleanRequiredText, isTaskPriority, isTaskStatus, ownedTaskWhere, parseOptionalDate } from './validation';

async function updateTask(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { priority, status, projectId = null, tagIds = [] } = req.body;
        const { userId } = getAuth(req);
        const title = cleanRequiredText(req.body.title, 100);
        const description = cleanOptionalText(req.body.description, 500);
        const dueDate = parseOptionalDate(req.body.dueDate);

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const taskId = Number(id);
        if (!Number.isInteger(taskId) || !title || description === undefined || !isTaskPriority(priority) || !isTaskStatus(status) || dueDate === undefined) {
            res.status(400).json({ error: 'Invalid task details. Check the title, description, status, priority, and due date.' });
            return;
        }
        const existingTask = await prisma.task.findFirst({ where: ownedTaskWhere(taskId, userId) });

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
                dueDate,
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
