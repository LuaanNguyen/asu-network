import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { people } from "@/db/schema";
import { requireAdminToken } from "@/lib/server/admin-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = requireAdminToken(request);
  if (!auth.ok) {
    return auth.response;
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "database is not configured" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const personId = Number(id);
  if (!Number.isInteger(personId) || personId <= 0) {
    return NextResponse.json({ error: "invalid person id" }, { status: 400 });
  }

  const deleted = await db
    .delete(people)
    .where(eq(people.id, personId))
    .returning({
      id: people.id,
      fullName: people.fullName,
    });
  const row = deleted[0];
  if (!row) {
    return NextResponse.json({ error: "person not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    fullName: row.fullName,
    deleted: true,
  });
}
