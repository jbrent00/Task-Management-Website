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
      {
        title: 'Finish React Task UI',
        description: 'Build TaskCard and TaskList components with props',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2026-10-27T22:37:45.674Z'),
        userId: user.id,
      },
      {
        title: 'Set Up Backend API',
        description: 'Create Express server and define /tasks endpoint',
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2026-07-15T22:39:04.778Z'),
        userId: user.id,
      },
      {
        title: 'Design Database Schema',
        description: 'Plan out Task model for Postgres/Prisma',
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date('2026-12-24T00:40:26.813Z'),
        userId: user.id,
      },
      {
        title: 'Implement Task Filtering',
        description: 'Allow filtering by status and priority',
        status: 'todo',
        priority: 'low',
        userId: user.id,
      },
      {
        title: 'Write Unit Tests',
        description: 'Add tests for task creation and deletion',
        status: 'todo',
        priority: 'low',
        userId: user.id,
      },
      {
        title: 'Deploy to Vercel',
        description: 'Deploy frontend and connect to backend',
        status: 'completed',
        priority: 'medium',
        dueDate: new Date('2026-07-14T22:44:00.029Z'),
        userId: user.id,
      },
      {
        title: 'Add Drag-and-Drop',
        description: 'Enable moving tasks between columns',
        status: 'todo',
        priority: 'high',
        dueDate: new Date('2026-04-01T22:16:00.000Z'),
        userId: user.id,
      },
    ]
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())