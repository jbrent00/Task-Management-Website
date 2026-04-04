// This file should handle querying the database to get all tasks
import { prisma } from '../services/prisma';
import type { Request, Response } from "express";
import { getAuth } from '@clerk/express';

async function getAllTasks(req: Request, res: Response) {
    try {
        const { userId } = getAuth(req);

        console.log("Fetching tasks for user: ", userId); // REMOVE LATER ON

        const tasks = await prisma.task.findMany({
            where: {
                userId
            }
        });
        
        console.log(tasks); // REMOVE LATER ON
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks: ", error);
        res.status(500).json({error: "Failed to fetch tasks"});
    } 
}



export default getAllTasks;