# Verification

`npm test` uses Node's built-in test runner to check supported social post URLs, unsafe-link rejection, reference validation, old workspace migration, and week/recovery totals.

`npm run test:browser` requires `npm install` and `npx playwright install chromium`, plus a running server. It uses isolated browser storage and tests saved references for all three platforms, duplicate links, filters, editing, source-linked drafts, removal, reload, backup restore, and narrow layouts.

Optional environment variables:

- `FIELDNOTES_URL`: server address (default `http://127.0.0.1:8879`).
- `BROWSER_CHANNEL`: installed Chromium browser channel, for example `msedge`.
- `PLAYWRIGHT_MODULE`: alternate installed Playwright module location.
- `SCREENSHOT_DIR`: optional screenshot output directory. Screenshots are excluded from Git by default.

The tests never open social networks or publish posts. Keep real workspace data out of test fixtures.
