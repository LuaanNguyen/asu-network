import { expect, test } from "@playwright/test";

test("loads home page hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "welcome to the asu.network." })).toBeVisible();
  await expect(page.getByRole("button", { name: "want to join? fill out the form" })).toBeVisible();
  await expect(page.getByText("members")).toBeVisible();
  await expect(page.getByPlaceholder("search by name, program, skill...")).toBeVisible();
});
