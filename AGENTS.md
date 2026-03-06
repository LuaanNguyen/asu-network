# AGENTS.md

Project-level guidance for Cursor/Codex agents building `asu.network`.

## Mission

Build a fast, accessible, modern talent network for ASU with:

- searchable people directory
- rich profile pages
- moderated profile submissions
- graph-based relationship exploration

## Required Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + typed design tokens
- PostgreSQL + Drizzle ORM
- Zod for API validation
- Vitest + Playwright

## Product Constraints

- Public data only with explicit user consent.
- Admin approval before public profile publication.
- Keep initial scope focused on discovery and connection.

## Architecture Rules

1. Prefer Server Components by default.
2. Use Client Components only where interaction needs browser APIs.
3. Keep API contracts typed end-to-end (`zod` + inferred TS types).
4. Dynamic import heavy graph components to reduce initial bundle.
5. Separate read and write paths for moderation workflows.

## UI Rules

1. Avoid generic dashboard visuals and default font stacks.
2. Use explicit typography and color tokens in `styles/tokens.css`.
3. Build compound components for complex sections.
4. Do not create monolithic components with many boolean props.
5. Ensure keyboard navigation and visible focus states everywhere.

## Performance Rules

1. Eliminate waterfalls: start independent async work early, then await together.
2. Cache read-heavy server functions where safe.
3. Keep JS payload low on search and profile routes.
4. Prefer SQL filtering and pagination over client-side large list processing.

## Data Quality Rules

1. Validate all external links.
2. Sanitize user-submitted content.
3. Track moderation decisions with timestamp and reviewer ID.
4. Keep profile completeness score and show missing fields to admins.

## Testing Requirements

- Unit tests for schemas, ranking, and utility transforms.
- Integration tests for API routes and DB operations.
- E2E tests for:
  - search -> profile flow
  - join form submit
  - admin approve/reject path
  - graph panel interaction

## Definition of Done (Per PR)

1. Feature behavior implemented with acceptance criteria met.
2. Type checks, tests, and lint pass.
3. Accessibility checks pass for changed UI.
4. Performance impact evaluated for changed routes.
5. Documentation updated when contracts or behavior change.

## Suggested Work Order

1. Schema and seed data
2. Directory and profile pages
3. Submission and moderation
4. Graph explorer
5. Polish and launch hardening
