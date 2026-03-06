import { NextResponse } from "next/server";

import { env } from "@/lib/env/server";

type AdminAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

export function requireAdminToken(request: Request): AdminAuthResult {
  if (!env.ADMIN_TOKEN) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "admin token is not configured" },
        { status: 503 },
      ),
    };
  }

  const providedToken = request.headers.get("x-admin-token")?.trim();
  if (!providedToken || providedToken !== env.ADMIN_TOKEN) {
    return {
      ok: false,
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true };
}
