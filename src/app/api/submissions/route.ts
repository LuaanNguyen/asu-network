import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { submissions } from "@/db/schema";
import { submissionSchema } from "@/lib/validation/submission";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = submissionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      {
        id: crypto.randomUUID(),
        status: "received",
        source: "local",
        submittedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }

  try {
    const inserted = await db
      .insert(submissions)
      .values({
        payloadJson: JSON.stringify(parsed.data),
      })
      .returning({
        id: submissions.id,
        status: submissions.status,
        submittedAt: submissions.submittedAt,
      });

    const row = inserted[0];
    return NextResponse.json(
      {
        id: row?.id ?? crypto.randomUUID(),
        status: row?.status ?? "pending",
        source: "db",
        submittedAt: row?.submittedAt?.toISOString() ?? new Date().toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("failed to persist submission", error);
    return NextResponse.json(
      { error: "Could not store submission right now." },
      { status: 500 },
    );
  }
}
