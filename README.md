# asu.network

asu.network is a one-page talent network for asu builders.
it combines a searchable people list, a physics graph, and a moderated join flow.

## stack

- next.js (app router) + typescript
- tailwind css v4
- drizzle orm + postgres
- zod validation
- vitest + playwright

## local setup

1. install dependencies

```bash
pnpm install
```

2. create env file

```bash
cp .env.example .env.local
```

3. set required env vars in `.env.local`

- `DATABASE_URL`
- `RATE_LIMIT_SALT`
- `ADMIN_TOKEN`
- `NEXT_PUBLIC_SITE_URL`

4. run migrations and optional seed

```bash
pnpm db:migrate
pnpm db:seed
```

5. start dev server

```bash
pnpm dev
```

open `http://localhost:3000`.

## deploy (vercel)

1. import the repo in vercel
2. set production env vars (`DATABASE_URL`, `RATE_LIMIT_SALT`, `ADMIN_TOKEN`, `NEXT_PUBLIC_SITE_URL`)
3. deploy `main`
4. run production migrations:

```bash
DATABASE_URL="your-prod-db-url" pnpm db:migrate
```

## contribute

1. create a branch from `main`
2. make focused changes
3. run checks before opening pr:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

4. open a pr with a short summary + screenshots for ui changes

## scripts

- `pnpm dev` - start local dev server
- `pnpm build` - production build
- `pnpm lint` - eslint
- `pnpm typecheck` - typescript checks
- `pnpm test` - unit tests
- `pnpm test:e2e` - e2e tests
- `pnpm db:generate` - generate drizzle migration
- `pnpm db:migrate` - apply migrations
- `pnpm db:seed` - seed sample network data
- `pnpm db:studio` - open drizzle studio

## routes

- `/` main one-screen experience
- `/people/[slug]` profile detail
- `/admin/submissions` admin moderation view (requires `ADMIN_TOKEN`)
