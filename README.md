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

3. Run the app:

```bash
pnpm dev
```

Visit `http://localhost:3000`.

## Scripts

- `pnpm dev` - start local development server
- `pnpm lint` - run ESLint
- `pnpm typecheck` - run TypeScript checks
- `pnpm test` - run unit tests with coverage
- `pnpm test:e2e` - run Playwright end-to-end tests
- `pnpm db:generate` - generate Drizzle migrations
- `pnpm db:migrate` - apply migrations
- `pnpm db:studio` - open Drizzle Studio

## Planning Docs

- `docs/asu-network-master-plan.md`
- `docs/engineering-spec.md`
- `docs/mvp-backend-spec.md`
- `AGENTS.md`

## Current Routes

- `/` single-screen split app (left people list, right physics graph with avatars)
- `/people/[slug]` optional profile detail deep link
