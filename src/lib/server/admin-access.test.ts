import {
  getAdminAuthConfigStatus,
  isAllowedAdminEmail,
  isTestAdminProviderEnabled,
  normalizeAdminEmail,
  parseAdminAllowedEmails,
} from "@/lib/server/admin-access";

describe("admin access helpers", () => {
  it("normalizes and deduplicates admin emails", () => {
    expect(
      parseAdminAllowedEmails("  ADMIN@asu.edu, admin@asu.edu, second@asu.edu ,, "),
    ).toEqual(["admin@asu.edu", "second@asu.edu"]);
  });

  it("normalizes individual email values", () => {
    expect(normalizeAdminEmail("  ADMIN@asu.edu ")).toBe("admin@asu.edu");
    expect(normalizeAdminEmail("   ")).toBeNull();
  });

  it("reports missing required production auth configuration", () => {
    expect(
      getAdminAuthConfigStatus({
        nodeEnv: "production",
        authSecret: "",
        authGoogleId: "",
        authGoogleSecret: "",
        adminAllowedEmails: "",
        authEnableTestProvider: "0",
      }),
    ).toEqual({
      ready: false,
      allowedEmails: [],
      missing: [
        "AUTH_SECRET",
        "AUTH_GOOGLE_ID",
        "AUTH_GOOGLE_SECRET",
        "ADMIN_ALLOWED_EMAILS",
      ],
      googleEnabled: false,
      testProviderEnabled: false,
    });
  });

  it("allows test auth without google oauth credentials", () => {
    expect(
      getAdminAuthConfigStatus({
        nodeEnv: "test",
        authSecret: "test-auth-secret",
        authGoogleId: "",
        authGoogleSecret: "",
        adminAllowedEmails: "admin@asu.edu",
      }),
    ).toEqual({
      ready: true,
      allowedEmails: ["admin@asu.edu"],
      missing: [],
      googleEnabled: false,
      testProviderEnabled: true,
    });
  });

  it("checks admin membership against the normalized allowlist", () => {
    expect(
      isAllowedAdminEmail("ADMIN@asu.edu", ["admin@asu.edu", "second@asu.edu"]),
    ).toBe(true);
    expect(isAllowedAdminEmail("outsider@asu.edu", ["admin@asu.edu"])).toBe(false);
  });

  it("enables the test provider in test mode or when explicitly flagged", () => {
    expect(isTestAdminProviderEnabled({ nodeEnv: "test" })).toBe(true);
    expect(
      isTestAdminProviderEnabled({
        nodeEnv: "development",
        authEnableTestProvider: "1",
      }),
    ).toBe(true);
    expect(
      isTestAdminProviderEnabled({
        nodeEnv: "development",
        authEnableTestProvider: "0",
      }),
    ).toBe(false);
  });
});
