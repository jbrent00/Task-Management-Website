import { prisma } from '../services/prisma';
import type { Request, Response } from "express";

async function updateTask(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { title, description, priority, status, dueDate } = req.body;

        // DELETE THIS AFTER
        console.log('Date received in backend for update:', dueDate); // Check the format of the received dueDate

        const updatedTask = await prisma.task.update({
            where: { id: Number(id) },
            data: {
                title,
                description,
                priority,
                status,
                dueDate: dueDate ? new Date(dueDate) : null, // Convert to Date object if provided, otherwise set to null
            }
        });

        console.log('Updated task:', updatedTask); // REMOVE LATER ON
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

export default updateTask;