import { Router } from "express";
import getAllTasks from "../controllers/getAllTasks";
import createTask from "../controllers/createTask";
import deleteTask from "../controllers/deleteTask";
import updateTask from "../controllers/updateTask";

const router = Router();


router.get("/", getAllTasks);
router.post("/", createTask);
router.delete("/:id", deleteTask);
router.put("/:id", updateTask);

export default router;