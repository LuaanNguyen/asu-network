/** @vitest-environment node */

import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminSessionMock = vi.fn();
const getDbMock = vi.fn();

vi.mock("@/lib/server/admin-auth", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("@/db/client", () => ({
  getDb: getDbMock,
}));

describe("GET /api/admin/submissions", () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminSessionMock.mockReset();
    getDbMock.mockReset();
  });

  it("passes through unauthenticated guard failures", async () => {
    requireAdminSessionMock.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
    });

    const { GET } = await import("@/app/api/admin/submissions/route");
    const response = await GET(
      new Request("http://localhost/api/admin/submissions"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "unauthenticated",
    });
  });

  it("returns 503 when the database is unavailable", async () => {
    requireAdminSessionMock.mockResolvedValue({
      ok: true,
      adminEmail: "admin@asu.edu",
      session: {
        user: {
          email: "admin@asu.edu",
        },
        expires: "2999-01-01T00:00:00.000Z",
      },
    });
    getDbMock.mockReturnValue(null);

    const { GET } = await import("@/app/api/admin/submissions/route");
    const response = await GET(
      new Request("http://localhost/api/admin/submissions"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "database is not configured",
    });
  });
});
