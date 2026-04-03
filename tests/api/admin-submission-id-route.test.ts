/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminSessionMock = vi.fn();
const getDbMock = vi.fn();

vi.mock("@/lib/server/admin-auth", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("@/db/client", () => ({
  getDb: getDbMock,
}));

describe("POST /api/admin/submissions/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminSessionMock.mockReset();
    getDbMock.mockReset();
  });

  it("records reviewer email when rejecting a submission", async () => {
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

    const capturedUpdateValues: Array<Record<string, unknown>> = [];
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 17,
                payloadJson: JSON.stringify({
                  fullName: "alex",
                  asuProgram: "computer science",
                  gradYear: 2027,
                  headline: "",
                  bio: "",
                  github: "",
                  linkedin: "",
                  x: "",
                  email: "alex@asu.edu",
                  site: "",
                  avatarDataUrl: "",
                  website: "",
                  consent: true,
                }),
                status: "pending",
              },
            ],
          }),
        }),
      }),
      update: () => ({
        set: (values: Record<string, unknown>) => {
          capturedUpdateValues.push(values);
          return {
            where: () => ({
              returning: async () => [
                {
                  id: 17,
                  status: "rejected",
                  reviewedByEmail: "admin@asu.edu",
                  reviewedAt: new Date("2026-04-03T12:00:00.000Z"),
                },
              ],
            }),
          };
        },
      }),
    };
    getDbMock.mockReturnValue(db);

    const { POST } = await import("@/app/api/admin/submissions/[id]/route");
    const response = await POST(
      new Request("http://localhost/api/admin/submissions/17", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reject",
          reviewNotes: "needs more detail",
        }),
      }),
      { params: Promise.resolve({ id: "17" }) },
    );

    expect(response.status).toBe(200);
    expect(capturedUpdateValues[0]).toMatchObject({
      status: "rejected",
      reviewNotes: "needs more detail",
      reviewedByEmail: "admin@asu.edu",
    });
    await expect(response.json()).resolves.toMatchObject({
      id: 17,
      status: "rejected",
      reviewedByEmail: "admin@asu.edu",
    });
  });
});
