import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/db/client";
import { links, people } from "@/db/schema";
import { requireAdminToken } from "@/lib/server/admin-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const SUPPORTED_DATA_IMAGE_PATTERN =
  /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-zA-Z0-9+/=]+$/i;

const adminPersonUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  asuProgram: z.string().trim().min(2).max(120),
  gradYear: z
    .union([
      z.coerce.number().int().min(2000).max(2100),
      z.literal(""),
      z.null(),
    ])
    .transform((value) => (value === "" || value === null ? null : Number(value))),
  headline: z.string().trim().max(180).optional().or(z.literal("")),
  bio: z.string().trim().max(1400).optional().or(z.literal("")),
  email: z.string().trim().email(),
  github: z.string().trim().url().optional().or(z.literal("")),
  linkedin: z.string().trim().url().optional().or(z.literal("")),
  site: z.string().trim().url().optional().or(z.literal("")),
  x: z.string().trim().url().optional().or(z.literal("")),
  avatarDataUrl: z
    .string()
    .trim()
    .max(2_800_000)
    .regex(
      SUPPORTED_DATA_IMAGE_PATTERN,
      "unsupported image format. use png, jpg, webp, gif, or avif.",
    )
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().trim().url().optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: RouteContext) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const parsedBody = adminPersonUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "invalid person payload", issues: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsedBody.data;
  const normalizedFullName = normalizeWhitespace(payload.fullName);
  const normalizedProgram = normalizeWhitespace(payload.asuProgram);

  try {
    const result = await db.transaction(async (tx) => {
      const existingRows = await tx
        .select({
          id: people.id,
          avatarUrl: people.avatarUrl,
          isPublished: people.isPublished,
        })
        .from(people)
        .where(eq(people.id, personId))
        .limit(1);
      const existing = existingRows[0];
      if (!existing) {
        throw new Error("person not found");
      }

      const avatarCandidate =
        payload.avatarDataUrl?.trim() ||
        payload.avatarUrl?.trim() ||
        existing.avatarUrl?.trim() ||
        "";
      const avatarUrl = toSupportedAvatarUrl(avatarCandidate, normalizedFullName);
      const headline = toNonEmptyString(
        payload.headline,
        `${normalizedProgram} @ asu`,
      );
      const bio = toNonEmptyString(
        payload.bio,
        `${normalizedFullName} is part of the asunetwork.com builder community.`,
      );

      const updatedRows = await tx
        .update(people)
        .set({
          fullName: normalizedFullName,
          program: normalizedProgram,
          gradYear: payload.gradYear,
          headline,
          bio,
          avatarUrl,
          isPublished: payload.isPublished ?? existing.isPublished,
          updatedAt: new Date(),
        })
        .where(eq(people.id, personId))
        .returning({
          id: people.id,
          fullName: people.fullName,
          program: people.program,
          gradYear: people.gradYear,
          headline: people.headline,
          bio: people.bio,
          avatarUrl: people.avatarUrl,
          isPublished: people.isPublished,
        });
      const updated = updatedRows[0];
      if (!updated) {
        throw new Error("person not found");
      }

      await tx.delete(links).where(eq(links.personId, personId));

      const profileLinks = [
        payload.github
          ? {
              personId,
              type: "github" as const,
              url: normalizeOptionalUrl(payload.github),
              isPublic: true,
            }
          : null,
        payload.linkedin
          ? {
              personId,
              type: "linkedin" as const,
              url: normalizeOptionalUrl(payload.linkedin),
              isPublic: true,
            }
          : null,
        payload.site
          ? {
              personId,
              type: "site" as const,
              url: normalizeOptionalUrl(payload.site),
              isPublic: true,
            }
          : null,
        payload.x
          ? {
              personId,
              type: "x" as const,
              url: normalizeOptionalUrl(payload.x),
              isPublic: true,
            }
          : null,
        {
          personId,
          type: "email" as const,
          url: `mailto:${payload.email.trim().toLowerCase()}`,
          isPublic: true,
        },
      ].filter((entry) => entry !== null);

      if (profileLinks.length > 0) {
        await tx.insert(links).values(profileLinks);
      }

      return updated;
    });

    return NextResponse.json({
      id: result.id,
      fullName: result.fullName,
      program: result.program,
      gradYear: result.gradYear,
      headline: result.headline,
      bio: result.bio,
      avatarUrl: result.avatarUrl,
      isPublished: result.isPublished,
      updated: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "person not found") {
      return NextResponse.json({ error: "person not found" }, { status: 404 });
    }
    console.error("failed to update person", error);
    return NextResponse.json(
      { error: "could not update person right now" },
      { status: 500 },
    );
  }
}

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

function toNonEmptyString(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeOptionalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return candidate;
    }
    const host = url.host.toLowerCase();
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/g, "");
    return `${url.protocol}//${host}${path}${url.search}${url.hash}`;
  } catch {
    return candidate;
  }
}

function toSupportedAvatarUrl(candidate: string, fullName: string) {
  const fallback = `https://api.dicebear.com/9.x/personas/png?seed=${encodeURIComponent(
    fullName,
  )}`;

  const trimmed = candidate.trim();
  if (!trimmed) {
    return fallback;
  }

  if (/^data:image\//i.test(trimmed)) {
    return SUPPORTED_DATA_IMAGE_PATTERN.test(trimmed) ? trimmed : fallback;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return trimmed;
    }
  } catch {
    return fallback;
  }

  return fallback;
}
