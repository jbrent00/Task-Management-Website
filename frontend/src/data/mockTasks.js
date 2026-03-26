const tasks = [
  {
    id: "1",
    title: "Finish React Task UI",
    description: "Build TaskCard and TaskList components with props",
    status: "in-progress",
    priority: "high",
    createdAt: "2026-03-20T10:00:00Z",
    dueDate: "2026-03-26T23:59:59Z",
    tags: ["frontend", "react"]
  },
  {
    id: "2",
    title: "Set Up Backend API",
    description: "Create Express server and define /tasks endpoint",
    status: "todo",
    priority: "high",
    createdAt: "2026-03-22T14:30:00Z",
    dueDate: "2026-03-30T23:59:59Z",
    tags: ["backend", "api"]
  },
  {
    id: "3",
    title: "Design Database Schema",
    description: "Plan out Task model for MongoDB/Postgres",
    status: "in-progress",
    priority: "medium",
    createdAt: "2026-03-21T09:15:00Z",
    dueDate: "2026-03-28T23:59:59Z",
    tags: ["database"]
  },
  {
    id: "4",
    title: "Implement Task Filtering",
    description: "Allow filtering by status and priority",
    status: "todo",
    priority: "medium",
    createdAt: "2026-03-23T11:00:00Z",
    dueDate: null,
    tags: ["frontend"]
  },
  {
    id: "5",
    title: "Write Unit Tests",
    description: "Add tests for task creation and deletion",
    status: "todo",
    priority: "low",
    createdAt: "2026-03-24T16:45:00Z",
    dueDate: null,
    tags: ["testing"]
  },
  {
    id: "6",
    title: "Deploy to Vercel",
    description: "Deploy frontend and connect to backend",
    status: "done",
    priority: "medium",
    createdAt: "2026-03-18T08:00:00Z",
    dueDate: "2026-03-22T23:59:59Z",
    tags: ["deployment"]
  },
  {
    id: "7",
    title: "Add Drag-and-Drop",
    description: "Enable moving tasks between columns",
    status: "todo",
    priority: "high",
    createdAt: "2026-03-25T12:00:00Z",
    dueDate: null,
    tags: ["frontend", "ux"]
  }
];

export default tasks;
