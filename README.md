# asu.network

`asu.network` is a modern web application to showcase ASU talent across engineering, business, and operator communities.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Drizzle ORM + PostgreSQL
- Zod validation
- Vitest + Playwright

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

- `DATABASE_URL`
- `RATE_LIMIT_SALT` (used for hashed ip rate-limiting)
- `ADMIN_TOKEN` (required for admin moderation endpoints/page)

3. Run the app:

```bash
pnpm dev
```

Visit `http://localhost:3000`.

4. Optional: seed local database for API-backed people data:

```bash
pnpm db:migrate
pnpm db:seed
```

## Scripts

- `pnpm dev` - start local development server
- `pnpm lint` - run ESLint
- `pnpm typecheck` - run TypeScript checks
- `pnpm test` - run unit tests with coverage
- `pnpm test:e2e` - run Playwright end-to-end tests
- `pnpm db:generate` - generate Drizzle migrations
- `pnpm db:migrate` - apply migrations
- `pnpm db:studio` - open Drizzle Studio
- `pnpm db:seed` - seed MVP people, links, skills, and connections

## Planning Docs

- `docs/asu-network-master-plan.md`
- `docs/engineering-spec.md`
- `docs/mvp-backend-spec.md`
- `AGENTS.md`

## Current Routes

- `/` single-screen split app (left people list, right physics graph with avatars)
- `/people/[slug]` optional profile detail deep link
- `/admin/submissions` admin moderation page (requires `ADMIN_TOKEN`)
