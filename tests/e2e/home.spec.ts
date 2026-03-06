import { expect, test } from "@playwright/test";

test("loads home page hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ASU Talent Network" })).toBeVisible();
  await expect(page.getByText("members")).toBeVisible();
  await expect(page.getByPlaceholder("search by name, program, skill...")).toBeVisible();
});
