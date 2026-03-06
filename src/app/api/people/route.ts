import { NextResponse } from "next/server";

import { listPeople } from "@/lib/server/people-repository";
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

  const result = await listPeople(parsed.data);

  return NextResponse.json({
    data: result.data,
    total: result.total,
    source: result.source,
  });
}
