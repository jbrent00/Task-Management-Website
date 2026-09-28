# Phase 5 verification record, 2026-09-28

Status: verification performed on `main` starting at `157b6ed`. Phase 5 is still open because the mobile LCP target was missed. Phase 3 is **visually unaccepted** pending the user's explicit review. The user subsequently authorized committing and pushing this checkpoint.

## Automated checks

| Package | Command | Result |
| --- | --- | --- |
| Frontend | `npm run lint` | Passed |
| Frontend | `npm test` | 70 tests in 21 files passed |
| Frontend | `npm run build` | Passed, production route chunks emitted |
| Backend | `npm run generate` | Passed after adding the Prisma field |
| Backend | `npm run migrate` | Migration `20260928190000_add_viewer_comment_policy` applied locally |
| Backend | `npm test` | 40 tests passed, including the new viewer policy case |
| Backend | `npm run typecheck` | Passed |
| Repository | `git diff --check` | Passed; Git reported only line-ending conversion notices |

## Live browser evidence

The Chrome account was signed in as the owner of temporary project 363. The Codex in-app browser first held the editor account (`jbrentcoursera4@gmail.com`), then the user switched it to the viewer account (`justinbrentpurdue@gmail.com`). The test used only newly created project 363 and newly created personal task 460. The existing Northline project 345 and pre-existing tasks were not edited or deleted.

| Surface | Action and visible result |
| --- | --- |
| Signed-in tasks | Created task 460, edited its title and description, added and completed a checklist item, moved it from To do to In progress, reloaded to confirm persistence, then deleted it. The remaining signed-in task count returned to 2. |
| Owner project | Created project 363 and task 461 with a checklist. Invited the editor and viewer to distinct roles. The project board, task details, member list, settings, invitation state, and activity were inspected. Archived and restored the temporary project; the archived state showed read-only settings and the restore action. |
| Editor session | Accepted the invitation; created task 462, assigned it to the editor, edited its title, commented, completed and reopened it, and used Space, Arrow Up, Space to reorder it. Activity reflected creation, assignment, and comment. Settings were owner-only, and member invitation controls were absent. |
| Viewer session | Accepted the viewer invitation. Task creation, drag, completion, fields, and checklist mutation were unavailable; task details remained readable. Settings were owner-only and member invitation controls were absent. The viewer posted a comment while comments were enabled by default. The owner disabled viewer comments; after reload, the same comment remained readable while the composer and edit/delete controls were absent. The owner restored defaults; the composer returned. The API integration test separately confirmed create, update, and delete return 403 while disabled. |
| Guest demo | Direct `/demo` entry opened `/demo/tasks` with 6 seeded tasks. A new personal demo task persisted after reload and Reset demo restored the 6-task seed. A new project demo task persisted after reload and was removed by Reset demo. AI controls were visibly disabled with account guidance. |
| Signed-out routes | After signing out the viewer account, `/tasks`, `/projects`, and `/projects/363` each landed on `/sign-in`. Direct `/`, `/case-study`, `/demo`, `/sign-up`, and an unknown route showed their expected page headings; `/demo` landed on `/demo/tasks`. |
| Interaction states | Observed route loading skeletons, empty task columns and discussion, success notifications, archive state, disabled controls, and destructive-action warning dialogs. The frontend tests cover failed saves and retained drafts; no backend failure was deliberately injected into a signed-in account. |

After the user's explicit cleanup confirmation, Chrome deleted personal task 460 and project 363, including its temporary tasks, comments, and memberships. The Chrome project list again showed only the existing Northline project. The viewer account was signed out. Guest demo data was reset.

## Layout and input audit

The landing, case study, guest task and project pages, signed-in tasks, and the temporary signed-in project were inspected in light and dark themes at 375px, 768px, 1024px, and 1440px. The browser's `documentElement.scrollWidth` equaled `clientWidth` at the measured breakpoints. Narrow and desktop screenshots were visually inspected, including the 375px and 768px project settings layouts. The owner setting and disabled viewer discussion state were checked in the live browsers. The 375px landing hero was adjusted to a two-line heading and visually rechecked with the optimized still-life image.

Keyboard activation opened task details. Twelve forward Tab presses, followed by ten more, kept focus inside the dialog and wrapped to its first controls. Escape closed the dialog and returned focus to its triggering Edit button. A focused control showed a solid outline. Keyboard drag was exercised in the editor session. A 720px effective CSS viewport, corresponding to the layout width of a 1440px window at 200% zoom, showed no document overflow on landing, tasks, or projects. The user then set the live Chrome tab to 200% zoom. Chrome reported a 3x device pixel ratio and an approximately 846px CSS viewport; signed-in Tasks and Projects, the landing page, and Case Study each rendered without document-level horizontal overflow. Tasks and Projects screenshots showed readable controls and intact navigation at that zoom. In a separate Chrome tab, the user enabled DevTools `prefers-reduced-motion: reduce`; `matchMedia` returned true on Tasks and landing. Sampled controls and the landing hero image computed animation and transition durations of 0.00001 s, and both routes had no document-level horizontal overflow. The user was reminded to restore the DevTools emulation and 100% zoom after the audit.

## Performance and design audit

Lighthouse 12.8.2 loaded the production Vite preview at `http://127.0.0.1:4173/` in fresh headless Chrome. Full JSON evidence is in [mobile](verification/phase5-lighthouse-mobile-2026-09-28.json) and [desktop](verification/phase5-lighthouse-desktop-2026-09-28.json). Both reports contain no run warnings or runtime error. On Windows, the CLI returned exit code 1 only after writing each report because a temporary Chrome profile file was locked during cleanup.

| Mode | Performance | Accessibility | LCP | CLS | Total blocking time | INP |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Mobile | 85 | 100 | 4.0 s | 0 | 2 ms | Not available in navigation-only lab run |
| Desktop | 97 | 100 | 1.2 s | 0.001 | 0 ms | Not available in navigation-only lab run |

The mobile LCP remains above the planned 2.5 s target; the desktop run meets it. The original 2.14 MB still-life PNG was encoded as a visually equivalent 308 KB JPEG and used for the landing, auth, and not-found imagery. An additional 900px-wide, 89 KB mobile JPEG is selected by the landing `<picture>` and closing-section CSS at widths up to 767px. `fetchPriority="high"` was added to the hero image. The final production mobile result was 4.0 s versus 14.0 s in an earlier PNG run, though another PNG run measured 3.5 s, so the lab result has variation. Lighthouse's LCP breakdown attributes most of the remaining mobile time to image render delay. A masked-image replacement was tried, measured, and reverted because it made no measurable improvement. Lighthouse found one low-contrast landing paragraph; using the normal text token raised the landing accessibility score from 95 to 100.

The sole design authority was `design-taste-frontend`. Design read: a task-management product for individuals and teams, with restrained utility-focused visuals using Flowboard's existing native CSS tokens and Phosphor icons. The audit dials were `DESIGN_VARIANCE: 5`, `MOTION_INTENSITY: 3`, and `VISUAL_DENSITY: 5`. The applicable pre-flight review checked theme and accent consistency, type hierarchy, buttons and forms, spacing and radius consistency, authentic product images, responsive containment, keyboard-visible focus, and restrained motion. The mobile hero was brought to two headline lines; numbered workflow labels were removed. The mobile Core Web Vitals LCP box remains open. Phase 3 visual acceptance remains reserved for the user's review.

## Copy and scope

Visible source strings were searched for em dash and en dash characters; none were found in `frontend/src` or `frontend/index.html`. The role explanation was updated to state that viewers may discuss tasks when the owner allows it, and the member and invite copy now matches that rule. The landing copy and route headings were read in the browser for broken grammar and unsupported claims. The final diff is confined to the viewer-comment policy, its migration and tests, the related copy, the landing contrast and hero performance changes, and this verification record.
