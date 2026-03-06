import { NextResponse } from "next/server";

import { samplePeople } from "@/data/sample-data";
import { peopleQuerySchema } from "@/lib/validation/person";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = peopleQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    program: searchParams.get("program") ?? "all",
    limit: searchParams.get("limit") ?? "50",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { q, program, limit } = parsed.data;
  const qLower = q.toLowerCase();

  const filtered = samplePeople.filter((person) => {
    const byProgram = program === "all" || person.program === program;
    const byQuery =
      q.length === 0 ||
      [person.fullName, person.headline, person.bio, person.focusAreas.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(qLower);
    return byProgram && byQuery;
  });

  return NextResponse.json({
    data: filtered.slice(0, limit),
    total: filtered.length,
  });
}

