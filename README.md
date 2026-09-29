# Flowboard

**Personal tasks that grow into shared projects.** Flowboard is a full-stack task workspace I designed and built to make daily planning simple, then add assignments, discussion, and accountability when a team joins. It combines a three-column board with task details, project collaboration, and a hands-on guest demo.

Designed and built by **Justin Brent**.

**Explore:** [GitHub repository](https://github.com/jbrent00/Task-Management-Website) · [Try the guest demo locally](#try-the-guest-demo) · [View the case study locally](http://localhost:5173/case-study) (after starting the frontend)

**Live site:** Coming soon. The deployed URL will replace this line.

## See Flowboard

### Landing page

![Flowboard landing page with the personal-to-shared project message and a real project board](docs/screenshots/landing-desktop.jpg)

The public page introduces the product through real interface captures and links to the interactive guest workspace.

### Personal task board

![Personal task board with date views, search, filters, and To do, In progress, and Completed columns](frontend/public/captures/my-tasks.jpg)

Date-focused views and filters help narrow the board without losing the task's priority, due date, tags, or checklist progress.

### Shared project

![Northline project board showing shared tasks, assignees, tags, and project navigation](frontend/public/captures/project-board.jpg)

Projects add assignees, discussions, activity history, invitations, and owner/editor/viewer permissions to the same task workflow.

### Mobile workspace

<img src="docs/screenshots/tasks-mobile.jpg" alt="Flowboard mobile task workspace with compact controls, status tabs, task cards, and bottom navigation" width="390">

The layout replaces the desktop columns with a single selected status and keeps navigation and task actions usable on a narrow screen.

## What I built

- **Personal planning:** Create, edit, complete, delete, search, filter, sort, and reorder tasks. Use priorities, due dates, colored tags, checklists, and focused date views.
- **Shared work:** Move from private tasks to projects with multiple assignees, invitations, task discussion and mentions, notifications, and activity timelines. The API enforces owner, editor, and viewer policy; owners can archive projects or transfer ownership.
- **Reliable interactions:** Drag-and-drop and keyboard task movement update the board immediately. If saving fails, the previous order returns with feedback. The interface includes visible focus states, responsive layouts, and reduced-motion support.
- **Optional AI drafting:** An authenticated backend endpoint generates editable description and checklist drafts for personal or project tasks; the API key stays on the server.
- **Guest workspace:** A seeded personal board and shared project run in browser-local storage, so someone can try core task workflows without an account, database, or backend.

## Try the guest demo

From `frontend/`, run `npm install` and `npm run dev`, then open **`http://localhost:5173/demo`**. The guest route does not initialize Clerk or call the backend, so the frontend server is enough. Visit `http://localhost:5173/` for the landing page and `http://localhost:5173/case-study` for the design and engineering case study; those public routes use Clerk and need the frontend publishable key described below.

In the demo you can create, edit, complete, reopen, move, search, filter, sort, and reorder tasks in a personal board or the seeded project. You can edit tags and checklists, browse sample discussion and activity, and use **Reset demo** to restore the sample. Changes are saved in this browser under `flowboard:demo-workspace:v1` until reset.

Guests cannot create projects, invite members, change memberships, post discussions, use notifications, or request AI drafts. Those actions require an account and the full stack.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, CSS Modules |
| Drag and drop | `@hello-pangea/dnd` |
| Authentication | Clerk React and Clerk Express |
| Backend | Express, TypeScript, `tsx` |
| Database | PostgreSQL, Prisma ORM, Prisma PostgreSQL adapter |
| Tests | Vitest and Testing Library on the frontend; Node's test runner through `tsx` on the backend |

## Project structure

```text
Task-Management-Website/
├── frontend/
│   ├── src/api/                 # Authenticated API clients
│   ├── src/components/          # Reusable task, project, and tag UI
│   ├── src/functions/           # Task view, date, filter, and sort helpers
│   └── src/pages/               # Public, demo, auth, task, and project pages
└── backend/
    ├── prisma/
    │   ├── migrations/          # Versioned PostgreSQL migrations
    │   └── schema.prisma        # User, task, project, and tag models
    └── src/
        ├── controllers/         # Endpoint behavior and validation
        ├── routes/              # Authenticated task, project, and collaboration routes
        └── services/            # Database, user profile, policy, and AI services
```

## Prerequisites for the full stack

Install or create the following before starting:

- [Node.js](https://nodejs.org/) `22.12+`
- npm
- A running PostgreSQL database
- A [Clerk](https://clerk.com/) application
- An OpenAI API key if you want to use AI-assisted drafting

## Run the full application locally

### 1. Clone the repository

```bash
git clone https://github.com/jbrent00/Task-Management-Website.git
cd Task-Management-Website
```

### 2. Configure Clerk

Create a Clerk application and copy its publishable and secret keys. The frontend uses the publishable key, while the backend uses the secret key to validate authenticated API requests.

The application stores Clerk users in PostgreSQL. For ongoing profile and verified-email updates, create a webhook in the Clerk dashboard that:

- subscribes to the `user.created` and `user.updated` events so verified invitation emails stay synchronized;
- sends events to `https://YOUR_PUBLIC_BACKEND_URL/api/webhooks`;
- uses the signing secret you will place in `CLERK_WEBHOOK_SIGNING_SECRET`.

For local webhook testing, expose port `3000` through a secure tunnel and use that public URL for the webhook. On the first authenticated API request, the backend also creates a local profile for a Clerk user who is not yet in the database. Keep the webhook configured so later profile and verified-email changes stay synchronized.

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
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..." # When using the Clerk webhook
OPENAI_API_KEY="sk-..."                # Optional; enables AI drafting
OPENAI_MODEL="gpt-5.6-luna"             # Optional
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

Open `http://localhost:5173`. Sign up or sign in, then visit `/tasks` to use the authenticated workspace. You can also visit `/demo` for the browser-local guest workspace described above.

## Environment variables

### Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `CLERK_SECRET_KEY` | Yes | Verifies Clerk sessions on protected API routes |
| `CLERK_WEBHOOK_SIGNING_SECRET` | If webhook configured | Verifies Clerk webhook signatures for ongoing profile and email updates |
| `FRONTEND_URL` | Production; recommended locally | Allowed frontend origin for CORS |
| `PORT` | No | API port; defaults to `3000` |
| `NODE_ENV` | No | Uses production CORS behavior when set to `production` |
| `OPENAI_API_KEY` | Yes for AI drafting | Server-only key used by the authenticated AI generation endpoint |
| `OPENAI_MODEL` | No | AI drafting model; defaults to `gpt-5.6-luna` |

### Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_BACKEND_BASE_URL` | For signed-in app | Base URL used for API requests |
| `VITE_CLERK_PUBLISHABLE_KEY` | For public and signed-in routes | Initializes Clerk in the browser; not needed for a direct `/demo` visit |

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
| `npm test` | Run controller, policy, AI, and collaboration tests |
| `npm run typecheck` | Type-check the backend without emitting files |
| `npm run generate` | Regenerate the Prisma client |
| `npm run migrate` | Apply committed Prisma migrations |
| `npm run db:push` | Push the schema directly for local prototyping only |

Use `npm run migrate` for shared changes. Do not edit existing migrations, and do not use `db:push` as a substitute for committing a new migration.

## API overview

Task, project, invitation, notification, and tag routes require a valid Clerk session token. Data access is scoped to the authenticated user. The health and Clerk webhook routes are public; the webhook verifies its signature.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check API availability |
| `POST` | `/api/webhooks` | Receive Clerk user events |
| `GET`, `POST` | `/tasks` | List or create tasks |
| `PUT`, `DELETE` | `/tasks/:id` | Update or delete one task |
| `POST` | `/tasks/ai/generate` | Generate a draft description or five checklist items |
| `PATCH` | `/tasks/bulk-update` | Persist reordered or status-changed tasks |
| `POST` | `/tasks/:id/join`, `/tasks/:id/leave` | Join or leave a project task where permitted |
| `POST`, `PATCH`, `DELETE`, `PUT` | `/tasks/:taskId/checklist-items/*` | Create, edit, delete, or reorder checklist items |
| `GET`, `POST` | `/projects` | List accessible projects or create a private project |
| `GET`, `PATCH`, `DELETE` | `/projects/:id` | Read, update, or permanently delete a project |
| `POST` | `/projects/:id/archive`, `/projects/:id/restore` | Change project archive state |
| `GET`, `POST` | `/projects/:id/tasks` | List or create project tasks |
| `GET` | `/projects/:id/activity` | Read the paginated project or task activity timeline |
| `GET`, `POST` | `/tasks/:id/comments` | Read or add task comments and structured mentions |
| `PATCH`, `DELETE` | `/tasks/:id/comments/:commentId` | Edit or soft-delete a task comment |
| `POST` | `/projects/:id/invitations` | Create an in-app project invitation |
| `DELETE` | `/projects/:id/invitations/:invitationId` | Revoke an invitation |
| `PATCH`, `DELETE` | `/projects/:id/members/:userId` | Change a role or remove/leave membership |
| `POST` | `/projects/:id/transfer-ownership` | Transfer project ownership |
| `GET` | `/project-invitations` | List the current user's invitations |
| `POST` | `/project-invitations/:invitationId/accept`, `/project-invitations/:invitationId/decline` | Respond to an invitation |
| `GET`, `POST` | `/notifications`, `/notifications/read` | List and mark notifications read, respectively |
| `GET`, `POST` | `/tags` | List or create tags |
| `PUT`, `DELETE` | `/tags/:id` | Update or delete one tag |
| `POST`, `PATCH`, `DELETE` | `/projects/:projectId/tags/*` | Manage shared project tags |

Deleting a project permanently deletes its project tasks, shared tags, memberships, and invitations after exact-title confirmation. Removing a member preserves project tasks and clears their assignments. Deleting a personal tag removes its personal-task associations.

## Validation before submitting changes

Run the checks relevant to both applications:

```bash
cd frontend
npm run lint
npm test
npm run build
```

```bash
cd backend
npm test
npm run typecheck
```

The repository does not currently include browser automation. Manually verify affected task workflows after UI or API changes. The frontend tests cover guest-demo isolation, persistence, reset, and core operations.
