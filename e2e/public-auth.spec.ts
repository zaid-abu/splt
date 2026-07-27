import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, monitorRuntimeErrors } from "./helpers/runtime";

test.describe("public authentication UI", () => {
  let assertNoRuntimeErrors: () => void;

  test.beforeEach(async ({ page }) => {
    assertNoRuntimeErrors = monitorRuntimeErrors(page);
  });

  test.afterEach(async ({ page }) => {
    await expectNoHorizontalOverflow(page);
    assertNoRuntimeErrors();
  });

  test("welcome screen links to registration and sign in", async ({ page }) => {
    await page.goto("/welcome");

    await expect(page.getByText("Shared money, made lighter.")).toBeVisible();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/register$/);

    await page.goto("/welcome");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login validates fields and toggles password visibility", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("you@example.com").fill("invalid");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();

    const password = page.getByPlaceholder("Enter your password");
    await password.fill("secret123");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("registration reports invalid empty fields", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Full name must be at least 2 characters.")).toBeVisible();
    await expect(page.getByText("Email is required.")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters.")).toBeVisible();
  });

  test("password recovery validates email and returns to sign in", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("button", { name: "Send recovery link" }).click();

    await expect(page.getByText("Email is required.")).toBeVisible();
    await page.getByRole("button", { name: "Back to sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
