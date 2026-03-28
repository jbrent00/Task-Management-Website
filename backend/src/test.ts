import { prisma } from "./services/prisma";

async function testDatabase() {
  try {
    // Example 1: Fetch all users
    console.log("Fetching all users...");
    const users = await prisma.user.findMany();
    console.log("Users:", users);

    // Example 2: Fetch all tasks with their projects
    console.log("\nFetching all tasks...");
    const tasks = await prisma.task.findMany();
    console.log("Tasks:", tasks);

    // Example 3: Fetch all projects with their tasks
    console.log("\nFetching all projects...");
    const projects = await prisma.project.findMany({
      include: {
        Task: true,
        User: true,
      },
    });
    console.log("Projects:", projects);

    console.log("\n✅ Database queries successful!");
  } catch (error) {
    console.error("❌ Error querying database:", error);
  } finally {
    // Always close the connection when done
    await prisma.$disconnect();
  }
}

testDatabase();
