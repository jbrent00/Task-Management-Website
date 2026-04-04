// Backend entry point
import express from "express";
import cors from "cors";
import { clerkMiddleware, clerkClient, requireAuth, getAuth } from '@clerk/express'
import { prisma } from "./services/prisma";
import taskRoutes from './routes/tasks';
import createUser from './controllers/createUser';

const app = express();
const PORT = process.env.PORT || 3000;

// Webhook endpoint for Clerk
app.post('/api/webhooks', express.raw({ type: 'application/json' }), createUser);


// Middleware
app.use(clerkMiddleware());


app.use(cors({
  origin: process.env.FRONTEND_URL
}));

app.use(express.json());

// Routes
app.use("/tasks", requireAuth(), taskRoutes);

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