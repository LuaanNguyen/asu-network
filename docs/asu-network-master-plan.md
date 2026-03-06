# asu.network Master Plan

## 1) Product Vision

Build `asu.network` as the talent graph for ASU: a high-signal directory of engineers, builders, operators, and business leaders, with clear ways to discover people, understand what they work on, and connect.

## 2) Goals and Success Metrics

### Primary goals

1. Make talented ASU people discoverable in under 30 seconds.
2. Make outreach easy with trusted links (email, GitHub, LinkedIn, personal site).
3. Visualize meaningful connections between people, projects, and programs.
4. Keep data quality high through moderation and verification.

### Success metrics

- Activation: user can find and contact a relevant person in one session.
- Supply: approved profiles added per week.
- Quality: profile completeness score, broken link rate, report rate.
- Engagement: search-to-profile click-through and graph interactions per session.

## 3) Core User Journeys

1. Discover
   - User lands on home page, searches by skill/program/company interest.
   - User opens profiles and filters by role, major, graduation year, clubs, startup interest.
2. Connect
   - User clicks contact links and reaches out.
   - User bookmarks profiles to a short list.
3. Join network
   - Student submits profile via intake form.
   - Admin reviews, verifies, and publishes.
4. Explore graph
   - User sees connection map and follows edges between people, projects, clubs, and programs.

## 4) MVP Scope (Phase 1)

### In scope

- Public directory with card grid and profile detail pages.
- Search with filters.
- Submission form for new profiles.
- Admin moderation queue.
- Graph view with basic edges.
- Responsive modern UI and accessibility baseline.

### Out of scope (Phase 1)

- Messaging platform inside app.
- Full social feed.
- Advanced recommendation engine.
- Complex permissions hierarchy beyond admin + public.

## 5) Product Information Architecture

### Public pages

- `/` home and value proposition
- `/people` searchable directory
- `/people/[slug]` profile detail
- `/graph` interactive connection map
- `/join` submit profile

### Admin pages

- `/admin/submissions` moderation queue
- `/admin/people/[id]` approve, reject, request edits
- `/admin/connections` manage edge quality

## 6) Data Model

Use PostgreSQL with normalized tables and an edge table for graph relationships.

### Core entities

- `people`
  - `id`, `slug`, `full_name`, `headline`, `bio`, `program_id`, `grad_year`, `location`, `avatar_url`, `is_published`
- `programs`
  - `id`, `name`, `school`, `degree_type`
- `links`
  - `id`, `person_id`, `type` (`github`, `linkedin`, `email`, `site`, `x`), `url`, `is_public`
- `skills`
  - `id`, `name`
- `person_skills`
  - `person_id`, `skill_id`
- `projects`
  - `id`, `name`, `description`, `url`
- `person_projects`
  - `person_id`, `project_id`, `role`
- `organizations`
  - `id`, `name`, `type` (`club`, `startup`, `lab`, `company`)
- `person_organizations`
  - `person_id`, `organization_id`, `role`
- `connections`
  - `id`, `source_person_id`, `target_person_id`, `connection_type`, `strength`, `source_ref`
- `submissions`
  - `id`, `payload_json`, `status`, `review_notes`, `submitted_at`, `reviewed_at`

### Indexing

- Full-text index on `people.full_name`, `headline`, `bio`.
- B-tree indexes on `program_id`, `grad_year`, and join table FKs.
- Optional trigram index for fuzzy name search.

## 7) Technical Architecture

### Recommended stack

- Framework: Next.js (App Router) + TypeScript.
- UI: Tailwind CSS + custom design tokens and component system.
- DB: Postgres (Neon or Supabase) + Drizzle ORM.
- Auth (admin only): Clerk or NextAuth.
- Validation: Zod.
- Observability: Sentry + Vercel Analytics.
- Hosting: Vercel.

### Rendering strategy

- Server Components by default for directory and profile pages.
- Client Components only for interactive controls and graph canvas.
- Dynamic import the graph module to keep landing bundle small.

### API surface

- `GET /api/people` search + filter + pagination.
- `GET /api/people/:slug` profile detail.
- `POST /api/submissions` create intake record.
- `GET /api/graph` nodes and edges with optional filters.
- `POST /api/admin/submissions/:id/approve|reject`.

## 8) Search and Ranking

### MVP search

- Postgres full-text search with weighted ranking:
  - name weight highest
  - headline/skills medium
  - bio lower
- Filter facets: program, year, skill, role type, organization.

### Phase 2 search

- Move to Meilisearch or Typesense if search scale and typo tolerance requirements grow.

## 9) Graph Component Plan

### Library options

- Start with `react-force-graph` or `reactflow` based on UX preference.
- Use server endpoint returning:
  - `nodes`: person, project, org, program
  - `edges`: typed and weighted relationships

### Graph UX

- Node click opens side panel with quick profile summary.
- Edge legend with type filters (worked together, same org, same program).
- Depth toggle (1-hop, 2-hop) with query guardrails.

### Performance guardrails

- Limit default graph to top N nodes by relevance.
- Progressive load by neighborhood expansion.
- Memoize layout and avoid full rerenders on filter toggles.

## 10) Modern UI Direction

Use a confident editorial style, not generic dashboard defaults.

### Visual system

- Typography: `Sora` for display, `IBM Plex Sans` for body, `IBM Plex Mono` for metadata.
- Palette: warm neutrals + electric cyan accent + deep slate foreground.
- Surfaces: layered gradients and subtle noise texture, not flat white.
- Motion: purposeful reveal, filter transition, graph focus animation.

### Component architecture (from composition patterns)

- Use compound components for complex modules:
  - `Directory.{Shell,Filters,Results,EmptyState}`
  - `Profile.{Header,Stats,Links,Projects,Connections}`
  - `Graph.{Canvas,Legend,Panel,Controls}`
- Avoid boolean-prop-heavy mega components; build explicit variants.

### Accessibility baseline

- Keyboard access for search, filters, graph controls, and modal/panel flows.
- Color contrast >= WCAG AA.
- Focus-visible states on all interactive components.

## 11) Security, Privacy, and Trust

- Explicit consent checkbox for published profile data.
- Store only necessary personal data.
- Rate limit submission endpoint and add spam protection.
- Admin audit trail for moderation actions.
- Verify links and sanitize all user-submitted content.

## 12) Quality Strategy

### Test layers

- Unit tests: utilities, ranking functions, validation schemas.
- Integration tests: API routes and DB operations.
- E2E tests: discover, profile view, submission, moderation.
- Visual regression: key page snapshots.

### Performance budgets

- LCP < 2.5s on directory pages.
- JS payload minimized on non-graph routes.
- No major layout shifts on first render.

## 13) Engineering Workflow with Cursor + Codex

### Branching and delivery

- Trunk-based with short-lived feature branches.
- PR template with:
  - behavior change
  - performance impact
  - accessibility checks
  - test evidence

### Agent roles

1. Planner Agent
   - breaks work into 1-2 day vertical slices with acceptance criteria.
2. Builder Agent
   - implements slices with typed contracts and tests.
3. Reviewer Agent
   - checks regressions, performance waterfalls, and accessibility.
4. QA Agent
   - executes E2E and verifies moderation edge cases.

### Best practices enforced (from Vercel skills)

- Eliminate fetch waterfalls with early promise starts and `Promise.all`.
- Defer heavy components with dynamic imports.
- Keep client boundaries minimal.
- Compose components instead of boolean-driven variants.

## 14) Roadmap (8 Weeks)

### Sprint 1: Foundation

- Initialize Next.js app, lint/format/test setup, CI.
- Set up DB schema and migrations.
- Seed sample people/program data.

### Sprint 2: Directory + Profiles

- Build `/people` and `/people/[slug]`.
- Add search + filters + pagination.
- Add profile links and metadata blocks.

### Sprint 3: Submission + Moderation

- Build `/join` form with validation.
- Create admin moderation pages.
- Implement approve/reject workflow.

### Sprint 4: Graph MVP

- Build `/graph` with typed nodes/edges.
- Add filters and profile side panel.
- Optimize rendering and payload boundaries.

### Sprint 5: Polish and Accessibility

- Finalize design system tokens and animation pass.
- Run accessibility audits and fix issues.
- Strengthen empty/loading/error states.

### Sprint 6: Reliability

- Add observability, alerting, and rate limiting.
- Add link validator and report flow.
- Harden security and privacy controls.

### Sprint 7: Private Beta

- Invite first ASU cohorts.
- Collect feedback and track activation funnel.
- Prioritize fixes and search improvements.

### Sprint 8: Public Launch

- Launch marketing page and onboarding copy.
- Final QA, performance pass, and production readiness checklist.

## 15) Immediate Next Tasks

1. Create repo scaffold and initial app skeleton.
2. Finalize schema and seed 30-50 sample profiles.
3. Ship `/people` with search and profile cards first.
4. Ship `/join` with moderation second.
5. Add graph view third after core directory is stable.
