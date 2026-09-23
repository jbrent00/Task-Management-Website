import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.create({
    data: {
      id: '1',
      fname: 'John',
      lname: 'Doe',
    }
  })

  await prisma.task.createMany({
    data: [
      // --- TODO (0, 1, 2) ---
      {
        title: 'Set Up Backend API',
        description: 'Create Express server and define /tasks endpoint',
        status: 'todo',
        priority: 'high',
        orderIndex: 0,
        dueDate: new Date('2026-07-15T22:39:04.778Z'),
        createdById: user.id,
      },
      {
        title: 'Implement Task Filtering',
        description: 'Allow filtering by status and priority',
        status: 'todo',
        priority: 'low',
        orderIndex: 1,
        createdById: user.id,
      },
      {
        title: 'Write Unit Tests',
        description: 'Add tests for task creation and deletion',
        status: 'todo',
        priority: 'low',
        orderIndex: 2,
        createdById: user.id,
      },
      {
        title: 'Add Drag-and-Drop',
        description: 'Enable moving tasks between columns',
        status: 'todo',
        priority: 'high',
        orderIndex: 3,
        dueDate: new Date('2026-04-01T22:16:00.000Z'),
        createdById: user.id,
      },
      // --- IN PROGRESS (0, 1) ---
      {
        title: 'Finish React Task UI',
        description: 'Build TaskCard and TaskList components with props',
        status: 'in_progress',
        priority: 'high',
        orderIndex: 0,
        dueDate: new Date('2026-10-27T22:37:45.674Z'),
        createdById: user.id,
      },
      {
        title: 'Design Database Schema',
        description: 'Plan out Task model for Postgres/Prisma',
        status: 'in_progress',
        priority: 'medium',
        orderIndex: 1,
        dueDate: new Date('2026-12-24T00:40:26.813Z'),
        createdById: user.id,
      },
      // --- COMPLETED (0) ---
      {
        title: 'Deploy to Vercel',
        description: 'Deploy frontend and connect to backend',
        status: 'completed',
        priority: 'medium',
        orderIndex: 0,
        dueDate: new Date('2026-07-14T22:44:00.029Z'),
        createdById: user.id,
      },
    ]
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
