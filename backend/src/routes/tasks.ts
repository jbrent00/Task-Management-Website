import { Router } from "express";
import getAllTasks from "../controllers/getAllTasks";
import createTask from "../controllers/createTask";
import deleteTask from "../controllers/deleteTask";
import updateTask from "../controllers/updateTask";
import bulkUpdateTasks from "../controllers/bulkUpdateTasks";
import checklistItems from "../controllers/checklistItems";
import aiGeneration from "../controllers/aiGeneration";
import { joinTask, leaveTask } from '../controllers/taskParticipation';
import { createTaskComment, deleteTaskComment, getTaskComments, updateTaskComment } from '../controllers/taskComments';
import { asyncRoute } from './asyncRoute';

const router = Router();


router.get("/", getAllTasks);
router.post("/", createTask);
router.patch("/bulk-update", bulkUpdateTasks);
router.post("/ai/generate", aiGeneration);
router.post("/:id/join", joinTask);
router.post("/:id/leave", leaveTask);
router.get("/:taskId/comments", asyncRoute(getTaskComments));
router.post("/:taskId/comments", asyncRoute(createTaskComment));
router.patch("/:taskId/comments/:commentId", asyncRoute(updateTaskComment));
router.delete("/:taskId/comments/:commentId", asyncRoute(deleteTaskComment));
router.post("/:taskId/checklist-items", checklistItems.create);
router.patch("/:taskId/checklist-items/:itemId", checklistItems.update);
router.delete("/:taskId/checklist-items/:itemId", checklistItems.remove);
router.put("/:taskId/checklist-items/order", checklistItems.reorder);
router.delete("/:id", deleteTask);
router.put("/:id", updateTask);

export default router;
