# Playwright UI tests

The suite starts Expo Web automatically and exercises the public authentication UI in Chromium at
mobile, tablet, and desktop widths.

```bash
npm run test:e2e
```

Use Playwright's interactive runner while developing:

```bash
npm run test:e2e:ui
```

Authenticated coverage is enabled when both variables are present:

```bash
E2E_EMAIL="verified-user@example.com" E2E_PASSWORD="password" npm run test:e2e
```

The account must be verified and have completed any required profile/onboarding setup. The setup
project signs in once and writes browser state to `playwright/.auth/user.json`; that file is ignored
by Git.

To test an already-running deployment instead of starting Expo locally:

```bash
E2E_BASE_URL="https://example.test" npm run test:e2e
```

Failure screenshots, traces, and videos are written under `test-results/`. Open the HTML report with
