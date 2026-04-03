import { redirect } from "next/navigation";

import { auth, signIn, signOut } from "@/auth";
import {
  getAdminAuthConfigStatus,
  isAllowedAdminEmail,
  normalizeAdminEmail,
} from "@/lib/server/admin-access";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const authConfig = getAdminAuthConfigStatus();
  const session = await auth();
  const adminEmail = normalizeAdminEmail(session?.user?.email);
  const redirectTo = normalizeRedirectTo(params.redirectTo);

  if (
    adminEmail !== null &&
    isAllowedAdminEmail(adminEmail, authConfig.allowedEmails)
  ) {
    redirect("/admin/submissions");
  }

  const errorMessage = getLoginErrorMessage(params.error, authConfig.missing);
  const showTestLogin = authConfig.testProviderEnabled;

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-132px)] w-full max-w-3xl items-center px-4 py-8 sm:px-6 lg:min-h-[calc(100dvh-80px)] lg:px-8">
      <section className="w-full rounded-[28px] border border-line/70 bg-surface p-6 shadow-[0_30px_80px_rgba(67,17,36,0.12)] sm:p-8">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted">
          admin access
        </p>
        <h1 className="display-heading mt-3 text-3xl leading-tight sm:text-4xl">
          sign in to moderate asunetwork.com
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          this area is only for approved moderators. sign in with an allowlisted
          account to review submissions, edit members, and manage profiles.
        </p>

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {authConfig.googleEnabled ? (
          <form
            action={async () => {
              "use server";

              await signIn("google", {
                redirectTo,
              });
            }}
            className="mt-6"
          >
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-accent-ink"
            >
              sign in with google
            </button>
          </form>
        ) : authConfig.ready ? null : (
          <div className="mt-6 rounded-2xl border border-line/70 bg-white px-4 py-4 text-sm text-muted">
            google oauth is not configured yet. add the required env vars before
            admin login will work.
          </div>
        )}

        {showTestLogin ? (
          <form action={signInWithTestProvider} className="mt-6 space-y-3 rounded-2xl border border-dashed border-line/70 bg-white px-4 py-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <p className="text-xs text-muted">
              test-only credentials login is enabled for automated verification.
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted">
                email
              </span>
              <input
                name="email"
                type="email"
                defaultValue="admin@asu.edu"
                className="h-11 rounded-xl border border-line/80 bg-white px-4 text-sm outline-none ring-accent transition focus:ring-2"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted">
                password
              </span>
              <input
                name="password"
                type="password"
                defaultValue="admin-test-password"
                className="h-11 rounded-xl border border-line/80 bg-white px-4 text-sm outline-none ring-accent transition focus:ring-2"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent-ink"
            >
              sign in with test credentials
            </button>
          </form>
        ) : null}

        {adminEmail ? (
          <div className="mt-6 rounded-2xl border border-line/70 bg-white px-4 py-4 text-sm text-muted">
            <p>currently signed in as {adminEmail}.</p>
            {!isAllowedAdminEmail(adminEmail, authConfig.allowedEmails) ? (
              <p className="mt-1 text-red-700">
                this account is not on the admin allowlist.
              </p>
            ) : null}
            <form
              action={async () => {
                "use server";

                await signOut({
                  redirectTo: "/admin/login",
                });
              }}
              className="mt-3"
            >
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-full border border-line px-4 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent-ink"
              >
                sign out
              </button>
            </form>
          </div>
        ) : null}
      </section>
    </main>
  );
}

async function signInWithTestProvider(formData: FormData) {
  "use server";

  await signIn("credentials", formData);
}

function normalizeRedirectTo(value: string | undefined) {
  const raw = value?.trim();
  if (!raw || !raw.startsWith("/admin")) {
    return "/admin/submissions";
  }

  return raw;
}

function getLoginErrorMessage(error: string | undefined, missing: string[]) {
  if (missing.length > 0) {
    return `admin auth is not configured. missing: ${missing.join(", ")}`;
  }

  if (!error) {
    return "";
  }

  if (
    error === "AccessDenied" ||
    error === "access_denied" ||
    error === "CredentialsSignin"
  ) {
    return "this account is not allowed to access admin.";
  }

  return "could not sign in right now. check the auth configuration and try again.";
}
