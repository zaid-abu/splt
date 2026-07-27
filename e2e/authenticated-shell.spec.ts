import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, monitorRuntimeErrors } from "./helpers/runtime";

test.describe("authenticated app shell", () => {
  let assertNoRuntimeErrors: () => void;

  test.beforeEach(async ({ page }) => {
    assertNoRuntimeErrors = monitorRuntimeErrors(page);
    await page.goto("/home");
  });

  test.afterEach(async ({ page }) => {
    await expectNoHorizontalOverflow(page);
    assertNoRuntimeErrors();
  });

  test("switches between every primary tab", async ({ page }) => {
    const destinations = [
      { name: "Circles", path: "/circles" },
      { name: "Activity", path: "/activity" },
      { name: "More", path: "/more" },
      { name: "Home", path: "/home" },
    ];

    for (const destination of destinations) {
      const tab = page.getByRole("tab", { name: destination.name });
      await expect(tab).toBeVisible();
      await tab.click();
      await expect(page).toHaveURL(new RegExp(`${destination.path}$`));
      await expect(tab).toHaveAttribute("aria-selected", "true");
    }
  });

  test("opens and closes the global action sheet", async ({ page }) => {
    await page.getByRole("button", { name: "Open Add actions" }).click();

    await expect(page.getByText("What would you like to do?")).toBeVisible();
    for (const action of [
      "Add expense",
      "Settle up",
      "Create group",
      "Add person",
      "Schedule expense",
    ]) {
      await expect(page.getByRole("button", { name: action })).toBeVisible();
    }

    await page.getByRole("button", { name: "Close Add actions" }).click();
    await expect(page.getByText("What would you like to do?")).toBeHidden();
  });
});
