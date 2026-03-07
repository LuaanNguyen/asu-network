import { desc, ilike, inArray, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/db/client";
import { links, people } from "@/db/schema";
import { requireAdminToken } from "@/lib/server/admin-auth";

const adminPeopleQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  limit: z.coerce.number().int().min(1).max(300).default(200),
});

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const parsed = adminPeopleQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    limit: searchParams.get("limit") ?? "200",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid query", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { q, limit } = parsed.data;
  const term = q.trim();
  const where =
    term.length > 0
      ? or(
          ilike(people.fullName, `%${term}%`),
          ilike(people.program, `%${term}%`),
          ilike(people.headline, `%${term}%`),
        )
      : undefined;

  const personRows = await db
    .select({
      id: people.id,
      slug: people.slug,
      fullName: people.fullName,
      program: people.program,
      gradYear: people.gradYear,
      headline: people.headline,
      bio: people.bio,
      avatarUrl: people.avatarUrl,
      isPublished: people.isPublished,
      createdAt: people.createdAt,
    })
    .from(people)
    .where(where)
    .orderBy(desc(people.createdAt))
    .limit(limit);

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(people)
    .where(where);

  const personIds = personRows.map((row) => row.id);
  const linkRows =
    personIds.length > 0
      ? await db
          .select({
            personId: links.personId,
            type: links.type,
            url: links.url,
          })
          .from(links)
          .where(inArray(links.personId, personIds))
      : [];
  const emailByPerson = new Map<number, string>();
  const githubByPerson = new Map<number, string>();
  const linkedinByPerson = new Map<number, string>();
  const siteByPerson = new Map<number, string>();
  const xByPerson = new Map<number, string>();
  const linkCountByPerson = new Map<number, number>();

  for (const row of linkRows) {
    linkCountByPerson.set(
      row.personId,
      (linkCountByPerson.get(row.personId) ?? 0) + 1,
    );
    if (row.type !== "email") {
      if (row.type === "github" && !githubByPerson.has(row.personId)) {
        githubByPerson.set(row.personId, row.url.trim());
      }
      if (row.type === "linkedin" && !linkedinByPerson.has(row.personId)) {
        linkedinByPerson.set(row.personId, row.url.trim());
      }
      if (row.type === "site" && !siteByPerson.has(row.personId)) {
        siteByPerson.set(row.personId, row.url.trim());
      }
      if (row.type === "x" && !xByPerson.has(row.personId)) {
        xByPerson.set(row.personId, row.url.trim());
      }
      continue;
    }
    if (!emailByPerson.has(row.personId)) {
      emailByPerson.set(
        row.personId,
        row.url.replace(/^mailto:/i, "").trim().toLowerCase(),
      );
    }
  }

  return NextResponse.json({
    data: personRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      fullName: row.fullName,
      program: row.program,
      gradYear: row.gradYear,
      headline: row.headline,
      bio: row.bio,
      avatarUrl: row.avatarUrl ?? "",
      isPublished: row.isPublished,
      email: emailByPerson.get(row.id) ?? "",
      github: githubByPerson.get(row.id) ?? "",
      linkedin: linkedinByPerson.get(row.id) ?? "",
      site: siteByPerson.get(row.id) ?? "",
      x: xByPerson.get(row.id) ?? "",
      linkCount: linkCountByPerson.get(row.id) ?? 0,
      createdAt: row.createdAt?.toISOString() ?? null,
    })),
    total: Number(countRows[0]?.count ?? personRows.length),
  });
}
