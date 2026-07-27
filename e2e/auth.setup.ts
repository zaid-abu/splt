import fs from "node:fs";
import path from "node:path";

import { expect, test as setup } from "@playwright/test";

const authStatePath = path.join(process.cwd(), "playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("E2E_EMAIL and E2E_PASSWORD are required for authenticated tests.");
  }

  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });
  await expect(page.getByRole("tab", { name: "Home" })).toBeVisible();

  fs.mkdirSync(path.dirname(authStatePath), { recursive: true });
  await page.context().storageState({ path: authStatePath });
});
