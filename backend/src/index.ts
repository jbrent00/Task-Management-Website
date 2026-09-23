// Backend entry point
import express from "express";
import cors from "cors";
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express'
import { prisma } from "./services/prisma";
import taskRoutes from './routes/tasks';
import projectRoutes from './routes/projects';
import tagRoutes from './routes/tags';
import createUser from './controllers/createUser';
import projectInvitationRoutes from './routes/projectInvitations';
import notificationRoutes from './routes/notifications';
import { ensureCurrentUserProfile } from './services/userProfile';

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
const authenticated = [requireAuth(), async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { userId } = getAuth(req);
  try { if (userId) await ensureCurrentUserProfile(userId); next(); }
  catch (error) { console.error('Failed to synchronize user profile', error); res.status(500).json({ error: 'Failed to load user profile' }); }
}] as const;
app.use("/tasks", ...authenticated, taskRoutes);
app.use('/projects', ...authenticated, projectRoutes);
app.use('/project-invitations', ...authenticated, projectInvitationRoutes);
app.use('/notifications', ...authenticated, notificationRoutes);
app.use('/tags', ...authenticated, tagRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running!" });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled request error', error);
  if (!res.headersSent) res.status(500).json({ error: 'The request could not be completed' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
