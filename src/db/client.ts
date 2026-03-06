import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env/server";
import * as schema from "@/db/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __asuDb__: Database | undefined;
}

function createDb() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to initialize the database client.");
  }

  const sql = postgres(env.DATABASE_URL, {
    prepare: false,
    max: 5,
  });

  return drizzle(sql, { schema });
}

export const db = globalThis.__asuDb__ ?? createDb();

if (env.NODE_ENV !== "production") {
  globalThis.__asuDb__ = db;
}
