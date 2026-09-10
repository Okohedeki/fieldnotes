# Fieldnotes

A local-first workspace for showing up consistently: **Plan → Write → Publish → Engage → Repeat.**

Keep your weekly publishing commitments and collect posts worth thinking about from LinkedIn, X, and TikTok. No account, API key, build step, or remote database is required.

## Run locally

Clone this repository, then run from its folder:

```sh
python server.py --open
```

Use `python3` if that is your Python command. On Windows you can also double-click **Start Fieldnotes.cmd**. Open **http://127.0.0.1:8879** and keep the server running. Python 3 is the only runtime dependency. A static web server also works.

## Four screens

- **Today:** scheduled post, connection and comment counts, and developing the next draft. Edit counts directly or use the plus/minus controls.
- **Week:** five posts in a 2 Reach / 2 Expertise / 1 Offer rhythm, 100 connections, and a configurable comment target (50 by default). Multiple publications on one day count. Daily targets adjust to the remaining work; weekends offer room to recover.
- **Write:** an autosaving editor, questions to develop your own thoughts, and a reference shelf for other people's social posts. Add topics such as corporate leadership or AI to organize inspiration.
- **People:** keep profile links and notes, then manually log meaningful comments.

Publishing and engagement are manual. Copy your post, publish it on LinkedIn, and mark it published here. The publishing calendar currently focuses on LinkedIn; **the inspiration tracker supports LinkedIn, X, and TikTok**.

## Save a post, develop your own story

1. In **Write → Cool things to write about → Save a post**, paste a LinkedIn post, X status, or TikTok video URL.
2. Add a short title, a topic, and what caught your attention.
3. Filter your saved references by topic, revisit the original link, or choose **Develop my take**.
4. Write your own perspective in the blank draft. The source link and your notes stay alongside it. Removing a saved reference does not delete drafts developed from it.

Links and notes are entered by the user. Fieldnotes does not scrape feeds, retrieve post content, refresh metrics, or monitor accounts automatically. Markov is a future discovery integration; no idea generation or connected Markov service is included.

## Data and privacy

Everything you enter stays in this browser's localStorage at this address. No analytics or background social network requests are made. Opening an external profile or post visits that platform normally. Export JSON backups from the footer; restore validates the file and asks before replacing your workspace.

Use the same browser and address each time: `localhost`, `127.0.0.1`, and hosted copies have separate storage. Clearing browser data removes your workspace. Avoid editing in multiple tabs at once. Saved references and backups can contain personal notes; they are not part of the repository.

Existing Fieldnotes version-one data migrates without overwriting its original storage key. Version-two workspaces gain an empty inspiration library automatically. Legacy weekly connection totals are attributed to Monday because the old format did not record daily counts.

## Development

```sh
npm run check
npm test
```

These checks require Node.js 20 or newer and no installed packages. Optional browser checks use Playwright:

```sh
npm install
npx playwright install chromium
python server.py
# In another terminal:
npm run test:browser
```

See [tests/README.md](tests/README.md) for configuration and coverage.

## Architecture

Vanilla JavaScript and CSS with no framework or build pipeline:

- `inspiration.js`: social post URL validation, reference forms, filtering, and source-to-draft context.
- `consistency-model.js`: storage validation/migration, calendar arithmetic, activity, and weekly totals.
- `consistency.js`: the four views, local saving, and user actions.
- `consistency.css`: responsive layout and design tokens.
- `server.py`: optional local-only static server.

Posts retain a `channel` and an `ideaSource`. Drafts started from a reference use `{ provider: "saved-post", id }`. Future Markov/distribution adapters can build on this provenance without changing the daily consistency loop.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md). Released under the [MIT license](LICENSE). This is an independent project, not affiliated with LinkedIn, X, or TikTok.
