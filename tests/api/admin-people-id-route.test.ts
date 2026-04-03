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

describe("/api/admin/people/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminSessionMock.mockReset();
    getDbMock.mockReset();
  });

  it("records the last editor email when updating a person", async () => {
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
    const tx = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: 5,
                avatarUrl: "https://avatars.example/alex.png",
                isPublished: true,
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
                  id: 5,
                  fullName: "alex kim",
                  program: "computer science",
                  gradYear: 2027,
                  headline: "builder",
                  bio: "ships things",
                  avatarUrl: "https://avatars.example/alex.png",
                  isPublished: true,
                  updatedByEmail: "admin@asu.edu",
                },
              ],
            }),
          };
        },
      }),
      delete: () => ({
        where: async () => undefined,
      }),
      insert: () => ({
        values: async () => undefined,
      }),
    };

    getDbMock.mockReturnValue({
      transaction: async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback(tx),
    });

    const { PATCH } = await import("@/app/api/admin/people/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/people/5", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "alex kim",
          asuProgram: "computer science",
          gradYear: 2027,
          headline: "builder",
          bio: "ships things",
          email: "alex@asu.edu",
          github: "https://github.com/alex",
          linkedin: "",
          site: "",
          x: "",
          avatarDataUrl: "",
          avatarUrl: "https://avatars.example/alex.png",
          isPublished: true,
        }),
      }),
      { params: Promise.resolve({ id: "5" }) },
    );

    expect(response.status).toBe(200);
    expect(capturedUpdateValues[0]).toMatchObject({
      updatedByEmail: "admin@asu.edu",
    });
    await expect(response.json()).resolves.toMatchObject({
      id: 5,
      updatedByEmail: "admin@asu.edu",
      updated: true,
    });
  });

  it("soft deletes a person and records the deleting admin", async () => {
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

    let capturedDeleteValues: Record<string, unknown> | null = null;
    getDbMock.mockReturnValue({
      update: () => ({
        set: (values: Record<string, unknown>) => {
          capturedDeleteValues = values;
          return {
            where: () => ({
              returning: async () => [
                {
                  id: 5,
                  fullName: "alex kim",
                  deletedAt: new Date("2026-04-03T12:00:00.000Z"),
                  deletedByEmail: "admin@asu.edu",
                },
              ],
            }),
          };
        },
      }),
    });

    const { DELETE } = await import("@/app/api/admin/people/[id]/route");
    const response = await DELETE(
      new Request("http://localhost/api/admin/people/5", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "5" }) },
    );

    expect(response.status).toBe(200);
    expect(capturedDeleteValues).toMatchObject({
      isPublished: false,
      deletedByEmail: "admin@asu.edu",
      updatedByEmail: "admin@asu.edu",
    });
    await expect(response.json()).resolves.toMatchObject({
      id: 5,
      deleted: true,
      deletedByEmail: "admin@asu.edu",
    });
  });
});
