import { env } from "@/lib/env/server";

type AdminAccessEnv = {
  nodeEnv?: string;
  authSecret?: string;
  authGoogleId?: string;
  authGoogleSecret?: string;
  adminAllowedEmails?: string;
  authEnableTestProvider?: string;
};

type AdminAuthConfigStatus = {
  ready: boolean;
  allowedEmails: string[];
  missing: string[];
  googleEnabled: boolean;
  testProviderEnabled: boolean;
};

const FALLBACK_TEST_PROVIDER_FLAG = new Set(["1", "true"]);

export function normalizeAdminEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function parseAdminAllowedEmails(value: string | null | undefined) {
  return Array.from(
    new Set(
      value
        ?.split(",")
        .map((entry) => normalizeAdminEmail(entry))
        .filter((entry): entry is string => entry !== null) ?? [],
    ),
  );
}

export function isTestAdminProviderEnabled(
  input: Pick<AdminAccessEnv, "nodeEnv" | "authEnableTestProvider"> = {
    nodeEnv: env.NODE_ENV,
    authEnableTestProvider: env.AUTH_ENABLE_TEST_PROVIDER,
  },
) {
  if (input.nodeEnv === "test") {
    return true;
  }

  const raw = input.authEnableTestProvider?.trim().toLowerCase() ?? "";
  return FALLBACK_TEST_PROVIDER_FLAG.has(raw);
}

export function getAdminAuthConfigStatus(
  input: AdminAccessEnv = {
    nodeEnv: env.NODE_ENV,
    authSecret: env.AUTH_SECRET,
    authGoogleId: env.AUTH_GOOGLE_ID,
    authGoogleSecret: env.AUTH_GOOGLE_SECRET,
    adminAllowedEmails: env.ADMIN_ALLOWED_EMAILS,
    authEnableTestProvider: env.AUTH_ENABLE_TEST_PROVIDER,
  },
): AdminAuthConfigStatus {
  const missing: string[] = [];
  const hasAuthSecret = Boolean(input.authSecret?.trim());
  const googleEnabled = Boolean(
    input.authGoogleId?.trim() && input.authGoogleSecret?.trim(),
  );
  const testProviderEnabled = isTestAdminProviderEnabled(input);
  const allowedEmails = parseAdminAllowedEmails(input.adminAllowedEmails);

  if (!hasAuthSecret) {
    missing.push("AUTH_SECRET");
  }
  if (!googleEnabled && !testProviderEnabled) {
    missing.push("AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET");
  }
  if (allowedEmails.length === 0) {
    missing.push("ADMIN_ALLOWED_EMAILS");
  }

  return {
    ready: missing.length === 0,
    allowedEmails,
    missing,
    googleEnabled,
    testProviderEnabled,
  };
}

export function isAllowedAdminEmail(
  email: string | null | undefined,
  allowedEmails = getAdminAuthConfigStatus().allowedEmails,
) {
  const normalized = normalizeAdminEmail(email);
  return normalized !== null && allowedEmails.includes(normalized);
}
