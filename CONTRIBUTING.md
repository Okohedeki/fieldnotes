# Contributing

Keep Fieldnotes focused on weekly consistency and helping people develop their own stories.

1. Fork the repository and make a branch for your change.
2. Run `npm run check` and `npm test`.
3. For interface changes, run the browser checks and inspect desktop and mobile layouts.
4. Describe the user-visible behavior, tests run, and any storage migration in your pull request.

Preserve existing local data. New fields need backward-compatible defaults and validation on restore. Treat imported text and URLs as untrusted; escape rendered content and validate external links. Never commit browser storage exports, credentials, local logs, or screenshots containing personal data.

Social integrations must be explicit about what is connected, what is manual, and where data goes. Keep the application useful without API access. Do not replace a user's draft with generated or copied source content.

The app has four primary screens: Today, Week, Write, and People. Discuss major dependencies, new screens, or changes to this structure in an issue before implementation.
