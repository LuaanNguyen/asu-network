import { NextResponse } from "next/server";

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

  return NextResponse.json(
    {
      id: crypto.randomUUID(),
      status: "received",
      submittedAt: new Date().toISOString(),
    },
    { status: 201 },
  );
}

