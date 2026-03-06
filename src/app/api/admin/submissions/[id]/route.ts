import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/db/client";
import { links, people, submissions } from "@/db/schema";
import { requireAdminToken } from "@/lib/server/admin-auth";
import { submissionSchema } from "@/lib/validation/submission";

const moderationSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNotes: z.string().trim().max(1000).optional().default(""),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
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
  const submissionId = Number(id);
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    return NextResponse.json({ error: "invalid submission id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const parsedBody = moderationSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "invalid moderation payload", issues: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  const submissionRows = await db
    .select({
      id: submissions.id,
      payloadJson: submissions.payloadJson,
      status: submissions.status,
    })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);
  const submission = submissionRows[0];

  if (!submission) {
    return NextResponse.json({ error: "submission not found" }, { status: 404 });
  }

  if (submission.status !== "pending") {
    return NextResponse.json(
      { error: `submission already ${submission.status}` },
      { status: 409 },
    );
  }

  const { action, reviewNotes } = parsedBody.data;
  const reviewedAt = new Date();

  if (action === "reject") {
    const updated = await db
      .update(submissions)
      .set({
        status: "rejected",
        reviewNotes,
        reviewedAt,
      })
      .where(eq(submissions.id, submissionId))
      .returning({
        id: submissions.id,
        status: submissions.status,
        reviewedAt: submissions.reviewedAt,
      });
    const row = updated[0];

    return NextResponse.json({
      id: row?.id ?? submissionId,
      status: row?.status ?? "rejected",
      reviewedAt: row?.reviewedAt?.toISOString() ?? reviewedAt.toISOString(),
    });
  }

  const parsedSubmissionPayload = parseSubmissionPayload(submission.payloadJson);
  if (!parsedSubmissionPayload) {
    return NextResponse.json(
      { error: "invalid submission payload; cannot approve" },
      { status: 422 },
    );
  }

  try {
    const result = await db.transaction(async (tx) => {
      const baseSlug = toSlug(parsedSubmissionPayload.fullName);
      let slug = baseSlug;
      let attempt = 2;

      while (true) {
        const existing = await tx
          .select({ id: people.id })
          .from(people)
          .where(eq(people.slug, slug))
          .limit(1);
        if (!existing[0]) {
          break;
        }
        slug = `${baseSlug}-${attempt}`;
        attempt += 1;
      }

      const avatarUrl =
        parsedSubmissionPayload.avatarDataUrl?.trim() ||
        `https://api.dicebear.com/9.x/personas/png?seed=${encodeURIComponent(
          parsedSubmissionPayload.fullName,
        )}`;
      const headline = toNonEmptyString(
        parsedSubmissionPayload.headline,
        `${parsedSubmissionPayload.asuProgram} @ asu`,
      );
      const bio = toNonEmptyString(
        parsedSubmissionPayload.bio,
        `${parsedSubmissionPayload.fullName} is part of the asu.network builder community.`,
      );

      const insertedPeople = await tx
        .insert(people)
        .values({
          slug,
          fullName: parsedSubmissionPayload.fullName,
          headline,
          bio,
          program: parsedSubmissionPayload.asuProgram,
          gradYear: parsedSubmissionPayload.gradYear,
          location: "tempe, az",
          avatarUrl,
          isPublished: true,
        })
        .returning({
          id: people.id,
          slug: people.slug,
        });
      const person = insertedPeople[0];
      if (!person) {
        throw new Error("failed to create approved person");
      }

      const profileLinks = [
        parsedSubmissionPayload.github
          ? {
              personId: person.id,
              type: "github" as const,
              url: parsedSubmissionPayload.github,
              isPublic: true,
            }
          : null,
        parsedSubmissionPayload.linkedin
          ? {
              personId: person.id,
              type: "linkedin" as const,
              url: parsedSubmissionPayload.linkedin,
              isPublic: true,
            }
          : null,
        parsedSubmissionPayload.site
          ? {
              personId: person.id,
              type: "site" as const,
              url: parsedSubmissionPayload.site,
              isPublic: true,
            }
          : null,
        {
          personId: person.id,
          type: "email" as const,
          url: `mailto:${parsedSubmissionPayload.email}`,
          isPublic: true,
        },
      ].filter((entry) => entry !== null);

      if (profileLinks.length > 0) {
        await tx.insert(links).values(profileLinks);
      }

      const updatedSubmission = await tx
        .update(submissions)
        .set({
          status: "approved",
          reviewNotes,
          reviewedAt,
        })
        .where(
          and(
            eq(submissions.id, submissionId),
            eq(submissions.status, "pending"),
          ),
        )
        .returning({
          id: submissions.id,
          status: submissions.status,
          reviewedAt: submissions.reviewedAt,
        });
      const moderationResult = updatedSubmission[0];
      if (!moderationResult) {
        throw new Error("submission status update failed");
      }

      return {
        personId: person.id,
        personSlug: person.slug,
        submissionId: moderationResult.id,
        status: moderationResult.status,
        reviewedAt: moderationResult.reviewedAt?.toISOString() ?? reviewedAt.toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("failed to approve submission", error);
    return NextResponse.json(
      { error: "could not approve submission right now" },
      { status: 500 },
    );
  }
}

function parseSubmissionPayload(payloadJson: string) {
  try {
    const parsed = JSON.parse(payloadJson);
    const result = submissionSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function toSlug(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug.length > 0 ? slug : "member";
}

function toNonEmptyString(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}
