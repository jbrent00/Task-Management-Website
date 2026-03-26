// Backend entry point
import express from "express";
import taskRoutes from './routes/tasks.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

app.use("/tasks", taskRoutes);

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
