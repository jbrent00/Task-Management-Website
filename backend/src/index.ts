// Backend entry point
import express from "express";
import cors from "cors";
import { clerkMiddleware, clerkClient, requireAuth, getAuth } from '@clerk/express'
import { prisma } from "./services/prisma";
import taskRoutes from './routes/tasks';
import projectRoutes from './routes/projects';
import tagRoutes from './routes/tags';
import createUser from './controllers/createUser';

const app = express();
const PORT = process.env.PORT || 3000;
const developmentFrontendOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedFrontendOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter((origin): origin is string => Boolean(origin))
  : [...new Set([process.env.FRONTEND_URL, ...developmentFrontendOrigins].filter((origin): origin is string => Boolean(origin)))];

// Webhook endpoint for Clerk
app.post('/api/webhooks', express.raw({ type: 'application/json' }), createUser);


// Middleware
app.use(clerkMiddleware());


app.use(cors({
  origin: allowedFrontendOrigins,
}));

app.use(express.json());

// Routes
app.use("/tasks", requireAuth(), taskRoutes);
app.use('/projects', requireAuth(), projectRoutes);
app.use('/tags', requireAuth(), tagRoutes);

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
