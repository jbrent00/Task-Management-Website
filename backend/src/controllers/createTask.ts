import { prisma } from '../services/prisma';
import type { Request, Response } from "express";
import { getAuth } from '@clerk/express';

async function createTask(req: Request, res: Response) {
    try {
        const { title, description, priority, dueDate } = req.body;
        const { userId } = getAuth(req);
        
        const newTask = await prisma.task.create({
            data: {
                title,
                description,
                userId, 
                priority,
                status: "todo", // Default status is "todo"\
                dueDate: dueDate ? new Date(dueDate) : null, // Convert to Date object if provided, otherwise set to null
            }
        });

        console.log('Created new task:', newTask); // REMOVE LATER ON

        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
}

export default createTask;