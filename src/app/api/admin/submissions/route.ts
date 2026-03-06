import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/db/client";
import { submissions } from "@/db/schema";
import { requireAdminToken } from "@/lib/server/admin-auth";
import { submissionSchema } from "@/lib/validation/submission";

const adminSubmissionQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
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
  const parsed = adminSubmissionQuerySchema.safeParse({
    status: searchParams.get("status") ?? "pending",
    limit: searchParams.get("limit") ?? "50",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid query", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { status, limit } = parsed.data;
  const baseQuery = db
    .select({
      id: submissions.id,
      payloadJson: submissions.payloadJson,
      email: submissions.email,
      status: submissions.status,
      reviewNotes: submissions.reviewNotes,
      submittedAt: submissions.submittedAt,
      reviewedAt: submissions.reviewedAt,
    })
    .from(submissions);

  const rows =
    status === "all"
      ? await baseQuery.orderBy(desc(submissions.submittedAt)).limit(limit)
      : await baseQuery
          .where(eq(submissions.status, status))
          .orderBy(desc(submissions.submittedAt))
          .limit(limit);
  const data = rows.map((row) => {
    const payload = parseSubmissionPayload(row.payloadJson);
    const editablePayload = {
      fullName: payload?.fullName ?? "",
      asuProgram: payload?.asuProgram ?? "",
      gradYear: payload?.gradYear != null ? String(payload.gradYear) : "",
      headline: payload?.headline ?? "",
      bio: payload?.bio ?? "",
      email: payload?.email ?? row.email ?? "",
      github: payload?.github ?? "",
      linkedin: payload?.linkedin ?? "",
      site: payload?.site ?? "",
      avatarDataUrl: payload?.avatarDataUrl ?? "",
    };
    return {
      id: row.id,
      status: row.status,
      email: row.email,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      reviewNotes: row.reviewNotes ?? "",
      fullName: payload?.fullName ?? "(invalid payload)",
      asuProgram: payload?.asuProgram ?? "",
      headline: payload?.headline ?? "",
      hasAvatar: Boolean(payload?.avatarDataUrl),
      payloadValid: Boolean(payload),
      payload: editablePayload,
    };
  });

  return NextResponse.json({ data });
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
