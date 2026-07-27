import { defineConfig } from "@playwright/test";
import path from "node:path";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:8081";
const authStatePath = path.join(process.cwd(), "playwright/.auth/user.json");
const hasCredentials = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

if (!hasCredentials) {
  console.warn(
    "[playwright] E2E_EMAIL/E2E_PASSWORD are not set; authenticated UI tests are disabled."
  );
}

const mobile = {
  browserName: "chromium" as const,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
};

const tablet = {
  browserName: "chromium" as const,
  viewport: { width: 820, height: 1180 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
};

const desktop = {
  browserName: "chromium" as const,
  viewport: { width: 1440, height: 900 },
};

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npx expo start --web --port 8081",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "ignore",
        stderr: "pipe",
        env: { ...process.env, CI: "1" },
      },
  projects: [
    {
      name: "public-mobile",
      testMatch: /public-auth\.spec\.ts/,
      use: mobile,
    },
    {
      name: "public-tablet",
      testMatch: /public-auth\.spec\.ts/,
      use: tablet,
    },
    {
      name: "public-desktop",
      testMatch: /public-auth\.spec\.ts/,
      use: desktop,
    },
    ...(hasCredentials
      ? [
          {
            name: "auth-setup",
            testMatch: /auth\.setup\.ts/,
            use: desktop,
          },
          {
            name: "authenticated-mobile",
            testMatch: /authenticated-shell\.spec\.ts/,
            dependencies: ["auth-setup"],
            use: { ...mobile, storageState: authStatePath },
          },
        ]
      : []),
  ],
});
