import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env/server";
import * as schema from "@/db/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __asuDb__: Database | null | undefined;
}

function createDb() {
  const sql = postgres(env.DATABASE_URL as string, {
    prepare: false,
    max: 5,
  });

  return drizzle(sql, { schema });
}

export function getDb() {
  if (globalThis.__asuDb__ !== undefined) {
    return globalThis.__asuDb__;
  }

  if (!env.DATABASE_URL) {
    globalThis.__asuDb__ = null;
    return null;
  }

  const db = createDb();
  if (env.NODE_ENV !== "production") {
    globalThis.__asuDb__ = db;
  }
  return db;
}
