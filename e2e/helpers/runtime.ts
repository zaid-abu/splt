import { expect, type Page } from "@playwright/test";

const IGNORED_CONSOLE_ERRORS = [/Failed to load resource.*favicon/i];

export function monitorRuntimeErrors(page: Page): () => void {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (!IGNORED_CONSOLE_ERRORS.some((pattern) => pattern.test(text))) {
      errors.push(`console: ${text}`);
    }
  });

  page.on("pageerror", (error) => {
    errors.push(`page: ${error.message}`);
  });

  return () => {
    expect(errors, `Browser runtime errors:\n${errors.join("\n")}`).toEqual([]);
  };
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
  }));

  expect(
    metrics.pageWidth,
    `Page width ${metrics.pageWidth}px exceeds viewport ${metrics.viewportWidth}px`
  ).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}
