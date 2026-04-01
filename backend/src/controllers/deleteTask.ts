import { prisma } from '../services/prisma';
import type { Request, Response } from "express";

async function deleteTask(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const deletedTask = await prisma.task.delete({
            where: { id: Number(id) },
        });

        console.log('Deleted task:', deletedTask); // REMOVE LATER ON
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }

}

export default deleteTask;