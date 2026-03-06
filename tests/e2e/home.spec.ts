import { expect, test } from "@playwright/test";

test("loads home page hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build Your ASU Network" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore People" })).toBeVisible();
});

