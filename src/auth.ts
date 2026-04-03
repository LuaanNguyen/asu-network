import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";

import { env } from "@/lib/env/server";
import {
  getAdminAuthConfigStatus,
  isAllowedAdminEmail,
  normalizeAdminEmail,
} from "@/lib/server/admin-access";

const FALLBACK_AUTH_SECRET = "admin-auth-disabled-fallback-secret";

export const { auth, handlers, signIn, signOut } = NextAuth(() => {
  const authConfig = getAdminAuthConfigStatus();
  const providers = [];

  if (authConfig.googleEnabled) {
    providers.push(
      Google({
        clientId: env.AUTH_GOOGLE_ID ?? "",
        clientSecret: env.AUTH_GOOGLE_SECRET ?? "",
      }),
    );
  }

  if (authConfig.testProviderEnabled) {
    providers.push(
      Credentials({
        name: "test admin",
        credentials: {
          email: { label: "email", type: "email" },
          password: { label: "password", type: "password" },
        },
        authorize(credentials) {
          const email = normalizeAdminEmail(
            typeof credentials?.email === "string" ? credentials.email : null,
          );
          const password =
            typeof credentials?.password === "string"
              ? credentials.password
              : "";
          const expectedPassword =
            env.AUTH_TEST_PASSWORD ?? "admin-test-password";

          if (
            email === null ||
            password !== expectedPassword ||
            !isAllowedAdminEmail(email, authConfig.allowedEmails)
          ) {
            return null;
          }

          return {
            id: email,
            email,
            name: email,
          };
        },
      }),
    );
  }

  return {
    secret: env.AUTH_SECRET ?? FALLBACK_AUTH_SECRET,
    session: {
      strategy: "jwt",
    },
    trustHost: true,
    providers,
    pages: {
      signIn: "/admin/login",
      error: "/admin/login",
    },
    callbacks: {
      signIn({ user }) {
        if (!authConfig.ready) {
          return false;
        }

        return isAllowedAdminEmail(user.email, authConfig.allowedEmails);
      },
      jwt({ token, user }) {
        if (user?.email) {
          token.email = normalizeAdminEmail(user.email);
        }

        return token;
      },
      session({ session, token }) {
        if (session.user && typeof token.email === "string") {
          session.user.email = token.email;
        }

        return session;
      },
      authorized({ auth: currentAuth, request }) {
        const pathname = request.nextUrl.pathname;
        const isAdminRoute = pathname.startsWith("/admin");

        if (!isAdminRoute) {
          return true;
        }

        const isLoginRoute = pathname === "/admin/login";
        const adminEmail = normalizeAdminEmail(currentAuth?.user?.email);
        const hasAccess = isAllowedAdminEmail(adminEmail, authConfig.allowedEmails);

        if (isLoginRoute) {
          if (hasAccess) {
            return NextResponse.redirect(
              new URL("/admin/submissions", request.url),
            );
          }

          return true;
        }

        if (!adminEmail) {
          return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        if (!hasAccess) {
          const loginUrl = new URL("/admin/login", request.url);
          loginUrl.searchParams.set("error", "access_denied");
          return NextResponse.redirect(loginUrl);
        }

        return true;
      },
    },
  };
});
