import { Router } from "express";
import getAllTasks from "../controllers/getAllTasks";
import createTask from "../controllers/createTask";

const router = Router();


router.get("/", getAllTasks);
router.post("/", createTask);

export default router;