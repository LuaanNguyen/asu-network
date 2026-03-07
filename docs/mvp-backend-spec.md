# mvp backend spec

## scope

deliver a minimal but real backend for `asunetwork.com` that supports:

1. db-backed people reads
2. db-backed submission writes
3. local development fallback when db is not configured

## implementation plan

## 1) db client hardening

- replace eager db initialization with `getDb()` lazy accessor
- behavior:
  - if `DATABASE_URL` exists: return drizzle client
  - if missing: return `null` (no throw during app boot)

## 2) schema additions for graph and profile shape

add or ensure the following columns/tables exist:

- `people.program` (`text`, required)
- `person_connections`:
  - `source_person_id`
  - `target_person_id`
  - `created_at`
  - composite primary key on source/target

## 3) people repository

build `listPeople()` service:

- input: `{ q, program, limit }`
- db path:
  - filter published people
  - apply query + program filters
  - fetch links, skills, and connections in batch
  - map records into `Person` contract
- fallback path:
  - filter `samplePeople`
- output:
  - `{ data, total, source }`

## 4) api route wiring

- `GET /api/people`:
  - validate query with `peopleQuerySchema`
  - call `listPeople()`
  - return `source` for debugging

- `POST /api/submissions`:
  - validate body with `submissionSchema`
  - if db available: insert into `submissions`
  - if db unavailable: return non-persistent local receipt with clear source metadata

## 5) seed workflow

add `scripts/seed-mvp.ts`:

- upsert sample people
- attach links
- attach skills
- generate connections from `connectedTo`

add npm script:

- `pnpm db:seed`

## 6) acceptance criteria

- `pnpm lint` passes
- `pnpm typecheck` passes
- `GET /api/people` works with and without database
- `POST /api/submissions` stores row when database is configured
- homepage still renders even when database is absent
