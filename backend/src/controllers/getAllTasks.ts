// This file handles querying the database to get all tasks
import { prisma } from '../services/prisma';
import type { Request, Response } from "express";
import { getAuth } from '@clerk/express';

async function getAllTasks(req: Request, res: Response) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const tasks = await prisma.task.findMany({
            where: {
                userId
            }
        });
        
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks: ", error);
        res.status(500).json({error: "Failed to fetch tasks"});
    } 
}



export default getAllTasks;
