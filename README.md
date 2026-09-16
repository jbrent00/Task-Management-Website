# Task Management Website

A full-stack task workspace for organizing personal work across a three-column board. Tasks can be planned by status, priority, due date, project, and colored tags, then searched, filtered, sorted, edited, and reordered without leaving the board.

The application uses Clerk for authentication and keeps every user's tasks, projects, tags, and saved view preferences separate.

## Features

- Clerk-powered sign-up, sign-in, session management, and protected routes
- Task creation, editing, completion, deletion, and drag-and-drop reordering
- To do, In progress, and Completed board columns
- Priorities, optional due dates, project assignment, and multiple tags per task
- Colored tag indicators with compact overflow handling on task cards
- Date-focused views for today, the next seven days, overdue, unscheduled, completed, and recently completed tasks
- Search across task titles and descriptions
- Filters for status, priority, due-date state, project, and tags
- Manual, priority, due-date, title, creation-date, and completion-date sorting
- Project creation, editing, deletion, and task-count summaries
- Tag creation, editing, deletion, and a curated color picker
- Per-user view preferences persisted in local storage
- Optimistic drag-and-drop updates with rollback and feedback when a request fails
- Responsive layouts and keyboard-accessible task reordering

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, CSS Modules |
| Drag and drop | `@hello-pangea/dnd` |
| Authentication | Clerk React and Clerk Express |
| Backend | Express, TypeScript, `tsx` |
| Database | PostgreSQL, Prisma ORM, Prisma PostgreSQL adapter |
| Validation | Shared controller validation with Node's built-in test runner |

## Project structure

```text
Task-Management-Website/
├── frontend/
│   ├── src/api/                 # Authenticated API clients
│   ├── src/components/          # Reusable task, project, and tag UI
│   ├── src/functions/           # Task view, date, filter, and sort helpers
│   └── src/pages/               # Sign-in, sign-up, and task pages
└── backend/
    ├── prisma/
    │   ├── migrations/          # Versioned PostgreSQL migrations
    │   └── schema.prisma        # User, task, project, and tag models
    └── src/
        ├── controllers/         # Endpoint behavior and validation
        ├── routes/              # Task, project, and tag routes
        └── services/            # Prisma client setup
```

## Prerequisites

Install or create the following before starting:

- [Node.js](https://nodejs.org/) `20.19+` or `22.12+`
- npm
- A running PostgreSQL database
- A [Clerk](https://clerk.com/) application

## Run the application locally

### 1. Clone the repository

```bash
git clone https://github.com/jbrent00/Task-Management-Website.git
cd Task-Management-Website
```

### 2. Configure Clerk

Create a Clerk application and copy its publishable and secret keys. The frontend uses the publishable key, while the backend uses the secret key to validate authenticated API requests.

The application also stores each Clerk user in PostgreSQL. In the Clerk dashboard, create a webhook that:

- subscribes to the `user.created` event;
- sends events to `https://YOUR_PUBLIC_BACKEND_URL/api/webhooks`;
- uses the signing secret you will place in `CLERK_WEBHOOK_SIGNING_SECRET`.

For local sign-up testing, expose port `3000` through a secure tunnel and use that public URL for the webhook. Existing Clerk users who were created before the webhook was configured will not automatically exist in the local database; create a new test user after the webhook is active or add the corresponding user record through an appropriate local development workflow.

### 3. Configure and start the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
PORT=3000
FRONTEND_URL="http://localhost:5173"
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."
```

Generate the Prisma client and apply the committed migrations:

```bash
npm run generate
npm run migrate
```

Start the API:

```bash
npm run dev
```

The backend runs at `http://localhost:3000`. Confirm it is available at `http://localhost:3000/api/health`.

> The current backend development command does not watch files. Restart it after changing backend code.

### 4. Configure and start the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```dotenv
VITE_BACKEND_BASE_URL="http://localhost:3000"
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
```

Start Vite:

```bash
npm run dev
```

Open `http://localhost:5173`. Sign up or sign in, then visit `/tasks` to use the workspace.

## Environment variables

### Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `CLERK_SECRET_KEY` | Yes | Verifies Clerk sessions on protected API routes |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Yes for new-user sync | Verifies Clerk webhook signatures |
| `FRONTEND_URL` | Production; recommended locally | Allowed frontend origin for CORS |
| `PORT` | No | API port; defaults to `3000` |
| `NODE_ENV` | No | Uses production CORS behavior when set to `production` |

### Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_BACKEND_BASE_URL` | Yes | Base URL used for API requests |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Initializes Clerk in the browser |

Do not commit either `.env` file. Both are ignored by Git.

## Available commands

Run each command from its package directory.

### Frontend

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run lint` | Run ESLint across the frontend |
| `npm run build` | Validate and create the production bundle |
| `npm run preview` | Preview the production bundle locally |

### Backend

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express API with `tsx` |
| `npm test` | Run controller validation tests |
| `npm run typecheck` | Type-check the backend without emitting files |
| `npm run generate` | Regenerate the Prisma client |
| `npm run migrate` | Apply committed Prisma migrations |
| `npm run db:push` | Push the schema directly for local prototyping only |

Use `npm run migrate` for shared changes. Do not edit existing migrations, and do not use `db:push` as a substitute for committing a new migration.

## API overview

All task, project, and tag routes require a valid Clerk session token. Data access is scoped to the authenticated user.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check API availability |
| `POST` | `/api/webhooks` | Receive Clerk user events |
| `GET`, `POST` | `/tasks` | List or create tasks |
| `PUT`, `DELETE` | `/tasks/:id` | Update or delete one task |
| `PATCH` | `/tasks/bulk-update` | Persist reordered or status-changed tasks |
| `GET`, `POST` | `/projects` | List or create projects |
| `PUT`, `DELETE` | `/projects/:id` | Update or delete one project |
| `GET`, `POST` | `/tags` | List or create tags |
| `PUT`, `DELETE` | `/tags/:id` | Update or delete one tag |

Deleting a project keeps its tasks and removes their project assignment. Deleting a tag removes its task associations. Deleting a user cascades to that user's tasks, projects, tags, and task-tag relationships.

## Validation before submitting changes

Run the checks relevant to both applications:

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd backend
npm test
npm run typecheck
```

Because the repository does not currently include browser automation, manually verify affected task workflows in the frontend after making UI or API changes.
