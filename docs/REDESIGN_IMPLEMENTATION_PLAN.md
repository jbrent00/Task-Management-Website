# Flowboard Portfolio Redesign Implementation Plan

## Status

- Design direction: approved
- `DESIGN.md`: approved
- Six landing-page composition references: approved
- Phase 1, Foundation and product shell: complete and verified on 2026-09-24
- Phase 2, Authenticated product redesign: in progress; additional user-requested visual refinements are queued before acceptance
- Application implementation: in progress
- Next implementation phase: implement the Phase 2 refinement backlog below, then request another user visual review
- Phase 3 is blocked until the user accepts the Phase 2 visual result
- Backend schema changes: none identified; board-targeted task creation needs creation-endpoint status support

### Phase 1 completion record

Completed:

- Added the approved Geist Variable, Geist Mono Variable, Phosphor, and Motion dependencies.
- Replaced the global blue palette with the semantic light and dark tokens from `DESIGN.md`, including shared radii, shadows, focus treatment, disabled states, and reduced-motion handling.
- Added the `system`, `light`, and `dark` theme interface, persisted it at `flowboard:theme`, applied the resolved value through `data-theme`, and synchronized it with operating-system changes.
- Mapped the resolved theme into Clerk appearance variables and retained the existing sign-in, sign-up, and protected-route behavior.
- Added reusable brand, button, icon-button, field, panel, skeleton, empty-state, feedback, and theme-menu foundations.
- Added the geometric Flowboard mark, matching favicon, and Geist wordmark.
- Replaced the authenticated top bar with a 232px/72px desktop sidebar, a 60px mobile header, and safe-area-aware mobile bottom navigation. My tasks, Projects, notifications, theme selection, and account controls remain available at the appropriate viewport sizes.
- Added route-level lazy loading for every route group that currently exists. Landing, case-study, and demo modules will become independently lazy-loaded when their routes are introduced in Phases 3 and 4.
- Added automated coverage for theme initialization, persistence, operating-system changes, Clerk appearance mapping, shell navigation/collapse, and protected-route behavior.

Intentional boundaries and deviations:

- No new imagery was generated. Phase 1 did not require website imagery, and the six approved composition references remain unchanged.
- Motion is installed as approved but is not used decoratively in the shell. Current shell transitions use CSS and honor reduced motion; route and dialog motion belongs to later phases where it communicates hierarchy or state.
- The foundation components are available for progressive adoption, but existing task and project internals retain their current markup and styling until Phase 2. This avoids mixing a shell refactor with the larger product-surface redesign.
- At 1024px, the existing task board still uses its pre-redesign three-column behavior and becomes visually dense after accounting for the expanded sidebar. Phase 2 must recalibrate the board and card layout while preserving the documented status-selector breakpoint behavior.

Verification on 2026-09-24:

- `npm run lint`: passed.
- `npm run test`: passed, 12 files and 29 tests.
- `npm run build`: passed, with task, project, and authentication routes emitted as separate chunks.
- Live signed-in routing: My tasks and Projects passed.
- Responsive visual review: passed for shell behavior at 375px, 768px, 1024px, and 1440px in light and dark themes. Theme selection, mobile controls, safe-area bottom navigation, desktop expansion/collapse, and content offsets were verified.
- Production dependency audit: five advisories remain in pre-existing Clerk and React Router dependency lines (one critical and four high). Fixes are available, but upgrading those existing packages was not included in Phase 1 and should be handled as a focused dependency/security update with regression testing.

Boundary decision:

- Phase 1 is at a clean implementation boundary for a new chat. Required lint, tests, build, and shell verification pass. Phase 2 can begin without an unfinished foundation refactor.

### Phase 2 interim implementation record

Implemented and verified so far:

- Redesigned My tasks with a clearer header and live task count, date-focused views, search, sorting, collapsible filters, a focused creation disclosure, a three-column desktop board, and the existing single-status selector below 960px.
- Recalibrated the board and task-card density so the required three-column layout remains usable beside the expanded sidebar at 1024px. Card actions now stay in stable locations, metadata has semantic grouping, and drag handles and discussion indicators use individually imported Phosphor icons. This implementation is functionally sound but is not yet visually faithful enough to the approved comps.
- Redesigned task creation, detail editing, checklist creation and reordering, comments, activity, assignments, member selection, personal tag management, and confirmation surfaces. Modal and tag-editor dialogs trap focus, Escape closes them, and focus returns to the originating control.
- Redesigned the project overview as a structured product workspace rather than a repeated marketing-card grid.
- Redesigned project Board, Activity, Members, and Settings tabs, including shared tags, project filters, invitations, role controls, collaboration policies, archive controls, and destructive confirmations.
- Preserved owner, editor, and viewer policy behavior, existing API signatures and route URLs, keyboard drag handling, optimistic rollback, inline mutation errors, and recoverable confirmation flows.
- Restyled collaboration invitations, notifications, loading, empty, success, warning, and error states for both semantic themes.
- Replaced the remaining Unicode interface arrows, carets, close and overflow marks, and hand-authored interface SVGs with Phosphor icons. The approved coded Flowboard brand mark remains the sole intentional inline SVG.
- Added regression coverage for task action-menu keyboard navigation and focus restoration, owner-only member administration, read-only editor/viewer settings, and tag-editor focus trapping and restoration.

User review and required remaining work:

- Phase 2 is not complete. The user reviewed the implemented product and rejected the current degree of visual separation from the approved comps.
- The six approved comps are the primary visual specification, not a loose moodboard. The implementation should copy their composition, proportions, spacing, surface treatment, typography, control placement, and component character as closely as production constraints allow.
- References 1-4 are the strongest source of truth for authenticated product UI. The task board, task columns, task cards, card hierarchy, metadata, controls, and adjacent product components must be revised through direct side-by-side comparison with those references.
- The current board and card styling is the main known gap. Do not preserve it merely because it is functional or responsive. Recompose it to look substantially closer to the approved references while retaining real data, interactions, accessibility, and documented breakpoints.
- Apply the same stricter comparison to the personal-task header and controls, task creation, task details, checklists, comments, activity, assignments, member selection, tags, project overview, project tabs, invitations, notifications, dialogs, and feedback states.
- Treat a visible mismatch as implementation work, even when the underlying behavior already passes tests. Phase 2 can be accepted only after the user agrees that the authenticated product closely resembles the comps.

Constraints that still apply:

- No new imagery was generated, and none of the six approved composition references were changed. Phase 2 product surfaces do not require decorative website imagery.
- No backend, Prisma, API-contract, or route changes were required.
- The 1024px layout intentionally retains the documented three-column board rather than changing product behavior; reduced gaps, card density, and stable controls resolve the Phase 1 crowding issue.
- Motion remains restrained to short CSS state transitions and loading feedback, with a global reduced-motion override. No decorative route motion was added.
- The five known production dependency advisories in the existing Clerk and React Router lines were not addressed because that upgrade is outside the redesign scope and needs focused regression testing.

Verification on 2026-09-24:

- `npm run lint`: passed.
- `npm run test`: passed, 12 files and 33 tests.
- `npm run build`: passed with Vite 8.0.3, 215 transformed modules, and separate task, project, and authentication route chunks.
- Live signed-in task workflows: passed for navigation, date/status views, search and empty-state recovery, creation disclosure focus, detail tabs, comments, activity, modal Escape dismissal and focus restoration, and keyboard drag lift/cancel announcements.
- Live signed-in project workflows: passed for overview navigation and the Board, Activity, Members, and Settings tabs. Owner invitations, member controls, collaboration policies, archive/delete controls, assignments, shared tags, comments, and activity were inspected without performing destructive mutations.
- Permissions: owner controls were verified in the signed-in workspace; editor and viewer restrictions are covered by passing component tests that assert owner-only member administration and read-only settings.
- Responsive visual review: passed at 375px, 768px, 1024px, and 1440px in both light and dark themes. The task board, project tabs, disclosures, controls, sidebar/mobile navigation, cards, and dialogs remain readable without document-level horizontal overflow.
- Accessibility and state review: passed for keyboard navigation, visible focus, dialog trapping and restoration, keyboard reordering, narrow-screen selectors, reduced-motion styles, and loading, empty, success, warning, and error treatments. The filtered empty state and creation focus were exercised live; async and error variants were also verified through component behavior and the passing test suite.
- Functional and accessibility pre-flight: passed for typography, semantic color, spacing consistency, radii, contrast, responsive behavior, restrained motion, icon sourcing, visible strings, and both themes. No remaining Unicode interface glyphs or hand-authored interface SVGs were found outside the approved brand mark.
- Visual-reference pre-flight: failed user acceptance. The board and card system, and potentially other product components, remain too different from approved references 1-4.
- Final repository review: `git diff --check` passed. The working tree contains the intentionally uncommitted Phase 1 and Phase 2 frontend and documentation changes; no backend files, migrations, approved reference images, or unrelated application areas were changed.
- Known relevant failure: visual fidelity to the approved comps is insufficient. A focus-restoration defect exposed by the new tag-editor regression test was corrected, and no known functional test failures remain.

Boundary decision:

- Phase 2 is not at a completion boundary and Phase 3 must not begin. It is safe to continue Phase 2 in a new chat because the functional work is stable and documented, but the next task must be a strict visual-fidelity revision followed by renewed user review.

### Phase 2 strict visual-fidelity revision record

Implemented on 2026-09-24:

- Rebuilt the personal and project board presentation against references 1-4. Columns now use shallow, low-contrast wells, compact headers and counts, lighter framing, 12px internal rhythm, and substantially less panel weight.
- Reconstructed task cards around the reference hierarchy: a leading completion control, title-first content, compact priority treatment, one quiet metadata line, restrained assignee stacking, and stable trailing drag and overflow actions. Long descriptions no longer compete with scan-critical information on the board and remain available in task details.
- Reduced the task-page header, date-view tabs, search, sort, filter, creation disclosure, status selector, and board gaps so the surrounding workspace matches the references' editorial density instead of conventional dashboard spacing.
- Reworked project filters and shared-tag management into compact disclosures, preserving the real controls without surrounding them with large nested panels.
- Replaced the repeated project-card grid and decorative progress tracks with a divided editorial project list that gives project identity, state, task/member counts, assignees, and navigation a clearer hierarchy.
- Flattened and widened task details, tightened its header and tabs, simplified tag presentation, and brought its editable field grid and checklist area closer to reference 4 while retaining real editing behavior.
- Tightened supporting activity, checklist, comment, assignment, member, invitation, confirmation, loading, empty, success, warning, and error treatments so they share the same quiet border, type, and spacing language.
- Added regression coverage confirming that board cards keep descriptions in task details while exposing completion, due-date, tag-overflow, project, and action controls. The existing project shared-tag test was updated to operate the new collapsed disclosure before exercising the unchanged destructive confirmation flow.
- No new imagery was needed. The six approved references were not regenerated, revised, embedded, or used as production assets.

Direct reference comparison:

- References 1 and 2 governed the three-column geometry, shallow column surfaces, compact card proportions, leading completion control, title-to-metadata hierarchy, and restrained use of color.
- Reference 3 governed the project-board density, compact toolbar/disclosure treatment, tag and assignment metadata, and the balance between useful information and whitespace.
- Reference 4 governed the broad, flat task-detail surface, compact field grid, checklist hierarchy, tab treatment, and secondary-action placement.
- At 1440px and 1024px, the resulting My tasks and project boards retain three readable columns beside the expanded sidebar. At 768px and 375px, the documented single-status selector preserves the same card language without shrinking text or controls below usable sizes.

Intentional and unavoidable deviations:

- Flowboard keeps explicit keyboard-operable drag handles, stable overflow actions, real completion checkboxes, and visible focus treatment because the production product must expose every existing action accessibly. The references show less interaction chrome in some states.
- The task-detail surface remains an immediately editable form with labeled controls rather than a static detail sheet plus a separate edit mode. This preserves existing task-editing behavior and API contracts while adopting the reference composition.
- Project filters, tag management, participation, permissions, and owner controls are retained as compact disclosures or stable actions because they are real Flowboard capabilities absent from some comps.
- Real task titles, tag counts, checklists, assignments, and due dates vary from the curated sample content in the references, so individual card heights and line wrapping cannot be identical.
- The sidebar remains visible at 768px and the board changes from three columns to a single selected status below 960px, as required by `DESIGN.md` and the approved responsive behavior.
- Light and dark themes share the approved composition and component structure; dark-theme values are semantic adaptations rather than an attempt to recolor the light comps mechanically.

Remaining review items:

- User visual acceptance is still required. Phase 2 remains in progress regardless of the passing technical and pre-flight checks.
- The editable task-detail controls necessarily carry more persistent labeling than the static closest reference, and real checklist-heavy cards remain taller than the short sample cards.
- Any additional mismatch identified during user review should be corrected within Phase 2. Phase 3 must not begin until the user explicitly accepts this result.

Verification on 2026-09-24:

- `npm run lint`: passed.
- `npm run test -- --run`: passed, 12 files and 34 tests.
- `npm run build`: passed with Vite 8.0.3, 217 transformed modules, and separate task, project, and authentication route chunks.
- Live signed-in My tasks review: passed at 375px, 768px, 1024px, and 1440px. The three-column desktop board, single-status narrow layout, controls, columns, card variants, metadata, and checklist-heavy cards were compared directly with references 1-4.
- Live signed-in project review: passed for the editorial project overview and project Board in both semantic themes; Board, Activity, Members, and Settings functionality remains covered by the earlier signed-in pass and current passing tests.
- Task-detail review: passed at 375px and 1440px, including the editable field grid, tags, tabs, checklists, full-screen narrow layout, Escape dismissal, focus trap, and restoration to the originating card action.
- Keyboard task reordering: live lift/cancel passed, including the cancellation announcement and unchanged starting position. Checklist keyboard reordering remains covered by the passing behavior suite and the earlier live signed-in verification.
- Permissions: owner controls were inspected live; editor and viewer restrictions remain covered by passing regression tests for owner-only administration and read-only settings.
- Optimistic rollback and inline error recovery remain covered by the existing passing task/project behavior tests and earlier live verification; no destructive or synthetic production-data failure was introduced solely for the visual pass.
- Responsive and theme review: My tasks was reviewed in light and dark at all four required widths; the project board, project overview, and task details were reviewed in both themes at their most constrained and representative widths. No document-level horizontal overflow was observed.
- Reduced-motion review: the global reduced-motion override and component transitions were inspected; no new decorative motion or animation was introduced.
- `design-taste-frontend` pre-flight: passed for type hierarchy, surface restraint, spacing, radii, icon sourcing, responsive behavior, visible focus, semantic themes, and absence of generic dashboard-card patterns. The comps, rather than an alternate design direction, remained the visual authority.
- Visible-string and icon audit: passed. Interface icons use individual Phosphor imports; no new Unicode arrow, caret, close, check, or overflow glyphs were introduced, and the coded Flowboard brand mark remains the only intentional inline interface SVG.
- `git diff --check`: passed. Final scope review found no backend, Prisma migration, API-contract, approved-reference, or Phase 3 changes.
- During verification, the shared-tag deletion test initially failed because the redesigned tag tool now defaults collapsed. The test was corrected to open the disclosure before asserting the existing confirmation flow. No failures remain.

Boundary decision:

- This revision is presented for user review, not marked complete. Phase 2 stays in progress and no Phase 3 work or continuation prompt has been started.

### Phase 2 focused board, checklist, and task-editor revision

Implemented on 2026-09-24 following user review:

- Removed expandable checklist editing from task cards. Cards with checklist data now show one compact `completed/total subtasks` line with a Phosphor checklist icon; full checklist editing remains available in task details.
- Rebuilt the full checklist presentation against reference 2. The large filled progress track was removed, completed counts moved into the compact header, item rows became thin checkbox-and-label lines, and reorder/delete controls now appear on hover or keyboard focus while remaining visible on touch devices.
- Preserved checklist CRUD, optimistic rollback, inline errors, drag reordering, keyboard move buttons, read-only behavior, AI generation, and the 100-item limit.
- Reorganized project tasks in My tasks so the project name and member stack share one context row, due dates and tags share one compact metadata line, and the discussion icon and real comment count sit at the lower left. Project-board cards omit the redundant project name while retaining members, discussions, tags, checklist progress, and participation controls.
- Made all three desktop columns stretch to the same bottom edge in both My tasks and project Board. At 1440px, the measured My tasks column heights were all 576px with identical 877px bottoms; project Board columns were all 420px with identical 787px bottoms. At 1024px, all three My tasks columns shared a 928px bottom.
- Reconstructed the task editor against reference 4: compact context header, stable top-right save and close actions, quieter tabs, large borderless title and description fields, a three-column status/priority/due-date row, comp-like tag pills, and an expanded editorial checklist area.
- Rebuilt the personal create-task form as one coherent detail surface with a prominent title, full-width description, always-visible priority and due-date fields, tag controls, expanded compact checklist editor, and a separated submit footer. The project task form received the same hierarchy, title treatment, and checklist presentation.
- Added checklist regression tests for the expanded reference-style presentation, removal of the large progress track, and keyboard-operable reordering. Updated task-card regression coverage to assert that checklist editing is no longer embedded in cards and that project, member, discussion, tag, and compact subtask metadata remain exposed.

Intentional deviations and remaining review items:

- The reference 2 task card shows its checklist expanded in place, but production Flowboard now deliberately keeps cards compact and moves editing into the task editor. This follows the user's preference to remove the space-heavy dropdown while retaining checklist presence and progress on the board.
- Reorder and delete controls are still present in checklist rows because Flowboard supports checklist management and keyboard reordering. They are visually suppressed until hover or focus so the resting state follows the comp.
- The task editor remains directly editable rather than adding a separate read-only and Edit mode. Its composition now follows reference 4 closely while preserving current save, permission, and focus behavior.
- Phase 2 remains in progress. This focused pass is ready for another user visual review and is not an acceptance boundary.

Verification on 2026-09-24:

- `npm run lint`: passed.
- `npm run test -- --run`: passed, 13 files and 36 tests.
- `npm run build`: passed with Vite 8.0.3 and 217 transformed modules.
- My tasks visual review: passed at 375px, 768px, 1024px, and 1440px. The 1024px and 1440px three-column layouts have equal measured bottoms; the 375px and 768px layouts expose one selected status without horizontal document overflow.
- Project Board visual review: passed at 1440px with equal-height columns, including the empty-column state.
- Task cards were compared directly with references 1-3 in light and dark themes, including personal cards, project cards, due dates, tags, discussions, members, completion states, and checklist-summary states.
- Task details and checklist rows were compared directly with references 2 and 4 at 375px and 1440px in light and dark themes.
- Create-task presentation was reviewed live at 1440px; its fields, checklist, AI controls, and submit action remained accessible and functional.
- Responsive geometry checks reported no document-level horizontal overflow at 768px or 1024px.
- No backend, Prisma migration, API-contract, route, approved-reference, dependency, or generated-image changes were made. No commit was created.

Follow-up refinement on 2026-09-24 after the next user review:

- Consolidated personal task cards to one utility row beneath the title. Due date, tags, compact checklist progress, drag, and the stable edit menu all share that row instead of producing separate vertical bands.
- Limited project task cards to at most two supporting rows: an optional project/member context row plus one utility row containing discussion count, due date, tags, checklist progress, participation, drag, and edit actions. Project-board cards omit the redundant project name and use only the rows their real data requires.
- Right-aligned project assignee stacks within the context row so project identity remains the left anchor and people remain a stable, quickly scannable right-edge cue.
- Replaced the remaining native-checkbox tag fields in personal creation, project creation, and task details with one reference-4-style tag picker: soft rounded labels, selected-state emphasis, and a circular plus action that reveals the personal-tag creator only when needed.
- Moved tags into the same primary metadata grid as status, priority, and due date in task details. Personal creation uses priority, due date, and tags in one desktop row; project creation places tags beside priority, due date, and members. These grids collapse to two and then one column without shrinking controls.
- Reworked the checklist add control against reference 3 into a quiet inline `Add subtask…` row with a compact plus tile and trailing Add action. Enter-to-add, focus behavior, draft creation, saved-item creation, permissions, and errors are unchanged.
- Kept the board checklist summary explicit as `completed/total subtasks` while its accessible name states `completed of total subtasks complete`; this preserves scan clarity without creating a second card row.
- Added focused regression coverage for the compact subtask row and the reusable tag picker, including selection plus create-and-auto-select behavior.

Follow-up verification:

- `npm run lint`: passed.
- `npm run test -- --run`: passed, 14 files and 39 tests.
- `npm run build`: passed with Vite 8.0.3 and 221 transformed modules.
- Live signed-in narrow review passed for the My tasks creation surface, personal task details, checklist add row, tag controls, and the single-status board. The revised controls preserved usable target sizes and produced no horizontal document overflow.
- Live signed-in project Board review passed in light and dark themes. Discussion counts now anchor the lower-left card edge and the three equal-height project columns remain intact.
- The earlier 375px, 768px, 1024px, and 1440px light/dark geometry review remains applicable; this follow-up did not change board or column sizing. The new paired tool grid explicitly collapses below 760px.
- Intentional deviation: board cards continue to summarize checklist progress rather than expanding checklist items in place. This remains the user-approved space-saving direction; the full comp-like checklist is available in create and edit surfaces.
- Remaining review item: user visual acceptance is still required for the exact desktop balance of the primary metadata grids and the stricter one-row/two-row card budgets. Phase 2 remains in progress and Phase 3 has not started.
- No backend, Prisma migration, route, API-contract, approved-reference, or dependency changes were made. No imagery was generated, no commit was created, and all prior unrelated working-tree changes were preserved.

### Phase 2 context-specific task-card and resize revision

Implemented on 2026-09-25 after the next user review:

- Split the board-card presentation into three explicit view components backed by the existing shared mutation controller: personal tasks in My tasks, project tasks in My tasks, and tasks on a Project Board. This allows each context to follow its own approved information hierarchy without duplicating completion, participation, permission, optimistic-update, or due-date behavior.
- Personal cards now reserve at most two compact metadata lines for due date, checklist progress, and tags. The stable Edit/View action remains anchored at the lower right, and metadata can use the full card width below the completion control.
- Project tasks in My tasks now use the requested four-row hierarchy: project name; members; due date/checklist/tags; then discussion and participation controls. Member entries render as full name followed by avatar, use commas between people, and collapse to a name/avatar plus `+N` at constrained card widths.
- Project Board cards now use the requested context-specific hierarchy: members or an explicit `No assignees` state; an optional tag-only row; then discussion, due date, checklist progress, participation, and Edit/View. The tag row is not rendered when the task has no tags.
- Replaced the visible drag-grip control with the non-interactive body of a draggable card. Keyboard drag props, focus visibility, accessible drag labels, reorder restrictions, and stable action placement remain intact; checkboxes and card actions remain separate interactive targets.
- Replaced the card overflow menu with a stable direct Pencil edit action (or Eye view action for read-only users). This keeps the small set of card actions visible and matches the references' quieter control language.
- Preserved the explicit `completed/total subtasks` summary and accessible `completed of total subtasks complete` label. Checklist items remain edited in the task detail surface instead of expanding inside a board card.
- Tightened the task-detail title and description inputs toward reference 4. The title is a large, borderless editorial field with a quiet hover underline and accent focus state; the description is a restrained inset writing surface with matching hover/focus feedback.
- Corrected width minimization at the shell, page, board, column, list, and card layers with explicit `min-width: 0` containment. At 768px the previous date-tab strip extended beyond the available content area beside the expanded sidebar, so date views now use the compact select through 1100px and return to the full tab row on wide desktop.
- Preserved the documented responsive board contract: three equal-height columns above 960px and one selected status at 960px and below. Metadata beneath the title may span the completion-control indentation, keeping utility labels clear of Join/Leave and Edit at 1024px without reducing text or target sizes.

Intentional deviations and remaining Phase 2 work:

- At card widths of 280px or less, only one full member entry is shown before `+N`; wider cards show two entries before overflow. This responsive disclosure is necessary to keep full names legible in the required 1024px three-column layout.
- Date-view tabs become a compact dropdown through 1100px. This differs from the wide comp composition but avoids clipped controls when the expanded desktop sidebar and three-column board share a 1024px viewport. The dropdown was upgraded to the shared Phase 2 menu in the subsequent form/input revision.
- Card checklist content remains summarized rather than expanded. This is the user-approved compact-board direction; full comp-like checklist editing remains in create and edit surfaces.
- Phase 2 remains in progress. The next focused visual pass should continue on the Create task form, Edit task modal, and their internal grouping—especially the tag area and checklist/add-subtask composition against references 3 and 4.
- That pass must also systematize all textfield/input resting, hover, focus, disabled, error, and dark-theme states. The title and description fields received a first targeted correction here, but the broader authenticated input system still requires direct visual comparison and user review.
- User visual acceptance is still required. Phase 3 must not begin and this section must not be treated as a Phase 2 completion record.

Verification on 2026-09-25:

- `npm run lint`: passed.
- `npm run test -- --run`: passed, 14 files and 41 tests. Task-card regression coverage now asserts the three card contexts, four-row My tasks project hierarchy, name-before-avatar order, comma separation, `+N` overflow, explicit unassigned state, optional tag row, direct Edit action, and keyboard drag surface.
- `npm run build`: passed with Vite 8.0.3 and 229 transformed modules.
- My tasks was reviewed live at 375px, 768px, 1024px, and 1440px in light and dark themes. All widths reported zero document-level overflow; 375px and 768px exposed one status column, and the 1024px and 1440px three-column boards had equal measured bottoms.
- The Project Board was re-reviewed at the constrained 1024px desktop width. Its three 248px columns shared the same bottom edge, compact member overflow rendered correctly, the no-assignee and optional-tag states remained intact, and the utility row no longer collided with participation or edit actions.
- Task details were opened from a real signed-in project card at 1024px. Title, description, tags, assignees, checklist, save/close controls, and dialog focus behavior remained available after the visual changes.
- The browser was restored to `/tasks`, System theme, and its default viewport after verification. No backend, Prisma migration, API-contract, route, approved-reference, dependency, or imagery changes were made, and no commit was created.

### Phase 2 create/edit form, input, and dropdown revision

Implemented on 2026-09-25 after reviewing all six approved PNGs at original resolution, with references 3 and 4 used for the form composition:

- Rebuilt the personal and project Create task forms as bounded, reference-aligned editing surfaces. Title and description now use the same scale and hierarchy as the Edit task modal; status, priority, and due date form one row on desktop and stack at narrow widths. Assignment and tags have their own grouping, followed by the checklist and a clear footer action.
- Refined the Edit task modal composition to use the task title as the primary heading, a quieter header, grouped metadata and assignment/tag sections, consistent dividers, and restrained Save/Delete actions. Preserved all task save/delete API arguments, optimistic task updates, capability checks, and discard confirmation.
- Reworked the Add subtask row into a quiet inline control with an outlined plus, an Add action when text is present, and Enter-to-add. Preserved checklist create, complete, rename, delete, and keyboard reorder behavior; corrected mobile row containment.
- Applied a shared input treatment across authenticated text, search, description, date-related, and similar fields: a subtle surface tint where useful, softer focus border/ring, readable placeholders, hover and disabled states, invalid/error colors, and dark-theme equivalents. Kept the title field visually open and reserved the tinted fill for writing and metadata surfaces.
- Added shared custom priority/status/filter/role/color dropdowns based on the compact elevated menu language the user linked. Replaced all native `<select>` elements in authenticated React screens: Create/Edit task, My tasks Sort by/Project/Date view, Projects Relationship/Sort by, Project Board Assignee/Priority/Due filters, invitation and member roles, and personal/shared tag color controls. The menus retain their existing option values and callbacks, support Arrow/Home/End/Escape and pointer selection, and return focus to the trigger after selection.
- Added a custom calendar with month navigation, disabled past dates for personal task creation, exact-minute time selection, AM/PM controls, Clear/Done actions, and the same elevated dropdown styling. Calendar and time menu placement were checked on mobile and inside the Edit dialog. Reduced-motion rules disable the short menu entrance animation.
- Brought the existing assignee and theme popovers closer to the shared trigger, selected-state, and menu-shadow language. No new dependency or generated image was needed.

Verification:

- Frontend `npm run lint`, all `npm run test -- --run` tests (15 files, 45 tests), and `npm run build` passed after this revision. The new tests cover dropdown keyboard selection/focus, date minimum and clear behavior, and exact saved-time editing; an existing tag test was updated to use the new menu.
- Signed-in owner workflow passed in the temporary E2E Collaboration project: created “Phase 2 picker verification” with title, description, High priority, Sep 26 at 21:35, tag, and checklist item; reopened it, changed Status to In progress, Priority to Medium, and time to 21:42, saved, and verified the board and modal values. This test task remains in the temporary project for visual review.
- Signed-in Project Board filters, Projects Relationship filter, and My tasks Sort by/Date view/Project filter changed and reset correctly. Project invitation role options were inspected without sending an invitation or changing a member's permissions.
- Owner controls were exercised live. Editor/viewer restrictions and assignment policy passed their existing automated tests; separate editor and viewer accounts were not used live in this pass.
- Checklist add and draft delete passed component tests; real checklist create, completion, rename, and keyboard reorder were exercised in the earlier Phase 2 signed-in pass. Dialog Escape, focus wrap, and focus restoration to the triggering Edit action passed live after the custom menus were installed.
- Create form layout was checked at 375px, 768px, 1024px, and 1440px in light and dark themes, with zero document-level horizontal overflow. The new filters and menus were reviewed at mobile and desktop widths in both themes. The mobile calendar and time menu were checked for visible actions above the fixed navigation; the Edit dialog gained scroll room while its calendar is open.
- Reduced-motion CSS covers the new menu animations and the existing global motion override. Disabled and invalid/error CSS states and the existing retryable task-detail error state were reviewed; a forced backend error was not produced in the signed-in account during this pass.
- `design-taste-frontend` pre-flight was applied to the relevant product surfaces: approved-composition fidelity, semantic light/dark palette, one radius family, readable control/button contrast, compact single-line actions, restraint in animation, keyboard-visible focus, mobile containment, and Phosphor icon consistency. Landing-page-only checks do not apply to these authenticated forms. The user has not yet accepted the visual result.
- Final `git diff --check` passed. The status/diff audit showed only the existing uncommitted Phase 1/2 frontend and documentation work plus this focused revision; no backend file appeared in the diff. The signed-in browser was returned to `/tasks`, System theme, and its default viewport.

Intentional deviations and remaining work:

- The shared dropdown uses Flowboard's existing tokens and native React/CSS rather than copying the linked third-party code or introducing Tailwind/Framer Motion. This keeps it consistent with `DESIGN.md` and the approved comps.
- Calendar time editing uses an exact-minute list and AM/PM menu so arbitrary saved times remain editable. It is more explicit than the native browser time popover while matching the new dropdown language.
- Some approved reference details remain subject to the user's visual review, especially the final balance of form fields, tag/checklist density, and footer actions. Phase 2 remains **in progress**. Do not begin Phase 3 or mark Phase 2 complete without explicit user visual acceptance.
- Existing Phase 1/2 and unrelated working-tree changes were preserved. No backend, Prisma migration, API contract, route, approved reference image, or dependency was changed for this pass. No commit was created.

### Next Phase 2 visual refinement pass — requested 2026-09-25

The user has identified the following remaining visual work. These are implementation tasks for the next chat, not accepted outcomes. Inspect the live signed-in application and compare with the six approved PNGs at full resolution before changing these surfaces. Use `design-taste-frontend` as the sole design authority, with `DESIGN.md` and the approved references as the product specification. Preserve the three context-specific task-card variants and all verified behavior unless a specific visual issue warrants a focused change.

1. **My tasks project-card metadata:** Rework the alignment of the primary metadata within the “My Tasks (Project)” card; centered presentation is the proposed direction. Keep the bottom discussion/participation/action row in its existing alignment and preserve the established hierarchy, name-before-avatar order, comma separation, `+N` overflow, direct action, drag surface, and responsive containment.
2. **Project Board card tags:** Reconsider the left-aligned tag metadata; right alignment is the proposed direction. Preserve the optional tag-only row, card action and discussion placement, and equal-height board columns.
3. **Project shared tags:** Redesign the shared-tags section on `/projects/:projectId` so its layout, tag presentation, editing controls, and empty/error states belong to the approved product language. Retain tag CRUD, permissions, and keyboard/focus behavior.
4. **Confirmation dialogs:** Rework “Discard unsaved changes?” and Delete task into quieter, more modern confirmation surfaces. Clarify consequences and action hierarchy without weakening destructive-action safeguards, focus trapping/restoration, Escape behavior, or recovery from failed mutations.
5. **Create-task presentation and primary buttons:** Evaluate moving Create task from its current disclosure/form into a modal, using the better-liked Edit task modal as the immediate visual baseline and references 3–4 for component language. Implement the modal if it improves the authenticated workflow; retain both personal and project creation paths, form values, tags, checklist, assignment rules, keyboard operation, validation, and responsive behavior. Rework prominent Create task/Delete task buttons and their resting, hover, focus, disabled, pending, and error states consistently across the relevant pages and dialogs.
6. **Last change in this Phase 2 pass — board-targeted creation and status:** Add a `+` action to each task-board status column that opens task creation with that column's status preselected. Add an explicit status picker to the general Create task form/modal. Personal and project creation controllers currently hard-code `status: 'todo'` (`backend/src/controllers/createTask.ts` and `backend/src/controllers/projectTasks.ts`), so inspect and update request validation, controllers, frontend API calls, and tests together. Preserve permission checks and default To do behavior for callers that omit status. No Prisma schema migration is expected; verify this before implementation. Keep this item last, as requested.

For this pass, inspect existing repository changes before editing and preserve all Phase 1/2 work and unrelated user changes. Verify frontend lint, every frontend test, production build, relevant signed-in create/edit/delete flows, owner/editor/viewer behavior, checklist CRUD and keyboard reordering, dialog focus trapping/restoration, responsive layouts at 375px/768px/1024px/1440px, light/dark themes, reduced motion, error states, and the `design-taste-frontend` pre-flight. Run applicable backend tests when creation endpoints change. Record exact changes, verification, remaining mismatches, and intentional deviations here. Do not begin Phase 3 or mark Phase 2 complete until the user explicitly accepts the visual result.

The approved visual references live in `docs/design-references/`. They are the primary visual target for hierarchy, composition, proportions, spacing, palette, material direction, and component character. References 1-4 should be followed especially closely for boards, columns, cards, controls, and product-detail surfaces. Reproduce them as closely as practical, then adapt only where real Flowboard functionality, responsive behavior, permissions, accessibility, or `DESIGN.md` requires a difference. They are not production assets and must not be embedded in the shipped site as substitutes for real Flowboard UI.

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

### Phase 1: Foundation and product shell - Complete

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

### Phase 2: Authenticated product redesign - In progress

Apply the approved product-density rules across all existing screens and states. Preserve API contracts except for the coordinated creation-status extension needed by the final board `+` task. Use the six approved comps as a near-direct visual specification rather than broad inspiration. For every major authenticated component, compare the implementation beside the relevant comp and copy its layout, proportions, spacing, hierarchy, surfaces, borders, radii, typography, and control placement closely. References 1-4 govern the task board and primary component language. Deviate only for documented functionality, accessibility, responsive behavior, permissions, or a conflicting rule in `DESIGN.md`.

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
- Side-by-side comparison confirms that boards, columns, task cards, and supporting product components closely match approved references 1-4.
- The user explicitly accepts the Phase 2 visual result before Phase 2 is marked complete or Phase 3 begins.

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
