import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getAdminAuthConfigStatusMock = vi.fn();
const isAllowedAdminEmailMock = vi.fn();
const normalizeAdminEmailMock = vi.fn();

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/server/admin-access", () => ({
  getAdminAuthConfigStatus: getAdminAuthConfigStatusMock,
  isAllowedAdminEmail: isAllowedAdminEmailMock,
  normalizeAdminEmail: normalizeAdminEmailMock,
}));

describe("requireAdminSession", () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminAuthConfigStatusMock.mockReset();
    isAllowedAdminEmailMock.mockReset();
    normalizeAdminEmailMock.mockReset();
  });

  it("returns 503 when admin auth is not configured", async () => {
    getAdminAuthConfigStatusMock.mockReturnValue({
      ready: false,
      missing: ["AUTH_SECRET"],
      allowedEmails: [],
    });

    const { requireAdminSession } = await import("@/lib/server/admin-auth");
    const result = await requireAdminSession();

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected requireAdminSession to fail");
    }

    expect(result.response.status).toBe(503);
    await expect(result.response.json()).resolves.toEqual({
      error: "admin auth is not configured",
      missing: ["AUTH_SECRET"],
    });
  });

  it("returns 401 when there is no authenticated admin session", async () => {
    getAdminAuthConfigStatusMock.mockReturnValue({
      ready: true,
      missing: [],
      allowedEmails: ["admin@asu.edu"],
    });
    authMock.mockResolvedValue(null);
    normalizeAdminEmailMock.mockReturnValue(null);

    const { requireAdminSession } = await import("@/lib/server/admin-auth");
    const result = await requireAdminSession();

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected requireAdminSession to fail");
    }

    expect(result.response.status).toBe(401);
    await expect(result.response.json()).resolves.toEqual({
      error: "unauthenticated",
    });
  });

  it("returns 403 for a signed-in but disallowed email", async () => {
    getAdminAuthConfigStatusMock.mockReturnValue({
      ready: true,
      missing: [],
      allowedEmails: ["admin@asu.edu"],
    });
    authMock.mockResolvedValue({
      user: {
        email: "outsider@asu.edu",
      },
    });
    normalizeAdminEmailMock.mockReturnValue("outsider@asu.edu");
    isAllowedAdminEmailMock.mockReturnValue(false);

    const { requireAdminSession } = await import("@/lib/server/admin-auth");
    const result = await requireAdminSession();

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected requireAdminSession to fail");
    }

    expect(result.response.status).toBe(403);
    await expect(result.response.json()).resolves.toEqual({
      error: "forbidden",
    });
  });

  it("returns the normalized admin email for allowed sessions", async () => {
    getAdminAuthConfigStatusMock.mockReturnValue({
      ready: true,
      missing: [],
      allowedEmails: ["admin@asu.edu"],
    });
    authMock.mockResolvedValue({
      user: {
        email: "admin@asu.edu",
      },
    });
    normalizeAdminEmailMock.mockReturnValue("admin@asu.edu");
    isAllowedAdminEmailMock.mockReturnValue(true);

    const { requireAdminSession } = await import("@/lib/server/admin-auth");
    const result = await requireAdminSession();

    expect(result).toEqual({
      ok: true,
      adminEmail: "admin@asu.edu",
      session: {
        user: {
          email: "admin@asu.edu",
        },
      },
    });
  });
});
