import type { Session } from "next-auth";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getAdminAuthConfigStatus,
  isAllowedAdminEmail,
  normalizeAdminEmail,
} from "@/lib/server/admin-access";

type AdminSessionResult =
  | {
      ok: true;
      adminEmail: string;
      session: Session;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireAdminSession(): Promise<AdminSessionResult> {
  const authConfig = getAdminAuthConfigStatus();
  if (!authConfig.ready) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "admin auth is not configured",
          missing: authConfig.missing,
        },
        { status: 503 },
      ),
    };
  }

  const session = await auth();
  const adminEmail = normalizeAdminEmail(session?.user?.email);

  if (!session || adminEmail === null) {
    return {
      ok: false,
      response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
    };
  }

  if (!isAllowedAdminEmail(adminEmail, authConfig.allowedEmails)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    adminEmail,
    session,
  };
}
