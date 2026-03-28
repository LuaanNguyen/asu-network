import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const avatarDataUrl =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9s2rYZkAAAAASUVORK5CYII=";

const peopleFixture = [
  {
    id: "maya",
    slug: "maya-chen",
    fullName: "maya chen",
    avatarUrl: avatarDataUrl,
    headline: "distributed systems builder",
    bio: "builds infra for student teams",
    program: "computer science",
    gradYear: 2027,
    focusAreas: ["systems", "ai"],
    location: "tempe, az",
    links: [
      { type: "site", label: "site", href: "https://maya.dev" },
      { type: "github", label: "github", href: "https://github.com/maya" },
      { type: "linkedin", label: "linkedin", href: "https://linkedin.com/in/maya" },
      { type: "x", label: "x", href: "https://x.com/maya" },
      { type: "email", label: "email", href: "mailto:maya@asu.edu" },
    ],
    connectedTo: ["alex"],
    workedAt: [{ name: "google", logoUrl: "https://logo.clearbit.com/google.com" }],
  },
  {
    id: "alex",
    slug: "alex-kim",
    fullName: "alex kim",
    avatarUrl: avatarDataUrl,
    headline: "product-minded engineer",
    bio: "ships products and growth experiments",
    program: "informatics",
    gradYear: 2026,
    focusAreas: ["product", "growth"],
    location: "phoenix, az",
    links: [
      { type: "site", label: "site", href: "https://alex.dev" },
      { type: "github", label: "github", href: "https://github.com/alex" },
    ],
    connectedTo: ["maya"],
    workedAt: [],
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/people?limit=200", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: peopleFixture,
        total: peopleFixture.length,
        source: "db",
      }),
    });
  });
});

test("loads home page hero and csv controls", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "welcome to asunetwork.com" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "want to join? fill out the form" }),
  ).toBeVisible();
  await expect(page.getByText("2 members")).toBeVisible();
  await expect(
    page.getByPlaceholder("search by name or skill..."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "download csv" }),
  ).toBeEnabled();
});

test("downloads only the currently visible people as csv", async ({ page }) => {
  await page.goto("/");

  const searchInput = page.getByPlaceholder("search by name or skill...");
  const downloadButton = page.getByRole("button", { name: "download csv" });

  await searchInput.fill("zzz");
  await expect(page.getByText("0 members")).toBeVisible();
  await expect(downloadButton).toBeDisabled();

  await searchInput.fill("maya");
  await expect(page.getByText("1 members")).toBeVisible();
  await expect(downloadButton).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await downloadButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(
    /^asu-network-members-maya-\d{4}-\d{2}-\d{2}\.csv$/,
  );

  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();

  const csv = await readFile(downloadPath!, "utf8");

  expect(csv.startsWith("\ufeff")).toBe(true);
  expect(csv).toContain(
    '"full_name","headline","bio","program","grad_year","location","avatar_url","website_url","github_url","linkedin_url","x_url","email","focus_areas","worked_at","connected_people","slug","profile_url"',
  );
  expect(csv).toContain('"maya chen"');
  expect(csv).not.toContain('"alex kim","product-minded engineer"');
  expect(csv).toContain('"maya@asu.edu"');
  expect(csv).toContain('"alex kim"');
  expect(csv).toContain('"https://asunetwork.com/people/maya-chen"');
});
