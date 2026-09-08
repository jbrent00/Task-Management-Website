import { Router } from "express";
import getAllTasks from "../controllers/getAllTasks";
import createTask from "../controllers/createTask";
import deleteTask from "../controllers/deleteTask";
import updateTask from "../controllers/updateTask";
import bulkUpdateTasks from "../controllers/bulkUpdateTasks";

const router = Router();


router.get("/", getAllTasks);
router.post("/", createTask);
router.patch("/bulk-update", bulkUpdateTasks);
router.delete("/:id", deleteTask);
router.put("/:id", updateTask);

export default router;