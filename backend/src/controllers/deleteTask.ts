import { prisma } from '../services/prisma';
import type { Request, Response } from "express";
import { getAuth } from '@clerk/express';
import { ownedTaskWhere } from './validation';

async function deleteTask(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { userId } = getAuth(req);

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const taskId = Number(id);
        if (!Number.isInteger(taskId)) {
            res.status(400).json({ error: 'Task id must be an integer' });
            return;
        }

        const { count } = await prisma.task.deleteMany({
            where: ownedTaskWhere(taskId, userId),
        });

        if (count === 0) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }

}

export default deleteTask;
