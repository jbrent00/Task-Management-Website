# Flowboard Portfolio Redesign Implementation Plan

## Status

- Design direction: approved
- `DESIGN.md`: approved
- Six landing-page composition references: approved
- Phase 1, Foundation and product shell: complete and verified on 2026-09-24
- Phase 2, Authenticated product redesign: visually accepted and complete on 2026-09-25
- Application implementation: in progress
- Current phase: Phase 4 guest demo implemented; browser network inspection remains before formal completion. Phase 3 capture clarity and visual acceptance remain open.
- Backend schema changes: none needed for Phase 2; board-targeted creation status support is implemented

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

### Phase 2 refinement implementation and review — 2026-09-25

**Design decisions and exact changes.** Applied `design-taste-frontend` to the existing authenticated Flowboard system (brief: calm, compact personal and team task management; density/personality/motion dials 6/5/5). Read the repository and frontend instructions, `DESIGN.md`, this plan, and the reference README before editing; inspected all six approved PNGs at original resolution, the live signed-in app, and a clean `eb8a201` working tree. References 3 and 4 guided the create/edit surface hierarchy. No imagery was needed or generated. The My Tasks project variant now centers a project-name pill and compact task metadata, omits the visually redundant assignee row, and leaves discussion and participation aligned at the bottom. This is the user's subsequent explicit refinement to the earlier four-row baseline. Project Board cards now show right-aligned tags immediately under the title and right-aligned members below them; cards without tags move members into the first available metadata row. Discussion, due date, and checklist progress remain left aligned at the bottom, with wrapping at narrow column widths so values remain visible. The three card variants, drag surface, actions, tag overflow, and equal-height columns remain distinct.

Redesigned the project shared-tags disclosure with a concise introduction, consistent tag rows, inline edit, add and delete controls, empty state, and restored focus after editing. Made discard and task-delete confirmations quieter and more explicit; nested confirmation dialogs now contain Escape/Tab events so the underlying Create task dialog remains open. Both personal and project Create task forms now live in a bounded portal modal aligned to Edit task, trap/restore focus, preserve drafts on failures, and show a clear status picker and inline creation error. Create/Delete button treatments are more restrained and consistent. A 40px `+` action on each available status column opens creation with that status preselected; reopening the general Create action resets status to To do. Both creation controllers validate optional status, default omitted status to `todo`, and set `completedAt` when a task is created as completed. No schema or migration change was needed.

**Verification.** Frontend lint passed; all 48 tests in 16 files passed; production build passed. Backend typecheck and all 39 tests passed, including creation-status defaults/validation and owner/editor/viewer permission coverage. Signed-in owner testing on the temporary E2E Collaboration project passed personal and project status-targeted creation, editing, checklist add/rename/complete/reorder by keyboard, delete confirmation, focus trapping/restoration, and cleanup of the disposable tasks. Shared-tag inline editing and failed project creation with preserved draft are covered by focused frontend tests; nested dialog Escape/focus restoration has a dedicated test. Signed-in Project Board and My Tasks were reviewed at 375px, 768px, 1024px, and 1440px with no document overflow; the 1024px card utility row was adjusted after a visible clip. Light and dark card, board, tag, and creation surfaces were inspected. Reduced-motion behavior was reviewed against the global transition/animation override and component-specific rules. Error states were checked through the failed-create test and visible inline error styling. The `design-taste-frontend` pre-flight was applied to the authenticated surfaces: consistent semantic accent/radii, readable button and form contrast, focus indicators, responsive collapse, no new em-dash copy or decorative motion, loading/empty/error states, and existing Phosphor icons. Marketing-specific hero, photography, bento, and section-pattern checks do not apply to this authenticated workflow.

**Remaining review and intentional deviations.** References 3 and 4 show curated content and omit some real collaboration controls; the signed-in app retains permissions, role actions, shared tags, checklist editing, and status-targeted creation. Current real card density varies with task data. Direct signed-in editor and viewer sessions were unavailable in the browser; their create/edit/view restrictions were checked by integration and frontend tests rather than claimed as live manual verification. No unrelated files, reference PNGs, or credentials were changed. No commit was made. Phase 2 is **in progress** and awaits explicit user visual acceptance; Phase 3 has not started.

### Phase 2 follow-up: creation, deletion, and card density — 2026-09-25

At the user's direction, softened the header Create task action on My Tasks and Project Board into an accent-tinted, sentence-case button with a leading plus icon; the per-column plus actions remain quiet. Its text/background contrast is approximately 5.48:1 in light theme and 6.01:1 in dark theme. Moved Delete task from the isolated bottom of the editor into a keyboard-operable More task actions menu beside Close in the sticky header. Delete remains permission-gated and requires the same explicit confirmation. Escape closes only the menu, Cancel restores focus to its trigger, and failed deletion still reports the error without dismissing the editor. At 375px, the editor context line now truncates to prevent the extra header control from causing multi-line crowding.

My Tasks project cards now combine due date, checklist progress, tags, and discussion into one utility area beneath the centered project-name pill. Discussion stays anchored at the lower left even when the other details wrap on narrow cards; Join/Leave and Edit remain at the lower right. Project Board cards use shorter tag/member rows and a smaller, quiet `No assignees` label while retaining tag-first/member-second order, left-aligned bottom details, and equal-height columns.

After live review showed the first Project Board tightening was too subtle, reduced its tag row to the content height, kept avatar rows at 24px, and gave unassigned cards a dedicated 18px row. The real 1024px card now measures about 121px high for a tagged, unassigned task; metadata and participation remain visible at 375px, 768px, 1024px, and 1440px without document overflow.

**Follow-up verification.** Frontend lint passed; all 49 tests in 16 files passed, including new coverage for the editor action menu's Escape/focus behavior and the My Tasks discussion anchor; production build passed. Signed-in light/dark and 375px/768px/1024px/1440px review showed no document overflow. At 1024px, secondary My Tasks metadata wraps above the fixed lower-left discussion count. The mobile Delete menu, confirmation, Cancel focus restoration, and editor header were exercised live. Existing backend creation/permission tests from the preceding pass remain applicable; backend code was unchanged in this follow-up. Phase 2 remains **in progress** pending explicit visual acceptance. No commit was made.

### Phase 2 follow-up: shared tags and project task fields — 2026-09-25

- Replaced the Project Board Shared tags grid of boxed management rows with a wrapping pill field and a `+` action. Its inline add form opens on demand, focuses the name input, and returns focus to the trigger on Escape. Edit and confirmed Delete remain available for each tag.
- Added the same `+` tag creation affordance to project task creation and editing. A new tag is added through the existing project tag API, refreshes project tag choices, and is selected in the current task draft. The API and permission rules are unchanged.
- Aligned the Tags and Assignees headings at the top of the same row and gave both the strong text color used by the other task field headings. Escape from inline tag creation now closes that editor and restores focus without closing task details.
- Intentional deviation: Shared tags keeps explicit Edit and Delete actions beside each pill, since project-wide tag management has actions that the task editor's selection pills do not need. No imagery was required.
- Frontend lint, all 52 tests in 16 files, and production build passed. Signed-in desktop review covered Shared tags and the project task editor, including Escape/focus handling for inline tag creation. Document width stayed within 375px, 768px, 1024px, and 1440px viewport overrides, which were reset after review. Final user visual acceptance is still required. Phase 2 remains **in progress**. No commit was made.

### Phase 2 follow-up: My Tasks personal tags — 2026-09-25

- Moved personal tag management out of the My Tasks filter panel into its own collapsible section above search and filters. The filter panel still contains tag selection for narrowing tasks.
- Matched the Project Board Shared tags layout: compact heading and count, wrapping tag pills, accessible icon actions for edit/delete, and a plus action that opens an inline create form. The title is **Personal tags** so these account-level tags are distinguishable from project shared tags.
- Preserved personal tag create, edit, and confirmed delete behavior. Inline editing and creation restore focus after Escape or completion. Deleting a tag also removes its now-invalid active tag filter.
- Frontend lint, all 54 tests in 16 files, and production build passed. Signed-in desktop and 375px review showed the separate section and inline form in light theme; the section was also reviewed in dark theme. Viewport widths of 375px, 768px, 1024px, and 1440px had no document overflow. The viewport override was reset and the light theme restored. This section intentionally uses the personal tag API rather than the project shared tag API. Phase 2 remains **in progress** pending explicit visual acceptance. No commit was made.

### Phase 2 follow-up: tag palette, filters, drag feedback, ordering, and tag form layout — 2026-09-25

- Replaced the eight plain-text tag color choices with one reusable radio-group picker used by personal, shared, and task-inline tag creation and editing. Each labeled choice has a color swatch and a live tag-name preview. Eight distinct light/dark palette pairs now match the rendered tag pills on cards and in tag managers; existing stored color values and API behavior are unchanged.
- My Tasks filters now put Project and Tags together above Priority, Due, and Status, in that order; the rows stack on narrow viewports. Project tasks appear before personal tasks in each My Tasks status column for manual and automatic sorts. Manual order groups project tasks by project and preserves their per-project positions, then preserves personal drag order. Project Board ordering is unchanged.
- The active dragged card gets a subtle lift, tilt, accent border, and shadow for pointer and keyboard dragging; the DnD wrapper remains untouched. Reduced motion removes the transform while retaining the border/shadow cue. Keyboard drag and Escape cancellation were exercised in the signed-in app.
- At the user's later direction, My Tasks project cards no longer display shared tag chips. The project-name pill, lower-left discussion, due date, checklist progress, and actions remain. Shared tags remain available in task details and on Project Board cards. This supersedes the earlier My Tasks card record that included tags in the utility row.
- Reworked all create-tag layouts to a clear sequence: full-width New tag input, Color picker, then Preview at the left with Add tag at the right. The same layout is used in personal/shared tag management and task-inline creation. Narrowed broad Project task form selectors that had stacked color swatches over their labels in the modal. Matched Project task's Generate with AI control to the Generate checklist button's dimensions, border, radius, surface, and typography.
- Verification: frontend lint passed, all 56 tests in 17 files passed, and production build passed. New tests cover My Tasks project-first ordering and the absence of shared tag chips on its project-card variant. Signed-in light and dark tag pickers, live preview, filter arrangement, My Tasks card density, Project Board tags, and the Project task modal were inspected. My Tasks and Project Board showed no document overflow at 375px, 768px, 1024px, and 1440px; viewport overrides were reset. The revised Project task modal was checked at the same widths. The new color and layout work is frontend-only, so the previously passing backend creation tests remain applicable. `git diff --check` passed; the final changed-file audit found only the intended Phase 1/2 baseline plus these related refinements.
- Intentional deviations and remaining review: the task modal's inline color picker uses the available Tags column width and may increase modal scroll height while open; this keeps the Assignees/Tags heading alignment and avoids changing the edit form's base layout. The approved references do not specify a color picker, so the palette follows the existing Flowboard tokens and contrast/focus conventions. Direct signed-in editor and viewer browser sessions were unavailable in Phase 2; prior integration tests cover their permissions, and the live role check is explicitly deferred to Phase 5. Phase 2 is **in progress** pending explicit user visual acceptance. Phase 3 has not started. No commit was made.

### Phase 2 visual acceptance — 2026-09-25

The user reviewed the final authenticated product and said the website looks good, then explicitly requested a commit and a prompt to begin Phase 3 in a new chat. This satisfies the Phase 2 visual acceptance gate. Phase 2 is complete; the deferred live editor/viewer role sessions remain a Phase 5 verification item. No Phase 3 implementation was started in this phase.

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

#### Representative product content and captures

Before building the landing-page visuals, prepare a coherent, realistic example workspace in a safe local or development account. Include several personal tasks and at least one shared project with tasks across statuses, meaningful titles and descriptions, due dates, priorities, tags, checklist progress, and appropriate assignees and discussion. Use the same example content across the task board, project board, task detail, and related captures so the story is consistent. Remove temporary E2E labels and avoid personal or sensitive data in public assets.

Capture the actual redesigned Flowboard UI using this content for the public pages. Curate the data and viewport for clarity, but do not draw or generate a fake interface. Phase 4 can reuse the content concepts for its guest-demo seed; the Phase 3 captures should not depend on the unfinished demo.

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
- Before Phase 3 is marked complete, start a completely fresh chat for an independent **visual critique of the entire website**, with particular attention to the landing page and every Phase 3 section, `/case-study`, `/sign-in`, `/sign-up`, and the signed-out/not-found experience. Review the live pages at 375px, 768px, 1024px, and 1440px in light and dark themes where applicable. Compare the six approved PNG compositions at full resolution. Ask for specific strengths, flaws, visual inconsistencies, and prioritized improvements to hierarchy, typography, spacing, color, imagery/capture clarity, section rhythm, responsiveness, and overall feel. This is a critique and recommendation pass, not an implementation or acceptance pass.
- Record the fresh-chat findings and any follow-up changes here, then obtain the user's explicit visual acceptance. Keep Phase 3 in progress and uncommitted until the user requests otherwise.

#### Phase 3 implementation and review record, 2026-09-25

Implementation is **ready for user visual review and remains in progress**. The user has not accepted Phase 3. No commit was made.

Changes:

- Replaced the root redirect with a six-section public landing page and retained route-level lazy loading. The sections are Hero, Personal planning, Shared projects, Product depth with exactly five cells, Built for real workflows, and Closing CTA with footer. Copy, hierarchy, and composition follow the approved references; Product, case-study, GitHub, auth, and app links have distinct destinations.
- Added `/case-study` with the product problem, intended audience, design decisions, React/Vite/Clerk/Express/Prisma/PostgreSQL data flow, verified features, testing and accessibility approach, lessons, and the existing repository link.
- Added a shared themed auth layout for `/sign-in` and `/sign-up`, including Clerk appearance values, desktop tactile crop, mobile image removal, and theme selection. Added a designed wildcard not-found page. Updated the favicon to adapt to the operating-system theme and added the page title, description, and social-preview metadata.
- Replaced the development account's old tasks, project, and tags with a coherent Northline site launch example and realistic personal work. The single shared project has three genuine development account members shown locally as Alex Rivera, Riley Morgan, and Maya Chen. Generated fictional portraits appear in real assignment and discussion surfaces. Project tasks cover three statuses, three priorities, dates, shared tags, checklist progress, assignments, comments from all three members, activity, and a notification. Public assets contain no account email addresses or temporary E2E labels.
- Captured the actual signed-in Flowboard UI for the project board, My tasks, personal and project task details, three-person discussion, and task creation with AI controls. The full source captures are unaltered browser captures; the close views added in the visual-feedback pass below are lossless pixel crops of those real captures. Generated imagery is limited to the text-free planning still life and fictional portraits. None of the six approved reference PNGs were embedded, replaced, or changed.
- Saved representative page review captures in `docs/phase3-review/`. The example database content and aliases are local development data, not a migration or source-controlled seed. The local member portrait URLs use the development server.

Verification:

- Frontend `npm run lint`, `npm run test` (18 files, 58 tests after the visual-feedback pass), and `npm run build` passed after the final layout changes.
- Manually inspected all six reference PNGs at full resolution and compared the landing sections against them. The hero, shared-project, and depth framing were adjusted after browser visual review. The source contains exactly six landing sections and five product-depth cells, with no document-level horizontal overflow at 375px, 768px, 1024px, or 1440px.
- Signed-out browser checks covered `/`, `/case-study`, `/sign-in`, `/sign-up`, `/demo`, wildcard not-found, and redirects from `/tasks`, `/projects`, and a project detail route. Signed-in checks covered the same public routes plus all protected route groups. Light and dark themes were checked in separate signed-in and signed-out sessions. The auth image hides at 375px and remains visible at desktop widths.
- Keyboard focus was checked on the auth route; the public and auth layouts expose skip links and visible focus. The shared product retains the existing reduced-motion override, keyboard reorder, modal focus management, and error recovery tests. The lazy route skeleton and designed missing-route state were observed. All public capture image requests resolved after loading.
- `git diff --check` passed. No backend code, schema, migration, approved reference, or Phase 4 demo implementation was changed.
- The `design-taste-frontend` pre-flight was applied to all six sections: two editorial eyebrows across six sections, a two-line desktop hero, consistent semantic theme and rust accent, one-line desktop navigation, readable CTAs, varied section layouts, exactly five depth cells, no decorative animation, no invented social proof, and no visible em dash or en dash. All Flowboard interface images are actual application captures.

Remaining mismatches and intentional deviations:

- The approved references depict conceptual interfaces and a specific physical arrangement; actual screenshots use the Phase 2 product, current example content, and responsive CSS framing. Their section geometry and product detail density therefore differ from the comps. The user must review this visual difference before Phase 3 can be accepted.
- The primary CTA keeps the plan's exact `Explore the demo` label and points to `/demo`, but Phase 4's interactive guest workspace does not exist yet. The wildcard page explicitly explains this and offers account creation. No `/demo` route or guest operations were built in Phase 3. This is a known conversion limitation until Phase 4.
- The three fictional display names and portraits are applied to local Flowboard user records and appear in project/task surfaces. Clerk's account menu still shows each account's underlying Clerk profile name and avatar. Public screenshots focus on fictional task and project identities; Clerk profiles were not changed.
- Reduced-motion behavior was checked against the existing global media-query override and source, but a live operating-system reduced-motion session was not available. A browser-emulated reduced-motion visual pass remains for Phase 5.
- The three-member project was rechecked through the third signed-in account's Members view on 2026-09-27. It shows Alex as owner and Riley and Maya as editors, with their fictional display identities. The working tree remains uncommitted and Phase 3 still awaits user visual acceptance.

#### Phase 3 visual-feedback pass, 2026-09-27

The user liked the landing page overall but identified soft screenshots in the personal, collaboration, and product-depth sections; an unclear case-study return CTA; and unreadable native theme options in dark mode. Phase 3 remains **in progress and uncommitted**, pending visual acceptance.

Changes and rationale:

- Kept the full 1440px project and personal board captures as overview images. Reframed the inset and product-depth images from actual 768px tablet and 375px mobile Flowboard captures so interface text occupies more of each card. Saved the unaltered tablet/mobile source captures in `docs/phase3-review/mobile-source-captures/` and lossless PNG crops in `frontend/public/captures/`. The mobile personal and shared-project captures now stack, and mobile product-depth cells select genuine mobile views. No interface was drawn, generated, or composited.
- Replaced the native `<select>` on public and auth headers with one themed menu. All three option labels remain visible in dark mode. The menu supports keyboard arrows, Home/End, Escape, outside click, checked state, and trigger focus restoration. Added two focused menu tests.
- The case-study CTA previously linked to `/` under the vague label “View the public experience.” It now labels that destination “Back to landing page.” “Create an account” is the primary working action. A direct `/demo` link is deferred until the Phase 4 guest workspace exists; it currently reaches the designed not-found page.
- Gave the landing page's secondary CTA an opaque semantic background so it remains legible where the planning photograph sits behind it at tablet and mobile widths.

Verification and visual review:

- Frontend lint, all 18 test files and 58 tests, and the production build pass. `git diff --check` passes. No backend code or database schema changed.
- Reviewed the revised landing at 375px, 768px, 1024px, and 1440px, including the personal, collaboration, and five-cell depth sections. Checked no document-level horizontal overflow at those widths. Viewed the case study, sign-in, and sign-up while signed out in dark mode, and inspected the shared theme menu in dark mode on both the case-study and auth layouts. Confirmed the case-study return link navigates to `/`.
- Refreshed full landing and case-study screenshots and saved representative personal, shared, depth, and dark-menu views in `docs/phase3-review/`. The live root route remains available for user review.

Remaining visual and product decisions:

- The overview board images intentionally show the whole workspace, so individual task labels are smaller than in the new close views. The close views are now legible at their intended sizes; the user must judge the overall result against the approved compositions.
- The global `Explore the demo` CTAs still point to the Phase 4 placeholder. When the guest demo exists, the case-study closing primary action should be reconsidered as a direct demo link, as the user suggested. No Phase 4 code was added here.
- Clerk's own account menu still reflects the underlying sign-in profiles rather than the fictional local Flowboard names and portraits. Recommended follow-up: add an explicit workspace display identity in Flowboard while retaining Clerk's actual account identity for sign-in and account security, or update the development Clerk profiles themselves if these three accounts are exclusively disposable presentation accounts. No Clerk profile was changed in this pass.
- A live reduced-motion emulation pass remains outstanding; existing reduced-motion styles and earlier keyboard/focus checks were retained.
- The user requested a separate fresh-chat visual critique before deciding whether to accept Phase 3. That review should cover the whole site, especially all new Phase 3 pages and sections, and identify concrete visual flaws and improvements. Its findings have not yet been received; Phase 3 must not be marked complete on the strength of this implementation record alone.
- The fresh-chat critique must specifically recheck the landing-page image-resolution concern: inspect every actual Flowboard screenshot at its rendered size on desktop and mobile, especially the smaller image in “Your day, without the noise,” the collaboration image in “Bring the right people into the work,” and all five “The details stay connected” cells. Distinguish source-image resolution from CSS scaling, crop choice, browser rendering, and text that is simply too small to read. Report any remaining blur or legibility issues with precise locations and recommended fixes.

#### Phase 3 source-control checkpoint, 2026-09-27

The user requested that the current Phase 3 implementation and review assets be committed and pushed as a recoverable checkpoint. This source-control snapshot does **not** mean Phase 3 is visually accepted or complete. The fresh-chat critique and any requested refinements remain ahead of the explicit acceptance gate. Frontend lint, all 58 tests, and the production build passed immediately before this checkpoint; the text/asset audit found no credentials, account email addresses, or temporary E2E labels in the public additions.

#### Independent visual critique and recommended follow-up, 2026-09-27

This is a **review record and implementation brief, not an acceptance record**. The independent review read `AGENTS.md`, `frontend/AGENTS.md`, `DESIGN.md`, this plan, `docs/design-references/README.md`, and `design-taste-frontend`; inspected all six approved PNGs at full resolution; and inspected the live site at `http://localhost:5173/`. It covered all six landing sections at 375px, 768px, 1024px, and 1440px, light and dark themes, `/case-study`, `/sign-in`, `/sign-up`, `/demo`, signed-out protected-route behavior, the designed not-found page, and representative signed-in My tasks, Projects, project board, and task-detail screens. The browser inspection was visual, not a complete functional or role-permission test. Phase 3 remains **in progress and unaccepted**.

**Strengths observed.** The Geist hierarchy, graphite and neutral surfaces, restrained persimmon accent, coherent Northline example, and use of genuine Flowboard captures make the site recognizable and credible. The 375px stacked personal and collaboration close views are much more legible than the intermediate-width overlaps. Auth and signed-in product screens largely retain the public system's typography and controls while using appropriate product density. The six-section story and five-cell product-depth count match the approved direction.

**Prioritized visual work.** These recommendations are based on direct browser observations unless identified as a design preference.

1. **Fix screenshot framing at 768px and 1024px first.** The public landing page retains narrow multi-column overlaps through 768px while the signed-in product has already moved to a more readable narrow layout. The personal inset, shared-project discussion inset, and two large product-depth cells visibly cut off controls, names, or sentence edges. Revise the responsive breakpoints, frame aspect ratios, and `object-fit: cover` treatment; use genuine tablet/mobile Flowboard captures where they fit better. Keep no document-level overflow and preserve the intended editorial hierarchy. This is the highest-impact visual defect.
2. **Align the primary CTA with the current demo placeholder.** `Explore the demo` is visually dominant in the header, hero, and closing section but `/demo` currently leads to a polished coming-soon placeholder. This is honest but breaks the primary conversion path. For the Phase 3 follow-up, keep the placeholder, explain its status plainly, and give the available action appropriate prominence; on the placeholder, `Create an account` should have more visual priority than `Back to Flowboard` when it is the usable next step. Adjust the landing CTAs so their wording and prominence do not imply that an interactive demo is available. Implement the interactive guest workspace only in the later Phase 4 work, and reconsider a direct case-study demo CTA when it actually works. Do not call the placeholder a completed demo.
3. **Recapture selected real product UI at higher fidelity.** Text is visibly soft even in some native-size source files, and the 330px-wide AI crop is enlarged at desktop size. Recapture actual Flowboard screens at higher device pixel density, export text-heavy captures as PNG, and size each crop at or above its largest rendered dimensions. Preserve authentic UI and coherent Northline data. Do not use AI generation, AI upscaling, redraws, or compositing to repair UI text or fabricate product states; these can alter letters and controls. A restrained conventional sharpening pass is only worth considering after recapture and side-by-side verification that every UI detail remains accurate. Higher resolution alone will not make a whole board's tiny labels readable.
4. **Give “Built for real workflows” concrete visual proof.** Compared with approved composition 05, the current three similar icon-and-text cards feel generic after the preceding product-led sections. Show genuine focus, permission, and recoverable-error states where available, or create a more distinctive editorial arrangement using verified content. Preserve actual permissions and error behavior; invent no product UI or claims. The preference is for stronger visual evidence, not a new aesthetic system.
5. **Vary the case-study rhythm.** Seven consecutive numbered text rows are orderly on desktop but become a long, repetitive scroll at 375px. Add a concise real architecture/data-flow visual, a focused product detail, or another honest visual treatment that helps the reader scan the story. The full-board proof image is too small to inspect on mobile; provide a focused genuine crop or an accessible way to view real detail. Keep the clear `Back to landing page` label.
6. **Improve dark-theme imagery and secondary contrast.** Light product captures create abrupt bright rectangles on dark landing and case-study surfaces. Theme-matched real captures or more intentional framing would make the transition calmer. In signed-in dark boards, some dates and secondary metadata look subdued beside task titles; tune contrast without making dense cards noisy. The judgment that bright imagery feels abrupt is a design preference; the light-only assets and subdued small text are direct observations.
7. **Polish the auth and supporting routes.** Sign-in and sign-up forms are clear, but the bright tactile photo dominates roughly half the dark desktop layout; rebalance its visual weight while retaining the approved material direction. Clerk's visible `Development mode` footer is conspicuous in a portfolio presentation; determine whether the intended public deployment removes it through normal Clerk configuration rather than hiding required provider UI. The designed not-found page is coherent, but signed-out `Open app` leads to sign-in, so a more precise label may help if revisiting its copy. These are lower-impact polish items.

**Capture-by-capture findings and fixes.** Measurements below are CSS rendered sizes in the inspected browser at device pixel ratio 1; the source dimensions are the browser's reported natural dimensions. They explain the actual rendered result rather than assuming every soft image needs more pixels.

| Landing location | Observation and cause | Recommended change |
| --- | --- | --- |
| Hero project board | The 1425x891 JPEG renders about 906x579 at 1440px. The workspace reads, but task metadata is tiny; mobile intentionally shows only a slice. This is mainly whole-UI reduction and framing, with some native-source softness. | Keep it as overview atmosphere; if individual tasks must prove a claim, add a tighter genuine product capture. |
| Personal-planning board | The 1425px My tasks source conveys the workspace at desktop size but dates, tabs, and task cards are too small to inspect; mobile crops the board. This is rendered UI scale, not a shortage of pixels for its frame. | Let the overview establish context and make the real inset the legible detail. |
| Personal-planning smaller inset | `personal-details-close.png` is 660x365 and renders about 522x273 at 1440px; the title/description read but source text is soft. At 768px, its wide source is forced into about 198x273 and loses much of the form. The 345x280 mobile source reads better at 375px. | Switch to the genuine mobile/tablet crop earlier or use a landscape tablet frame; recapture at higher density for crisp text. |
| Shared-project board | The full project board establishes context but assignments and card text become tiny on desktop and form a narrow excerpt on mobile. | Keep it as context and use a focused real capture when assignment or membership details need to be readable. |
| Shared discussion inset | `task-discussion-close.png` is 660x550 and renders about 474x378 at 1440px; main comments read, timestamps remain soft. At 768px/1024px, the narrow frame cuts sentence sides. The genuine 345x460 mobile version reads reasonably at 375px. | Give the inset a wider tablet frame or switch to a genuine mobile composition before the text is clipped. |
| Depth cell 1: Task details | The 660x412 source nearly fills the desktop card width but is vertically cropped, hiding lower checklist detail. At 768px, its narrow frame cuts both sides. The 345x280 mobile crop fits well. | Match a real crop and frame aspect ratio; keep the important controls and checklist in view. |
| Depth cell 2: Comments and notifications | The desktop discussion is mostly readable but cropped vertically; at 768px, the sides of comments are cut. The mobile comments crop reads much better. The visible screenshot proves comments, not notifications. | Use an uncropped genuine tablet discussion view, and show a real notification state if the combined label is retained as visual proof. |
| Depth cell 3: Tags | The tag samples are live rendered content, remain crisp at every width, and have no image-resolution problem. The cell feels comparatively empty beside image-led neighbors. | Keep the crisp samples; consider a more deliberate arrangement or real tag-management context if more visual weight is needed. |
| Depth cell 4: Due-date views | The 560x235 desktop crop renders about 386x161 at 1440px and only 167x69 at 768px. The date labels become too small, while the genuine mobile menu is legible at 375px. | Use the real mobile date-menu capture at tablet widths or give the date view more space; higher export resolution alone will not solve tiny UI text. |
| Depth cell 5: AI drafting and checklists | The 330x185 crop is enlarged to about 386x215 at 1440px and looks softer; at 768px it shrinks to 167x93 and is hard to read. Mobile is legible but slightly soft. The image shows description drafting but no checklist. | Recapture the real UI larger, avoid desktop upscaling, and show a real checklist state too if both parts of the cell title are to be visually substantiated. |

**Other direct observations.** The 375px landing composition generally contains content without document overflow. The signed-in project board is clearer at 768px as one status column; its three columns at 1024px are more cramped. The 375px case-study proof board is too small to inspect. In dark mode, the public pages and auth split use light-only imagery; the auth photo is particularly bright. The 404 design is coherent in both themes, and signed-out `/tasks` redirects to `/sign-in`. The review did not access separate editor or viewer sessions, did not verify every interaction, and did not measure performance or WCAG contrast numerically.

**Copy-ready fresh-chat implementation prompt**

> Continue Flowboard in `C:\Users\justi\Documents\Projects\Task-Management-Website`. Implement **every Phase 3 follow-up recommendation** in the “Independent visual critique and recommended follow-up, 2026-09-27” section of `docs/REDESIGN_IMPLEMENTATION_PLAN.md`, working in priority order. Read `AGENTS.md`, `frontend/AGENTS.md`, `DESIGN.md`, the Phase 3 plan, and `docs/design-references/README.md`; inspect all six approved PNGs at full resolution. Use `design-taste-frontend` as the sole design authority. If genuinely new supporting imagery is needed, use `imagegen-frontend-web`, but never generate, AI-sharpen, redraw, or composite Flowboard product UI. Inspect the live site and source captures before changing anything, preserve the genuine Northline example and existing working product behavior, and make focused changes. Fix all landing screenshot crops and text legibility at 375px, 768px, 1024px, and 1440px; recapture real UI at higher fidelity as needed. Address every capture-specific item in the critique, strengthen the real-workflows proof, improve the mobile case study and proof image, refine dark-theme image framing/metadata contrast and the auth presentation, and review the not-found signed-out CTA wording. Keep `/demo` as a clearly labeled placeholder for now; adjust landing and placeholder CTA wording and visual priority so visitors understand which action is available. Defer the interactive guest workspace and any direct case-study demo CTA until Phase 4. Verify light and dark themes, signed-in and signed-out routes, all four widths, no horizontal overflow, capture clarity at rendered size, relevant interactions, and frontend lint/tests/build. Record exact changes, evidence, remaining limitations, and any intentional deviation in this plan. Do not alter the six approved reference PNGs, do not fabricate interface screenshots, and do not mark Phase 3 complete or claim visual acceptance; present the result for my review. Do not commit or push unless I explicitly ask.

#### Phase 3 critique follow-up implementation for review, 2026-09-27

Phase 3 remains **in progress and unaccepted**. This pass used the existing Flowboard system (`DESIGN_VARIANCE: 6`, `MOTION_INTENSITY: 5`, `VISUAL_DENSITY: 5`) and `design-taste-frontend` for the public-page decisions. The six approved composition PNGs were inspected at full resolution and not changed. The Northline workspace and product operations were preserved. Desktop presentation, especially the 1440px hero, was given priority per the user's follow-up.

**Changes in critique priority order.**

1. Reframed the hero board as a tighter authentic crop of the nine real Northline cards at desktop width. Its short `Real project board` caption now sits at the image's right edge. The original full project-board capture remains the tablet/mobile source. Personal and shared proof stack below 1100px; their detail frames now preserve the source aspect ratio instead of cutting text sides. The two large depth cells span the grid below 1100px, and text-heavy images use `contain` with native-ratio frames. Mobile uses its genuine narrow personal, discussion, and task-detail sources.
2. The available account/workspace action is primary in public navigation, the hero, closing section, and the `/demo` placeholder. The landing secondary action says `Demo coming soon`; `/demo` explicitly labels itself an upcoming preview and keeps the usable action first. The signed-out 404 says `Sign in to workspace`. No interactive demo or case-study demo CTA was introduced.
3. Added only direct, unsharpened crops of existing real Flowboard screenshots: `project-board-cards.png`, `task-details-metadata.png`, `task-checklist-close.png`, `task-checklist-mobile.png`, and `checklist-proof.png`. The desktop task-detail cell now separates metadata and checklist views so both have readable scale. Due-date views use the genuine narrow menu at all sizes; the AI cell stays at or below its 330px native source width and has a separate real checklist-control crop. The comment cell identifies its image as discussion proof and does not pretend that it shows the notification inbox.
4. Replaced three repeated icon cards in “Built for real workflows” with an editorial evidence list. Its role summary and save-failure sequence describe implemented behavior, not a fabricated application screenshot or metrics.
5. Added a semantic React/Clerk/Express/policy/Prisma data-flow visual and a focused real discussion view in the case study. Mobile uses the 345px discussion capture as its lead proof and offers a link to the full board image. `Back to landing page` remains explicit.
6. Added dark-surface framing around light product captures, reduced the auth photo's area and dark-theme brightness, and strengthened dark task-card date/count metadata. The auth layout still shows Clerk's provider footer. [Clerk's environment guidance](https://clerk.com/docs/guides/development/managing-environments) distinguishes development and production instances; the production appearance was not verified here and no provider UI was hidden.
7. Aligned public action radii with the existing 10px control shape and retained the signed-out sign-in redirect. No generated supporting imagery was needed.

**Verification.** Browser review included all six landing sections and the desktop hero in light and dark, the case study at desktop and 375px, desktop auth, the placeholder, the 404, and signed-in My tasks/Projects/project board. Browser DOM measurements found zero document-level horizontal overflow on `/`, `/case-study`, `/sign-in`, `/sign-up`, `/demo`, and an unknown route at 375px, 768px, 1024px, and 1440px in both themes. The signed-in `/tasks`, `/projects`, and Northline `/projects/345` routes also had zero document-level overflow at those widths in both themes. Signed-out `/tasks` redirected to `/sign-in`; the mobile public menu opened and its case-study link navigated; theme menus changed the active theme. At 1440px, the hero card crop renders about 943x433 from a 1110x495 source. Personal detail renders about 523x289 from 660x365, discussion about 474x395 from 660x550, AI drafting about 329x184 from 330x185, and date menu about 314x344 from 315x345. All named detail sources render at or below native size. Frontend lint, all 58 tests in 18 files, production build, and `git diff --check` passed. No commit or push was made.

**Remaining limitation and intentional deviation.** The original product JPEGs and some existing PNG close views remain somewhat soft at their native text size. The new PNGs are lossless direct crops of those authentic sources, not fresh high-density captures, so they do not remove source softness. A fresh screenshot of the signed-in Northline board was inspected again at a 1440px browser viewport. The supported browser screenshot API returned an image for visual inspection but no saved file path; a prior data-URL export attempt was blocked by browser security policy, which prohibited workarounds. High-density recapture into repository assets therefore remains open; this pass does not claim to satisfy the critique's high-fidelity recapture recommendation or final visual acceptance. The real notification state, focused error state, and separate editor/viewer browser sessions were not captured; their public copy and editorial proof stay limited to verified implementation behavior. `/demo` remains a placeholder until Phase 4.

#### Phase 3 next-chat handoff, 2026-09-27

The current working tree is the uncommitted Phase 3 follow-up implementation listed above. Preserve it; do not repeat the completed layout, copy, or case-study work unless a direct visual review finds a defect. The remaining implementation task is to replace visibly soft product-capture sources with sharper **genuine Flowboard UI** screenshots, if a supported capture-and-save workflow is available. Prioritize the 1440px landing presentation, then check 1024px, 768px, and 375px. Compare each new source with the existing real Northline data and inspect all text and controls at its rendered size. Keep responsive source variants where they improve framing. Do not enlarge a source beyond its useful native detail or use generated, redrawn, composited, AI-sharpened, or fabricated UI. The user should not need to prepare captures manually. If the available browser tooling still cannot save authentic captures, retain the current assets and record that precise limitation; do not represent the recapture recommendation as complete.

After any capture work, review the desktop hero and all six landing sections, case study, auth, demo placeholder, and signed-out routes in both themes at the four widths; check interactions, overflow, capture clarity, frontend lint/tests/build, and the final diff. The case-study demo link and interactive guest workspace belong to Phase 4. Keep Phase 3 in progress until the user explicitly accepts the visuals. Do not commit or push without a new explicit request.

#### Phase 3 capture and responsive review continuation, 2026-09-27

Phase 3 remains **in progress and unaccepted**. The existing uncommitted critique follow-ups and all six approved reference PNGs were preserved. No product capture, UI code, demo implementation, or case-study demo CTA was changed in this continuation. The user clarified that image sharpening is acceptable only if the result remains virtually identical to the actual product and every letter and control stays accurate. No sharpening or image generation was applied because that fidelity condition could not be verified for the soft source text.

**Authentic capture attempt.** The live Northline development workspace was accessible while signed in through both the Codex in-app browser and Chrome. Fresh browser screenshots of the board and task editor were taken and visually inspected. In the currently supported browser interface, `screenshot()` returns JPEG image bytes for inspection but provides no saved file path or export-to-repository operation. Its full-page variant intermittently leaves offscreen image layers blank even when the DOM reports those images loaded, so it is unsuitable as a source asset. The browser clipboard API accepted screenshot bytes, but its clipboard was isolated from the Windows clipboard; Windows reported no image to save. Chrome's developer screenshot controls did not open through the supported browser key action. A prior page data-URL export was blocked by browser security policy, so it was not repeated or bypassed. This attempt did not produce a new authentic PNG file. The current genuine captures remain in place, and the high-fidelity recapture recommendation is **still open**; the user does not need to prepare screenshots for this review.

**Rendered-size findings.** At 1440px, the hero card source is 1110x495 and renders about 933x422, so it is not enlarged, but its native small labels remain soft. The personal detail is about 512x278 from 660x365; the discussion inset is about 464x384 from 660x550. At 1024px, the task metadata, checklist, and discussion images in the two wide depth cells render about 875px wide from sources 660px, 500px, and 660px wide, respectively; at 768px the checklist image renders about 619px wide from a 500px source. These remain genuine but can look soft when enlarged. At 375px, the responsive personal, discussion, task-detail, and date-menu sources are readable in their frames; the separate checklist-control proof shrinks to about 266x30 from an 890x135 source and its text is too small to inspect. The overview boards intentionally convey context rather than legible card metadata at tablet/mobile scale. Representative source labels and controls were compared with the live Northline board and task editor; no new image was substituted.

**Visual and route review.** All six landing sections, the case study, auth screens, `/demo` placeholder, designed not-found route, signed-in `/tasks`, `/projects`, and `/projects/345`, and signed-out redirects were checked at actual 1440px, 1024px, 768px, and 375px browser viewports in light and dark. Document-level horizontal overflow was zero for each checked route/width/theme combination. The landing still has exactly six sections and five depth cells; narrow personal and discussion frames preserve sentence edges. The dark product captures remain light screenshots within the existing dark framing. The mobile public menu opened and navigated to the case study; the theme menu changed themes; the Northline task editor opened with title, metadata, assignees, and checklist; signed-out `/tasks`, `/projects`, and `/projects/345` redirected to `/sign-in`. The case study keeps its explicit landing return action, and `/demo` remains an honest placeholder. This was a visual and navigation review, not a fresh editor/viewer permission session or a full task mutation test.

**Checks and next review.** Frontend `npm run lint`, all 58 tests in 18 files, and `npm run build` passed. The source-capture softness, tablet depth-cell enlargement, and tiny mobile checklist proof remain the primary capture-clarity items for user visual review. Phase 3 is not complete or visually accepted. No commit or push was made.

#### Phase 3 deferred review and Phase 4 transition, 2026-09-27

The user chose to proceed with the interactive guest demo now and revisit Phase 3 visuals at the end of Phase 4. This is an explicit sequencing decision, **not** Phase 3 visual acceptance or completion. The Phase 3 critique follow-up is a recoverable implementation checkpoint; keep the capture and review issues below open while building the demo.

1. **Capture fidelity:** Replace visibly soft source screenshots with sharper genuine signed-in Flowboard captures when a supported capture-and-save workflow is available. Prioritize the 1440px hero, then personal detail, shared discussion, task detail, and AI controls at 1024px, 768px, and 375px. Check every label and control against the live Northline UI at actual rendered size. The current browser capture API can display screenshots but did not provide a supported file export in the continuation above. Do not treat this as resolved by taking an inspection-only screenshot.
2. **Rendered image scale:** The two large product-depth cells enlarge 660px and 500px source images at 1024px, and the checklist close view is also enlarged at 768px. The separate mobile checklist-control proof is only about 266x30 and unreadable. Adjust framing or use genuine responsive captures so claimed details can be inspected. Whole-board mobile crops are context images; focused proof should carry the legibility burden.
3. **Dark-theme and proof coverage:** The public pages still use light product screenshots in dark framing. Consider genuine dark captures if they improve the visual transition. The comments image proves discussion but not the notification inbox; the workflows evidence is editorial text rather than captured focus, permission, or recovery states. Keep copy precise unless genuine states are captured.
4. **Final visual and production checks:** After Phase 4, recheck all six landing sections, case study, auth, signed-in and signed-out routes, and the new demo at 1440px, 1024px, 768px, and 375px in both themes. Confirm image clarity, interactions, keyboard and reduced-motion behavior, and no horizontal overflow. Clerk's development footer has not been verified in a production instance. Complete the Phase 5 performance and role-session checks separately.

The user allows image sharpening only when the result stays virtually identical to the authentic product and **no** text, icon, or control changes. Any candidate must be compared side by side at rendered size before use. If image generation is needed for new supporting imagery, use `imagegen-frontend-web`; never generate replacement Flowboard interface content. Do not mark Phase 3 complete without the user's explicit visual acceptance after the return pass.

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

After the functional demo passes this gate, return to the deferred Phase 3 capture and visual review items above before Phase 5. Add any case-study demo CTA only after `/demo` works and its destination has been verified. Phase 4 completion does not imply Phase 3 visual acceptance.

#### Phase 4 implementation and deferred Phase 3 return, 2026-09-27

The `/demo` placeholder was replaced with a guest workspace using the existing `AppShell`, task board and cards, task view tabs and controls, creation dialog and form, task detail modal, checklist, tag picker, and tag manager. Shared task mutations now accept a workspace-operations boundary. The authenticated implementation delegates to the existing API helpers with a Clerk token; the demo implementation reads and writes only `flowboard:demo-workspace:v1` in local storage. A direct `/demo` load omits the Clerk provider. The seed has personal tasks, reusable tags and checklists, and a three-member Northline sample project across all statuses. Guests can create, edit, delete, complete, reopen, and move tasks; search, filter, and sort; manage tags, due dates, and checklist items; browse the project; and reset the seed. The shell states that changes stay in the browser. Project creation, invitations, notifications, posting discussion or activity, and membership/settings administration are explained as account features. The task form still shows its AI description and checklist generation buttons. They are disabled for guests, with a hover hint and a visible explanation linking to sign-up. The landing and case study now link to the working demo; the case-study destination was opened and verified.

Verification: frontend lint, tests, and production build passed after the initial implementation; the final check results after the guest AI-control change are recorded below. Four operation tests cover storage initialization and version replacement, persistence across a fresh operations instance, task create/edit/complete/reopen/delete, operation-level reordering and due-date input, checklist and tag operations, reset, and no `fetch` calls from demo operations. In the live browser on port 5173, a guest task with a checklist item was created, survived reload, and was removed by Reset demo. A seeded task was then renamed, moved from To do to In progress, given a checklist item, saved, and found with its changes after reload; deleting it and resetting restored the seed. Project navigation and task details opened; search, completion, reopening, and filter clearing worked. Both AI controls were visible and disabled in the guest task form at 375px and 1024px, with the account explanation and sign-up link visible. The guest tasks and project board were visually inspected in light and dark at 375px, 768px, 1024px, and 1440px. The project list, landing page, case study, and authenticated My tasks route had no document-level horizontal overflow at those widths in both themes. The direct demo route rendered without account controls or a Clerk provider. Browser end-to-end coverage includes the creation, edit, reload persistence, deletion, reset, navigation, search, completion, reopening, and filter flows above. Drag reordering, due-date and tag edits, every sort/filter combination, and project task creation were not each exercised end-to-end in the browser, so a complete feature-by-feature end-to-end pass is still outstanding. The available browser tooling did not expose a network-request log, so the no-request claim is based on the direct-entry architecture and the automated `fetch` isolation test rather than a captured network trace. No commit or push was made.

Final Phase 4 checks after retaining the guest AI controls: frontend lint passed, all 63 tests in 20 files passed, and the production build passed. The new component test checks that both guest AI buttons remain visible and disabled with the account explanation.

Phase 4 guest collaboration and exit follow-up, 2026-09-28: The Northline demo project now has a browsable read-only Activity section. Editing a project task shows the existing Details, Discussion, and Activity tabs. Seeded discussion and activity entries are labeled Demo data; the guest comment field and Comment button are disabled, with an account link beside the explanation. The sample history stays local in `flowboard:demo-workspace:v1`, and existing version-one local workspaces gain the sample entries without losing task edits. The guest Flowboard logo and a new Back to home link return to the landing page. Those guest exit links perform a document navigation because direct demo entry omits Clerk, while the public landing page expects its provider. In the running browser on port 5173, project-level activity and both task tabs showed sample entries, the comment controls were disabled, and the home link and logo each loaded the landing page. The discussion modal was inspected in light and dark at 375px, 768px, 1024px, and 1440px with no document-level horizontal overflow; mobile and desktop screenshots showed readable content. Two new tests cover seeded-history migration and guest task tabs, and a shell test covers both guest logo destinations. Final lint, test, and build results follow below. Phase 3 remains in progress pending explicit visual review.

Final follow-up checks: frontend lint passed, all 66 tests in 20 files passed, and the production build passed. `git diff --check` passed. No commit or push was made.

Public header demo entry, 2026-09-28: Signed-out visitors now see a Try demo link in the landing and case-study header. It uses a document navigation to enter the guest workspace without initializing Clerk. Signed-in visitors retain their existing workspace actions and do not see this extra link. At 768px the added item crowded the desktop nav, so the public header switches to its existing menu layout at 900px while the footer keeps its 767px breakpoint. The signed-out Chrome session showed the link at desktop width and in the expanded menu at 768px and 375px; clicking it loaded `/demo/tasks`. No document-level horizontal overflow was measured at 1024px, 768px, or 375px. A new component test checks signed-out visibility and signed-in absence. Final checks are recorded below.

Final public-header checks: frontend lint passed, all 67 tests in 21 files passed, and the production build passed. The signed-out header and its demo link were also checked in dark at 375px, 768px, 1024px, and 1440px with no document-level horizontal overflow; the 375px dark menu was visually inspected. Browser theme and viewport were restored. `git diff --check` passed. No commit or push was made.

Signed-in home navigation follow-up, 2026-09-28: The Flowboard logo in the authenticated application shell now links to `/` on desktop and mobile, matching its guest behavior. The signed-in browser session confirmed that clicking the logo from `/tasks` opens the landing page while preserving the signed-in public header. The shell test checks both logo links. Guest logo navigation continues to reload the document so direct demo entry can initialize the public Clerk provider on exit. Final checks are recorded below.

Final signed-in navigation checks: frontend lint passed, all 67 tests in 21 files passed, the production build passed, and `git diff --check` passed. No commit or push was made.

Phase 4 release audit, 2026-09-28: A signed-out guest opened the seeded Northline project on port 5173, created a project task through the shared creation form, and saw the task on the project board. After a browser reload, the task was still present; Reset demo removed it and restored the original three-task project seed. This closes the previously noted browser project-task-creation gap. The rest of the browser interactions and responsive checks are recorded above. The available browser inspection interface exposes page content and console logs but no network-request log, so a captured network inspection of demo operations is still missing. Direct demo entry excludes the Clerk provider, and the demo operations test asserts zero `fetch` calls, but those are not a substitute for the stated network-inspection gate. Frontend lint passed, all 67 tests in 21 files passed, the production build passed, and `git diff --check` passed. Phase 4 is functionally implemented and remains open for that final verification. Phase 5 should perform the network check before treating Phase 4 as formally complete. Phase 3 remains in progress and awaits explicit user visual acceptance.

Deferred Phase 3 return: the existing genuine Northline captures remain unchanged. At 1024px, product-depth images now stop at their native 660px or 500px width; the tiny, unreadable checklist-control crop was removed, and the remaining genuine AI-controls crop is framed alongside its copy. The desktop hero still shows the original real board capture, which remains visibly soft at small text sizes. The browser can display fresh authentic screenshots for inspection but still provides no supported save path for a replacement source asset. The 1440px hero and other soft source captures therefore remain open for high-density recapture; no fabricated or AI-sharpened UI was substituted. Dark pages continue to frame genuine light-theme captures. Phase 3 is **in progress and not visually accepted**. User review is still required before that status can change.

### Phase 5: Final verification and delivery

1. Run all frontend lint, tests, and production build.
2. Run relevant backend tests and type checking to confirm no regressions.
3. Manually verify:
   - signed-in and signed-out routing;
   - task CRUD and drag-and-drop;
   - checklists and task details;
   - project collaboration, roles, comments, activity, and invitations;
   - separate signed-in editor and viewer browser sessions: confirm permitted task and assignment actions for the editor, read-only restrictions for the viewer, and the absence of owner-only controls for both roles;
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

Start a new chat after each completed and verified phase. The independent whole-site Phase 3 critique was completed in a fresh chat, and its implementation follow-ups are recorded above. The user has now explicitly chosen to start Phase 4 in a new chat while Phase 3 capture clarity and visual acceptance remain open. Return to those deferred items at the end of Phase 4, and wait for explicit user visual acceptance before marking Phase 3 complete.

1. Foundation and product shell
2. Authenticated product redesign
3. Public experience
4. Interactive guest demo
5. Final verification and delivery

Do not switch chats halfway through a component refactor or while checks are failing without recording the exact unfinished state and failures in this document or a dedicated handoff note.
