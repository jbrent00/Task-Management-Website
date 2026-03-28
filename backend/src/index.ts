// Backend entry point
import express from "express";
import cors from "cors";
import { prisma } from "./services/prisma";
import taskRoutes from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL
}));

app.use(express.json());

// Routes
app.use("/tasks", taskRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});