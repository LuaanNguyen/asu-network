import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { env } from "@/lib/env/server";
import {
  getAdminAuthConfigStatus,
  isAllowedAdminEmail,
  normalizeAdminEmail,
} from "@/lib/server/admin-access";

const FALLBACK_AUTH_SECRET = "admin-auth-disabled-fallback-secret";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authConfig = getAdminAuthConfigStatus();
  const token = await getToken({
    req: request,
    secret: env.AUTH_SECRET ?? FALLBACK_AUTH_SECRET,
  });
  const adminEmail = normalizeAdminEmail(
    typeof token?.email === "string" ? token.email : null,
  );
  const hasAccess = isAllowedAdminEmail(adminEmail, authConfig.allowedEmails);
  const isLoginRoute = pathname === "/admin/login";

  if (isLoginRoute) {
    if (hasAccess) {
      return NextResponse.redirect(new URL("/admin/submissions", request.url));
    }

    return NextResponse.next();
  }

  if (!authConfig.ready || adminEmail === null) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set(
      "redirectTo",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (!hasAccess) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("error", "access_denied");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
