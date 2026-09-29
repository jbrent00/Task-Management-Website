# Flowboard Design System

## 1. Product and brand

Flowboard helps individuals organize personal work and bring in a small team when a project needs shared momentum.

### Design read

Portfolio-grade productivity product for recruiters, individual contributors, and small teams. The visual language is calm, precise, and human. It uses restrained editorial composition, compact product density, and purposeful motion.

### Design dials

- `DESIGN_VARIANCE: 6`
- `MOTION_INTENSITY: 3`
- `VISUAL_DENSITY: 5`

### Brand principles

1. **Clarity before decoration.** Every visual element must improve hierarchy, comprehension, feedback, or state recognition.
2. **Calm does not mean empty.** Product screens are compact enough for daily work while preserving strong grouping and breathing room.
3. **Person first, team when needed.** Personal planning is the entry point. Collaboration appears as a natural extension.
4. **Trust through real behavior.** Public pages show actual Flowboard screens and verified capabilities. Do not invent metrics, customers, testimonials, or pricing.
5. **Warm precision.** Graphite and cool neutral surfaces provide structure. Persimmon supplies a memorable human accent.

### Voice

- Clear, direct, and human
- Short sentences and concrete verbs
- Confident without startup hype
- Helpful error messages that preserve context and explain recovery
- Avoid filler such as "seamless," "elevate," "unleash," and "revolutionize"
- Do not use em dashes or en dashes in visible copy

### Public-page message

- Lead with the shift from personal tasks to shared projects. The hero may change composition and copy when a clearer product explanation results.
- Use **Explore the demo** as the primary landing action. Account creation is a secondary action where useful.
- Show actual product behavior before listing capabilities. Keep claims concrete and verifiable.
- Credit: **Designed and built by Justin Brent.**

### Mark and wordmark

- The wordmark is `Flowboard` set in Geist Variable at 700 weight with tight but readable tracking.
- The mark is a simple geometric arrangement of three offset rounded planes moving forward. It represents tasks progressing through a board.
- The mark must remain legible at 16px for the favicon and at 24px in navigation.
- Use a coded vector mark only for the brand. Interface icons come from Phosphor.
- Do not add gradients, glow, decorative dots, or a version stamp to the mark.

## 2. Foundations

### Color tokens

Use semantic tokens in components. Raw colors belong only in the global token file.

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `--page-bg` | `#F5F5F2` | `#141416` | Main canvas |
| `--surface` | `#FCFCFA` | `#1C1C1F` | Primary surfaces |
| `--surface-elevated` | `#FFFFFF` | `#242428` | Dialogs and elevated controls |
| `--surface-muted` | `#EEEDE8` | `#2A2A2E` | Secondary grouping |
| `--text` | `#1B1B1F` | `#F2F1ED` | Primary text |
| `--text-muted` | `#69686F` | `#A6A4A0` | Supporting text |
| `--text-subtle` | `#85838A` | `#85838C` | Nonessential metadata |
| `--border` | `#DAD9D4` | `#343438` | Standard borders |
| `--border-strong` | `#C4C2BC` | `#4A494F` | Inputs and emphasized boundaries |
| `--accent` | `#B9472B` | `#F07A59` | Brand actions and selection |
| `--accent-hover` | `#9F3820` | `#FF8A68` | Hovered brand actions |
| `--accent-soft` | `#F4E2DC` | `#3D2722` | Selected or highlighted surfaces |
| `--accent-ink` | `#FFF9F5` | `#211411` | Text placed on accent |
| `--success` | `#187A59` | `#58C59A` | Completed and successful state |
| `--success-soft` | `#E1F1E9` | `#1D352C` | Success background |
| `--warning` | `#9A5B12` | `#E5A44E` | Due soon and caution |
| `--warning-soft` | `#F5E9D5` | `#392D1C` | Warning background |
| `--danger` | `#B53B3B` | `#F07B7B` | Destructive and overdue state |
| `--danger-soft` | `#F5E0DF` | `#3B2224` | Danger background |

Persimmon is the only brand accent. Semantic colors may communicate real status but must not become decorative accents.

### Theme behavior

- Apply `data-theme="light"` or `data-theme="dark"` to `document.documentElement`.
- Theme preference values are `system`, `light`, and `dark`.
- Persist the selected preference as `flowboard:theme`.
- `system` follows `prefers-color-scheme` and updates when the operating system changes.
- A theme menu exposes all three options. Do not use a binary toggle that hides the system option.
- Landing, authentication, case study, demo, and product screens all use the same active theme.
- Never invert one section into a different theme.

### Typography

- Primary family: `Geist Variable`
- Monospace family: `Geist Mono Variable`
- Self-host through Fontsource packages with `font-display: swap` behavior.
- Body default: 16px, 1.55 line height, 400 weight.
- Product metadata: 12px to 13px, 500 weight.
- Product labels: 13px to 14px, 600 weight.
- Product page title: `clamp(2rem, 4vw, 3.5rem)`, 650 weight, `-0.045em` tracking.
- Marketing display: `clamp(3.5rem, 8vw, 7.5rem)`, 600 weight, maximum two lines.
- Use Geist Mono only for counts, dates, keyboard shortcuts, and technical metadata.
- Do not use serif type, mixed-family headline emphasis, all-caps section numbering, or gradient text.

### Spacing

Use an 8px base rhythm with 4px for compact internal adjustments.

- `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`
- Product page horizontal padding: `clamp(16px, 3vw, 40px)`
- Marketing container: `min(1400px, calc(100% - 32px))`
- Product content maximum: 1520px
- Product section gaps: 24px to 48px
- Marketing section padding: 96px to 160px desktop, 64px to 96px mobile

### Shape

- Interactive controls: 10px radius
- Cards, panels, and dialogs: 16px radius
- Small nested surfaces: 12px radius
- Full pills only for tags, compact filters, counts, and avatars
- Circular shapes only for avatars and icon-only account controls

### Borders and shadows

- Prefer a border and negative space over elevation.
- Small shadow: `0 1px 2px rgb(27 27 31 / 0.05)`
- Elevated shadow: `0 18px 55px rgb(27 27 31 / 0.12)` in light mode
- Dark shadows use black at no more than 35 percent opacity.
- Never use glow or pure black shadows on light surfaces.

### Icons

- Use `@phosphor-icons/react` only.
- Import icons from individual CSR paths to avoid development and bundle overhead.
- Standard product weight: `regular` or `1.75` visual stroke.
- Use `fill` only for selected semantic states such as a completed checkbox.
- Icon-only controls require an accessible name and a minimum 40px hit target.
- Replace Unicode arrows, chevrons, close marks, overflow marks, and hand-authored interface SVGs.

## 3. Layout systems

### Public navigation

- Maximum height: 80px; the current desktop header is 78px
- Single line on desktop
- Brand on the left
- Product, Case study, and GitHub appear in that order before the theme control
- Signed-out navigation ends with quiet Sign in and a primary Explore the demo action; account creation remains available in page content
- Signed-in navigation ends with one Open workspace action
- Mobile uses a compact menu without a decorative full-screen animation

### Product shell

- Desktop at 768px and above: persistent left sidebar
- Expanded sidebar: 232px
- Collapsed sidebar: 72px
- Sidebar contains brand, My tasks, Projects, theme menu, notifications, and account controls
- Content remains centered within the available workspace and does not slide under the sidebar
- Mobile: 60px top bar for brand and account controls, plus bottom navigation for My tasks and Projects
- Bottom navigation accounts for safe-area insets and never obscures content

### Task board

- Three columns at widths above 960px
- Columns share equal width but cards establish rhythm through content, not decorative color blocks
- Below 960px, show one selected status at a time using the existing status selector behavior
- Column headers remain visible and use actual semantic status color sparingly
- Card actions occupy stable positions so content length does not move essential controls unpredictably

### Marketing versus product density

- Marketing pages are image-led and airy with six distinct layout families.
- Product pages are denser and optimized for scanning, keyboard use, and repeated actions.
- Marketing treatments such as large image crops and editorial offsets do not enter task-management surfaces.
- Product controls, state colors, and type still share the same foundational tokens.

## 4. Components and states

### Buttons

- Primary: persimmon fill, accent ink text, 10px radius
- Secondary: surface fill, strong border, primary text
- Quiet: transparent, muted text, visible hover surface
- Danger: danger text and border; solid danger fill only for final confirmed action
- Desktop labels remain on one line
- Active state scales to `0.98` or translates by 1px
- Disabled state retains readable contrast and does not rely on opacity alone

### Fields

- Labels appear above fields
- Inputs are at least 42px tall on desktop and 44px on touch layouts
- Placeholder text is never the only label
- Focus uses a two-layer ring derived from the accent
- Helper and error text remain directly associated with the field

### Tabs and filters

- Tabs use a restrained underline or selected surface, not both
- Filters collapse behind one clear control on narrow screens
- Active filters appear as removable pills
- Long filter rows may scroll horizontally on touch screens

### Cards and panels

- Cards exist only where the boundary communicates drag behavior, selection, or a discrete object
- Avoid nesting cards inside cards
- Project summaries use structure and spacing rather than equal decorative card grids where possible
- Task cards expose title, priority, key metadata, progress, and stable actions in that order

### Dialogs and menus

- Dialogs trap focus, restore focus to the trigger, close on Escape, and describe destructive effects explicitly
- Menus support keyboard navigation and maintain 40px targets
- Backdrops are theme-aware and do not use heavy blur

### Feedback states

- Loading uses layout-matched skeletons
- Empty states explain what is missing and offer one relevant next action
- Inline errors retain user input and explain recovery
- Toasts are reserved for completed transient actions
- Optimistic failures explain what was restored

## 5. Motion

- Use Motion only when a route reveal or shared layout transition makes the state change clearer.
- Use CSS for hover, focus, pressed, and small disclosure transitions.
- Standard duration: 180ms for controls, 260ms for panels, 500ms maximum for marketing reveals.
- Standard ease: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Animate only transform and opacity.
- Every animation must communicate hierarchy, feedback, or state transition.
- Do not use GSAP, scroll hijacking, parallax, infinite marquees, magnetic controls, or custom cursors.
- Under `prefers-reduced-motion: reduce`, remove automatic motion and use instant state changes.

## 6. Public pages

### Landing page story

- The desktop hero explains the personal-to-shared shift in one glance, with a legible real Flowboard capture and a clear demo action.
- Personal planning and shared projects use distinct compositions and product evidence. Do not repeat the same board image as the main proof in consecutive sections.
- Product depth establishes a hierarchy: one or two substantial demonstrations, then compact supporting details. The content determines the number of visual cells.
- Workflow proof names specific accessibility, permission, and recovery behavior and links or points to real evidence where available. Do not invent metrics.
- End with a decisive demo action, an optional account action, authorship, GitHub, and case-study links.
- Use `design-taste-frontend` as the sole authority for public-page design decisions. Generate imagery only when genuine product captures cannot serve the design.

### Image direction

- Real redesigned product captures are the primary proof.
- Generated supporting imagery is optional when genuine product captures cannot communicate a section's purpose.
- When used, supporting imagery follows the cool neutral palette with restrained persimmon details.
- Avoid people-at-laptop stock imagery, floating 3D blobs, fake dashboards, neon glow, and illegible AI-generated copy.
- Generated reference images are 16:9 or 16:10 and show one section only.

### Authentication

- Shared branded auth layout for sign in and sign up
- Clerk component styling follows the active theme and the component rules in this document
- Desktop may pair the auth panel with one approved tactile image crop
- Mobile prioritizes the form and removes nonessential imagery

### Case study

- Tell a varied visual story about the product problem, interface decisions, permission and data flow, recovery and accessibility, and lessons learned.
- Pair major engineering claims with a product capture, diagram, source file, or test evidence.
- Keep the writing concise and factual for recruiters. Avoid repeated numbered chapters and feature inventories.
- Include the repository link and a working route to the demo.

## 7. Demo workspace

- Public route: `/demo`
- Uses the real product shell and shared task components
- Persists versioned seed data at `flowboard:demo-workspace:v1`
- Supports local task create, update, delete, complete, reopen, reorder, filtering, sorting, tags, due dates, and checklists
- Includes a seeded collaborative project for browsing
- Provides a clear Reset demo action
- Never calls Clerk or backend APIs
- Invitations, AI generation, notifications, membership administration, and destructive project settings are unavailable and link to account creation where appropriate

## 8. Accessibility and responsive requirements

- WCAG AA minimum contrast for all body text and controls
- Visible focus on every interactive element
- Logical heading order and landmark structure
- Keyboard-accessible navigation, filters, dialogs, task actions, and reordering
- Touch targets at least 44px on mobile
- Content remains usable at 200 percent zoom
- No information conveyed by color alone
- Decorative imagery uses empty alt text; product captures use concise functional descriptions
- Mobile layouts collapse to one column with 16px side padding
- Use `min-height: 100dvh` for viewport-height layouts

## 9. Performance and quality gates

- Route-level lazy loading for public, demo, case-study, and authenticated application groups
- Individual icon imports
- Reserve image dimensions to prevent layout shift
- Preload only the hero asset and primary font subset
- Target LCP below 2.5s, INP below 200ms, and CLS below 0.1
- Validate at 375px, 768px, 1024px, and 1440px in both themes
- Validate reduced motion, keyboard operation, loading, empty, success, and error states
- Run lint, tests, build, and Lighthouse before delivery

## 10. Prohibited patterns

- AI purple or blue glow
- Inter as the primary font
- Repeated three-equal-card marketing sections
- Fake testimonials, logos, metrics, pricing, or customer claims
- Div-based fake screenshots
- Section numbers and repeated uppercase eyebrows
- Decorative status dots
- Scroll cues
- Version labels
- Custom cursors
- Theme inversion between sections
- Unmotivated animation
- Visible em dashes or en dashes
