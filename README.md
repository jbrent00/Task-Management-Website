# Task Management Website - Monorepo

This project is organized as a monorepo with separate frontend and backend applications.

## Project Structure

```
├── frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── index.html
│
├── backend/           # Node.js backend with Prisma
│   ├── src/
│   │   ├── services/
│   │   │   └── prisma.js    # Prisma client instance
|   |   ├── controllers/     # Querying database and sending response
|   |   ├──routes/           # Routes
|   |   |   └──tasks.js 
│   │   └── index.js         # Express server entry point
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Start dev server on http://localhost:5173
npm run build     # Build for production
npm run lint      # Run ESLint
```

### Backend Setup

```bash
cd backend
npm install
```

**Configure Database:**
1. Create a PostgreSQL database
2. Update `backend/.env` with your `DATABASE_URL`

**Initialize Prisma:**
```bash
cd backend
npm run generate  # Generate Prisma client
npm run migrate   # Run migrations
npm run dev       # Start backend server on http://localhost:3000
```

## Environment Variables

### Backend (`.env`)
```
DATABASE_URL="postgresql://user:password@localhost:5432/task_manager"
PORT=3000
```

## Development

**Frontend:**
- Vite for fast development
- React 19
- ESLint for code quality

**Backend:**
- Express.js for API
- Prisma ORM for database
- PostgreSQL database

## Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter

**Backend:**
- `npm run dev` - Start server
- `npm run generate` - Generate Prisma client
- `npm run migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
