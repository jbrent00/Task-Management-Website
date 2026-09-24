# Task Management Website

A full-stack task workspace for organizing personal and collaborative work across three-column boards. Tasks can be planned by status, priority, due date, project, assignee, and colored tags, then searched, filtered, sorted, edited, and reordered.

The application uses Clerk for authentication. Personal tasks and tags stay private, while project owners can invite verified Clerk users into shared project workspaces with owner, editor, or viewer permissions.

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
- Dedicated active/archived project overview and project workspaces
- In-app project invitations matched to verified Clerk email addresses
- Owner, editor, and viewer permissions with ownership transfer
- Multiple task assignees with permission-aware join and leave workflows
- Task discussions with structured member mentions, edit/delete markers, and in-app notifications
- Project and task activity timelines for key collaboration events
- Tag creation, editing, deletion, and a curated color picker
- Per-user view preferences persisted in local storage
- AI-assisted description and checklist drafting through an authenticated backend endpoint
- AI-assisted drafting in both personal and project task creation
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

- [Node.js](https://nodejs.org/) `22.12+`
- npm
- A running PostgreSQL database
- A [Clerk](https://clerk.com/) application
- An OpenAI API key for AI-assisted drafting

## Run the application locally

### 1. Clone the repository

```bash
git clone https://github.com/jbrent00/Task-Management-Website.git
cd Task-Management-Website
```

### 2. Configure Clerk

Create a Clerk application and copy its publishable and secret keys. The frontend uses the publishable key, while the backend uses the secret key to validate authenticated API requests.

The application also stores each Clerk user in PostgreSQL. In the Clerk dashboard, create a webhook that:

- subscribes to the `user.created` and `user.updated` events so verified invitation emails stay synchronized;
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
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5.6-luna"
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

> The backend development command watches TypeScript files and automatically restarts the Express process after changes.

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
| `OPENAI_API_KEY` | Yes for AI drafting | Server-only key used by the authenticated AI generation endpoint |
| `OPENAI_MODEL` | No | AI drafting model; defaults to `gpt-5.6-luna` |

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
| `npm test` | Run Vitest component and frontend policy tests |
| `npm run build` | Validate and create the production bundle |
| `npm run preview` | Preview the production bundle locally |

### Backend

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express API with `tsx` watch mode |
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
| `POST` | `/tasks/ai/generate` | Generate a draft description or five checklist items |
| `PATCH` | `/tasks/bulk-update` | Persist reordered or status-changed tasks |
| `GET`, `POST` | `/projects` | List accessible projects or create a private project |
| `GET`, `PATCH`, `DELETE` | `/projects/:id` | Read, update, or permanently delete a project |
| `POST` | `/projects/:id/archive`, `/projects/:id/restore` | Change project archive state |
| `GET`, `POST` | `/projects/:id/tasks` | List or create project tasks |
| `GET` | `/projects/:id/activity` | Read the paginated project or task activity timeline |
| `GET`, `POST` | `/tasks/:id/comments` | Read or add task comments and structured mentions |
| `PATCH`, `DELETE` | `/tasks/:id/comments/:commentId` | Edit or soft-delete a task comment |
| `POST`, `DELETE` | `/projects/:id/invitations` | Create or revoke in-app invitations |
| `PATCH`, `DELETE` | `/projects/:id/members/:userId` | Change a role or remove/leave membership |
| `GET`, `POST` | `/project-invitations` | List and accept/decline the current user's invitations |
| `GET`, `POST` | `/tags` | List or create tags |
| `PUT`, `DELETE` | `/tags/:id` | Update or delete one tag |

Deleting a project permanently deletes its project tasks, shared tags, memberships, and invitations after exact-title confirmation. Removing a member preserves project tasks and clears their assignments. Deleting a personal tag removes its personal-task associations.

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
