import { prisma } from '../services/prisma';
import type { Request, Response } from "express";
import { getAuth } from '@clerk/express';

async function updateTask(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { title, description, priority, status, dueDate } = req.body;
        const { userId } = getAuth(req);

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const updatedTask = await prisma.task.update({
            where: { 
                id: Number(id),
                userId
            },
            data: {
                title,
                description,
                priority,
                status,
                dueDate: dueDate ? new Date(dueDate) : null, // Convert to Date object if provided, otherwise set to null
            }
        });

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

export default updateTask;
