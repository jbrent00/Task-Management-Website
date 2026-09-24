# Flowboard Portfolio Redesign Implementation Plan

## Status

- Design direction: approved
- `DESIGN.md`: approved
- Six landing-page composition references: approved
- Application implementation: not started
- Backend schema changes: not required

The approved visual references live in `docs/design-references/`. They establish hierarchy, composition, palette, material direction, and component character. They are not production screenshots and must not be embedded in the shipped site as substitutes for real Flowboard UI.

## Objective

Redesign Flowboard as a complete, portfolio-ready product for individuals and small teams. Preserve its real functionality, backend behavior, data model, permissions, and existing authenticated route URLs while replacing the generic blue SaaS styling with the calm-precision system defined in `DESIGN.md`.

The public product story is:

> Start with your own work. Bring in a team when the work grows.

The primary public conversion is:

> Explore the demo

## Approved technical direction

- Keep React 19, Vite, React Router, and CSS Modules.
- Do not migrate to Tailwind or introduce a component design system.
- Add `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`, `@phosphor-icons/react`, and `motion`.
- Use individually imported Phosphor icons.
- Use Motion only for meaningful hierarchy, feedback, and state transitions.
- Do not add GSAP, scroll hijacking, custom cursors, or perpetual decorative animation.
- Use route-level lazy loading for public, demo, case-study, and authenticated application groups.
- Preserve the Express API and Prisma schema unless an implementation blocker proves a backend change is necessary.

## Target routes

| Route | Access | Target behavior |
| --- | --- | --- |
| `/` | Public | New six-section product landing page |
| `/demo` | Public | Local, seeded, interactive guest workspace with no Clerk or backend calls |
| `/case-study` | Public | Portfolio case study grounded in verified repository features |
| `/sign-in/*` | Public | Branded Clerk sign-in experience |
| `/sign-up/*` | Public | Branded Clerk sign-up experience |
| `/tasks` | Protected | Existing personal task workspace in the redesigned product shell |
| `/projects` | Protected | Existing project overview in the redesigned product shell |
| `/projects/:projectId` | Protected | Existing collaborative project workspace in the redesigned product shell |
| `*` | Public | Designed not-found page |

The landing page remains accessible while signed in. Its account CTA changes to Open app when appropriate rather than redirecting the root route.

## Implementation phases

### Phase 1: Foundation and product shell

1. Install the approved font, icon, and motion dependencies.
2. Replace the global color system with the semantic light and dark tokens in `DESIGN.md`.
3. Add a theme provider with `system`, `light`, and `dark` preferences.
4. Persist the preference as `flowboard:theme`, apply the resolved theme through `data-theme`, and react to operating-system theme changes when the preference is `system`.
5. Synchronize Clerk appearance tokens with the resolved theme.
6. Create reusable brand, icon-button, theme-menu, button, field, panel, skeleton, empty-state, and feedback foundations where repetition justifies a component.
7. Create the geometric Flowboard mark, favicon, and typographic wordmark.
8. Replace the authenticated top navigation with:
   - a 232px expanded and 72px collapsed desktop sidebar at 768px and above;
   - a 60px mobile top bar for brand, notifications, and account controls;
   - mobile bottom navigation for My tasks and Projects with safe-area spacing.
9. Preserve `/tasks`, `/projects`, and `/projects/:projectId` behavior and labels.
10. Add route-level lazy loading without changing authentication behavior.
11. Add tests for theme resolution, theme persistence, system changes, shell navigation, and protected-route behavior.

Completion gate:

- Existing authenticated workflows still function.
- Light and dark themes render correctly.
- Desktop and mobile navigation are usable by keyboard and touch.
- Frontend lint, tests, and build pass.

### Phase 2: Authenticated product redesign

Apply the approved product-density rules across all existing screens and states without changing API contracts.

1. Redesign the personal task page:
   - page header and task count;
   - date-focused task tabs;
   - search, sorting, and filter controls;
   - create-task disclosure;
   - three-column board above 960px;
   - existing single-status mobile behavior below 960px.
2. Redesign task cards with stable action placement, clear metadata hierarchy, consistent semantic status, Phosphor controls, and keyboard-accessible drag handling.
3. Redesign task creation, task details, checklist editing, comments, activity, assignment fields, member selection, tag management, and confirmation dialogs.
4. Redesign the project overview without using a generic repeated marketing-card aesthetic.
5. Redesign project Board, Activity, Members, and Settings tabs while preserving owner/editor/viewer policy behavior.
6. Restyle invitations, notifications, loading, empty, success, warning, and error states.
7. Replace Unicode arrows, disclosure glyphs, close marks, overflow marks, and hand-authored interface SVGs with Phosphor icons.
8. Preserve focus restoration, dialog trapping, keyboard reordering, optimistic rollback, and inline error recovery.
9. Update or add component tests as affected components are refactored.

Completion gate:

- Personal and collaborative task workflows remain operational.
- Permissions remain consistent with backend policy.
- All affected tests pass.
- Product screens pass visual review at 375px, 768px, 1024px, and 1440px in both themes.

### Phase 3: Public experience

#### Landing page

Build exactly six sections, corresponding to the approved references:

1. **Hero**
   - Off-grid editorial composition
   - Headline: `Plan clearly. Move together.`
   - Support: `Organize your own work, then bring people in when a project needs shared momentum.`
   - Explore the demo primary CTA
   - Create an account secondary CTA
   - Real redesigned Flowboard capture plus restrained tactile planning material
2. **Personal planning**
   - Real task workspace capture
   - Date views, filtering, checklist detail, and drag behavior
3. **Shared projects**
   - Real project workspace and task-detail capture
   - Assignments, comments, permissions, and activity
4. **Product depth**
   - Exactly five cells: task details, comments and notifications, tags, due-date views, and AI drafting/checklists
   - At least two cells use real product captures
5. **Built for real workflows**
   - Accessibility, permission-aware collaboration, and recoverable optimistic updates
   - No invented metrics
6. **Closing CTA and footer**
   - One decisive demo CTA
   - Account creation remains secondary
   - `Designed and built by Justin Brent.`
   - GitHub and case-study links

Do not add fake customer logos, testimonials, pricing, adoption figures, performance metrics, or unsupported product capabilities.

#### Supporting public pages

1. Add `/case-study` with:
   - product overview and problem;
   - intended audience and portfolio goals;
   - design-system decisions;
   - frontend/backend architecture and data flow;
   - verified feature set;
   - testing and accessibility approach;
   - lessons learned;
   - the existing GitHub repository link.
2. Redesign `/sign-in` and `/sign-up` with a shared auth layout and Clerk styling derived from the active theme.
3. Reuse an approved tactile image crop on desktop auth layouts. Remove nonessential imagery on mobile.
4. Add a designed not-found page.
5. Update the favicon, document title, meta description, and social-preview treatment.
6. Capture the redesigned real product UI for landing-page visuals. Do not ship generated fake interface imagery.

Completion gate:

- Public routing works for signed-in and signed-out visitors.
- Landing claims correspond to implemented behavior.
- Public pages work in both themes and at required responsive widths.
- Real product captures replace generated UI portions of the composition references.

### Phase 4: Interactive guest demo

Add `/demo` using the real product shell and shared task components.

1. Introduce a workspace-operations boundary instead of duplicating product UI.
2. Provide two implementations:
   - authenticated operations backed by the existing API clients;
   - demo operations backed only by local state and `localStorage`.
3. Persist versioned demo data under `flowboard:demo-workspace:v1`.
4. Seed realistic personal tasks, tags, checklist items, and one collaborative project.
5. Support locally:
   - task creation, editing, deletion, completion, and reopening;
   - drag reordering and status movement;
   - search, filters, sorting, tags, and due dates;
   - checklist creation, editing, completion, deletion, and reordering;
   - task-detail browsing;
   - browsing a seeded collaborative project.
6. Provide a clear Reset demo action.
7. Demo mode must never call Clerk or backend APIs.
8. Disable invitations, AI generation, notifications, membership administration, and destructive project settings in demo mode. Explain the limitation and link to account creation where useful.
9. Add tests proving demo isolation, persistence, reset behavior, and core task operations.

Completion gate:

- Demo actions survive reload through local storage.
- Reset restores the original seed.
- Network inspection and automated tests show no Clerk or backend requests from demo operations.
- Shared UI behavior stays aligned between authenticated and demo modes.

### Phase 5: Final verification and delivery

1. Run all frontend lint, tests, and production build.
2. Run relevant backend tests and type checking to confirm no regressions.
3. Manually verify:
   - signed-in and signed-out routing;
   - task CRUD and drag-and-drop;
   - checklists and task details;
   - project collaboration, roles, comments, activity, and invitations;
   - all public routes;
   - guest demo persistence and reset;
   - loading, empty, success, warning, and error states.
4. Test 375px, 768px, 1024px, and 1440px in light and dark themes.
5. Test keyboard operation, focus order, focus restoration, dialog trapping, reduced motion, and 200 percent zoom.
6. Run Lighthouse against the landing page and target:
   - LCP below 2.5 seconds;
   - INP below 200 milliseconds;
   - CLS below 0.1.
7. Run the complete `design-taste-frontend` pre-flight review.
8. Audit visible strings for unsupported claims, broken grammar, and em dash or en dash characters.
9. Review the final diff for unrelated changes and preserve pre-existing user work.

## Internal interfaces

### Theme state

The public theme interface exposes:

```js
{
  preference: 'system' | 'light' | 'dark',
  resolvedTheme: 'light' | 'dark',
  setPreference(nextPreference)
}
```

### Workspace operations

The implementation may refine exact method names after inspecting current API signatures, but the boundary must cover these behaviors:

```js
{
  mode: 'authenticated' | 'demo',
  getTasks(),
  createTask(input),
  updateTask(taskId, input),
  deleteTask(taskId),
  reorderTasks(updates),
  getProjects(),
  getProject(projectId),
  getTags(),
  createTag(input),
  updateTag(tagId, input),
  deleteTag(tagId),
  createChecklistItem(taskId, input),
  updateChecklistItem(taskId, itemId, input),
  deleteChecklistItem(taskId, itemId),
  reorderChecklistItems(taskId, itemIds)
}
```

Authenticated mode delegates to the current API functions. Demo mode performs equivalent local updates without requesting an auth token.

## Testing requirements

Required automated scenarios include:

- Public landing, demo, case-study, authentication, protected-route, and not-found routing
- Theme initialization, persistence, system changes, and Clerk appearance integration
- Sidebar expansion, active navigation, and mobile navigation behavior
- Demo storage initialization, migration/version replacement, persistence, reset, and API isolation
- Task create, update, delete, complete, reopen, and reorder through the operations boundary
- Checklist CRUD and reorder through both applicable operation modes
- Existing project policy, comments, tag, modal, and task-card tests remain green
- Dialog focus restoration and keyboard-accessible controls where practical in component tests

## Repository safety

- Inspect `git status` and relevant diffs before every phase.
- Existing modifications belong to the user unless proven otherwise.
- Do not overwrite or revert unrelated changes.
- Do not edit existing Prisma migrations.
- Do not commit unless the user explicitly requests it.
- Keep changes focused and reviewable by phase.

## Skill requirements

- `design-taste-frontend` is the sole design authority for implementation and final review.
- `imagegen-frontend-web` is used whenever new website imagery or visual-reference generation is needed.
- Do not use a default Codex design skill.
- Do not regenerate the six approved comps unless the user explicitly requests revisions.

## Recommended chat boundaries

Start a new chat after each completed and verified phase:

1. Foundation and product shell
2. Authenticated product redesign
3. Public experience
4. Interactive guest demo
5. Final verification and delivery

Do not switch chats halfway through a component refactor or while checks are failing without recording the exact unfinished state and failures in this document or a dedicated handoff note.
