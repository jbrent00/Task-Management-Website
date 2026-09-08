import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../services/prisma";

const taskStatuses = ["todo", "in_progress", "completed"] as const;
type TaskStatus = (typeof taskStatuses)[number];

type TaskUpdate = {
    id: number;
    orderIndex: number;
    status: TaskStatus;
};

function isTaskUpdate(value: unknown): value is TaskUpdate {
    if (!value || typeof value !== "object") return false;

    const task = value as Record<string, unknown>;
    return Number.isInteger(task.id)
        && Number.isInteger(task.orderIndex)
        && (task.orderIndex as number) >= 0
        && taskStatuses.includes(task.status as TaskStatus);
}

const bulkUpdateTasks = async function(req: Request, res: Response) {
    const { userId } = getAuth(req);

    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const tasks: unknown = req.body.tasks;

    if (!Array.isArray(tasks) || !tasks.every(isTaskUpdate)) {
        res.status(400).json({ error: "Tasks must contain valid task updates" });
        return;
    }

    const taskIds = tasks.map((task) => task.id);
    if (new Set(taskIds).size !== taskIds.length) {
        res.status(400).json({ error: "Tasks must not contain duplicate IDs" });
        return;
    }

    try {
        const ownedTaskCount = await prisma.task.count({
            where: { id: { in: taskIds }, userId },
        });

        if (ownedTaskCount !== taskIds.length) {
            res.status(404).json({ error: "One or more tasks were not found" });
            return;
        }

        await prisma.$transaction(
            tasks.map(task =>
                prisma.task.update({
                    where: { id: task.id },
                    data: {
                        orderIndex: task.orderIndex,
                        status: task.status,
                    },
                }),
            )
        );

        res.status(200).json({ message: "Tasks updated successfully" });
    } catch (error) {
        console.error("Error bulk updating tasks", error);
        res.status(500).json({ error: "Failed to bulk update tasks" });
    }
};

export default bulkUpdateTasks;
