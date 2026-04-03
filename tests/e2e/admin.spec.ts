import { expect, test } from "@playwright/test";

const avatarDataUrl =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9s2rYZkAAAAASUVORK5CYII=";

type AdminSubmissionRow = {
  id: number;
  status: string;
  email: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedByEmail: string;
  reviewNotes: string;
  fullName: string;
  asuProgram: string;
  headline: string;
  hasAvatar: boolean;
  payloadValid: boolean;
  payload: {
    fullName: string;
    asuProgram: string;
    gradYear: string;
    headline: string;
    bio: string;
    email: string;
    github: string;
    linkedin: string;
    x: string;
    site: string;
    avatarDataUrl: string;
  };
};

type AdminPersonRow = {
  id: number;
  slug: string;
  fullName: string;
  program: string;
  gradYear: number;
  headline: string;
  bio: string;
  avatarUrl: string;
  email: string;
  github: string;
  linkedin: string;
  site: string;
  x: string;
  isPublished: boolean;
  linkCount: number;
  updatedByEmail: string;
  createdAt: string;
};

test("admin login redirects correctly and supports approve, edit, and delete flows", async ({
  page,
}) => {
  let submissions: AdminSubmissionRow[] = [
    {
      id: 1,
      status: "pending",
      email: "alex@asu.edu",
      submittedAt: "2026-04-03T10:00:00.000Z",
      reviewedAt: null,
      reviewedByEmail: "",
      reviewNotes: "",
      fullName: "alex kim",
      asuProgram: "computer science",
      headline: "builder",
      hasAvatar: true,
      payloadValid: true,
      payload: {
        fullName: "alex kim",
        asuProgram: "computer science",
        gradYear: "2027",
        headline: "builder",
        bio: "ships things",
        email: "alex@asu.edu",
        github: "https://github.com/alex",
        linkedin: "",
        x: "",
        site: "https://alex.dev",
        avatarDataUrl,
      },
    },
  ];

  let people: AdminPersonRow[] = [
    {
      id: 5,
      slug: "alex-kim",
      fullName: "alex kim",
      program: "computer science",
      gradYear: 2027,
      headline: "builder",
      bio: "ships things",
      avatarUrl: avatarDataUrl,
      email: "alex@asu.edu",
      github: "https://github.com/alex",
      linkedin: "",
      site: "https://alex.dev",
      x: "",
      isPublished: true,
      linkCount: 2,
      updatedByEmail: "",
      createdAt: "2026-04-03T10:00:00.000Z",
    },
  ];

  await page.route("**/api/admin/submissions?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: submissions,
      }),
    });
  });

  await page.route("**/api/admin/submissions/1", async (route) => {
    submissions = submissions.map((entry) =>
      entry.id === 1
        ? {
            ...entry,
            status: "approved",
            reviewedAt: "2026-04-03T10:05:00.000Z",
            reviewedByEmail: "admin@asu.edu",
          }
        : entry,
    );

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        status: "approved",
        reviewedByEmail: "admin@asu.edu",
      }),
    });
  });

  await page.route("**/api/admin/people?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: people,
        total: people.length,
      }),
    });
  });

  await page.route("**/api/admin/people/5", async (route) => {
    if (route.request().method() === "PATCH") {
      const payload = route.request().postDataJSON() as {
        headline: string;
      };
      people = people.map((entry) =>
        entry.id === 5
          ? {
              ...entry,
              headline: payload.headline,
              updatedByEmail: "admin@asu.edu",
            }
          : entry,
      );

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 5,
          fullName: "alex kim",
          program: "computer science",
          gradYear: 2027,
          headline: payload.headline,
          bio: "ships things",
          avatarUrl: avatarDataUrl,
          isPublished: true,
          updatedByEmail: "admin@asu.edu",
          updated: true,
        }),
      });
      return;
    }

    people = [];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 5,
        deleted: true,
        deletedByEmail: "admin@asu.edu",
      }),
    });
  });

  await page.goto("/admin/submissions");

  await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/);
  await expect(
    page.getByRole("heading", { name: "sign in to moderate asunetwork.com" }),
  ).toBeVisible();

  await page.getByLabel("email").fill("admin@asu.edu");
  await page.getByLabel("password").fill("admin-test-password");
  await page.getByRole("button", { name: "sign in with test credentials" }).click();

  await expect(page).toHaveURL(/\/admin\/submissions$/);
  await expect(page.getByText("signed in as admin@asu.edu")).toBeVisible();
  await expect(page.getByText("alex kim")).toBeVisible();

  await page.getByRole("button", { name: "approve with edits" }).click();
  await expect(page.getByText("reviewed by: admin@asu.edu")).toBeVisible();

  await page.getByRole("button", { name: "load people" }).click();
  await expect(page.getByText("people in db")).toBeVisible();

  await page.getByLabel("headline").last().fill("systems builder");
  await page.getByRole("button", { name: "save" }).click();
  await expect(page.getByText("alex kim updated.")).toBeVisible();
  await expect(page.getByText("last updated by admin@asu.edu")).toBeVisible();

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.getByRole("button", { name: "remove" }).click();
  await expect(page.getByText("person removed.")).toBeVisible();
  await expect(page.getByText("no people loaded yet.")).toBeVisible();
});
