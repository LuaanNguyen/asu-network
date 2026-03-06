# asu.network engineering spec

## 1. purpose

`asu.network` is a one-screen talent network for asu students and alumni builders.
the product combines:

- a searchable people list
- a force-directed relationship graph
- a moderated submission intake flow

the core objective is simple: help users discover and contact high-signal people quickly.

## 2. product constraints

- one-page primary experience (`/`)
- lower-case visual language and editorial tone
- left panel: people list and links
- right panel: force graph with avatar nodes
- public, read-only browsing with admin-moderated writes

## 3. architecture

### frontend

- framework: next.js app router + react + typescript
- styling: tailwind css v4 + design tokens
- graph: `react-force-graph-2d` + `d3-force-3d`
- rendering:
  - server components by default
  - client components for graph, search interaction, and modal form

### backend

- runtime: next.js route handlers (`/api/*`)
- validation: zod at request boundaries
- data: postgres via drizzle orm
- persistence:
  - `people` (published profile records)
  - `links` (github/linkedin/email/site)
  - `skills` + `person_skills`
  - `person_connections` (graph edges)
  - `submissions` (raw intake payload + moderation status)

### fallback strategy

when `DATABASE_URL` is unavailable or db calls fail in development, read endpoints may fall back to `samplePeople` to keep local iteration unblocked.

## 4. data contracts

### public person payload

the ui consumes `Person` from `src/lib/validation/person.ts`.

- `id: string`
- `slug: string`
- `fullName: string`
- `avatarUrl: string`
- `headline: string`
- `bio: string`
- `program: string`
- `gradYear: number`
- `focusAreas: string[]`
- `location: string`
- `links: { type, label, href }[]`
- `connectedTo: string[]`

### api endpoints

- `GET /api/people`
  - query: `q`, `program`, `limit`
  - returns: `{ data: Person[], total: number, source: "db" | "sample" }`
- `POST /api/submissions`
  - body validated by `submissionSchema`
  - persists `payload_json` and status `pending`
  - returns submission receipt

## 5. quality bar

- all route inputs validated with zod
- no unbounded queries on list endpoints
- stable fallbacks in local dev
- lint and typecheck must pass before commit
- every behavior change committed in small atomic commits

## 6. observability and ops

- structured server logs for db fallback events
- capture endpoint failures with response status and message
- future:
  - sentry for runtime exceptions
  - analytics for discover/search/contact funnel

## 7. security baseline

- moderated publishing only (`is_published`)
- sanitize and validate all inbound data
- never trust client-provided ids
- add rate limiting and honeypot in next phase

## 8. delivery workflow

- trunk-first commits with clear scopes
- each feature slice includes:
  - code changes
  - validation checks
  - docs updates when architecture changes
- current recommended sequence:
  - docs/spec
  - mvp backend persistence
  - admin moderation
  - production hardening
