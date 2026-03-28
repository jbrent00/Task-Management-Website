// This file should handle querying the database to get all tasks
import { prisma } from '../services/prisma';
import type { Request, Response } from "express";

async function getAllTasks(_req: Request, res: Response) {
    try {
        const tasks = await prisma.task.findMany();
        console.log(tasks); // REMOVE LATER ON
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks: ", error);
        res.status(500).json({error: "Failed to fetch tasks"});
    } 
}



export default getAllTasks;