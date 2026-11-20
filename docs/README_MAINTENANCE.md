# README maintenance protocol

**Purpose:** keep `README.md`, its screenshots and `AGENTS.md` accurate as the extension changes.
This file follows the shared README standard `docs/playbooks/readme-standard.md` in `AnuCod3/agentic-os`.
Source task: Microsoft To Do, list **Dev**, task **"GitHub Repos verbessern"**.

Last verified: **2026-11-20** (extension version 0.6.0, `main` at `bca5b42`).

## Instructions for future AI agents

When features change, read this file first. Then update the README sections listed below, regenerate the affected
media with the commands below, and update the "Last verified" dates (here and in the media table).
If the Microsoft To Do MCP is available, check the "GitHub Repos verbessern" task in list "Dev" for open README items.

Rules: real screenshots only from the extension's own pages, with **demo data** (`demo-user`, fake ID). Never log in
with a real AniList account for screenshots, and never scrape or record live third-party sites automatically.
Check every image yourself for personal data before committing. This is a public fork: credit upstream (TheNesur).

## Feature overview: source of truth

| README section / claim | Where it lives in the code |
|---|---|
| Supported sites table, site count | `src/sites/registry.ts`, `src/parsers/index.ts`, `public/manifest.json` (`content_scripts.matches`) |
| Generic detection | `src/popup/generic-detect.ts`, `src/popup/resolve.ts` |
| One-click sync, never goes backwards, offline queue | `src/background/progress.ts` (`skipped`, `queuePendingUpdate`, retry alarm) |
| Remembered matches (title mappings) | `src/utils/storage.ts` (`titleMappings`), settings list in `src/options/options.ts` |
| Optional extras / defaults | `DEFAULT_SETTINGS` in `src/types/index.ts`; toggles in `src/options/options.html` |
| Catalog progress colours | `src/content/catalog.ts`, `src/parsers/catalog/` |
| Community title matching | `src/background/alias.ts`, `PRIVACY.md` |
| Report a problem | `src/popup/views/report.ts` |
| Themes, EN/FR | `src/utils/storage.ts` (`theme`), `_locales/en`, `_locales/fr` |
| Configuration table | `.env.example`, `src/background/oauth.ts` (`import.meta.env.*`) |
| Development commands | `package.json` scripts, `.github/workflows/ci.yml` |
| Version badge | `package.json` `version` |
| Status / Roadmap | branch `feat/donghua-multi-season-support`, upstream PRs TheNesur/anilist-tracker#12 and #13 |

## Media inventory

All files are in `docs/assets/readme/`. Regenerate all of them with:

```powershell
npm ci
npm run build
npm install --no-save playwright
npx playwright install chromium
node scripts/capture-readme-media.mjs
```

The script loads `dist/` as an unpacked extension in a temporary Chromium profile (headless `--headless=new`),
seeds `chrome.storage.local` with demo data, blocks all non-extension network requests, and writes the PNGs.
No dev server or port is used.

| File | Shows | How to regenerate | Last captured |
|---|---|---|---|
| `supported-sites.png` | Supported-sites page (hero image) | script above | 2026-11-20 |
| `options-dark.png` | Settings page, dark theme, demo account + 4 demo title mappings, beta section visible | script above | 2026-11-20 |
| `options-light.png` | Same settings page, light theme | script above | 2026-11-20 |
| `popup-login.png` | Popup before connecting ("Connect to AniList") | script above | 2026-11-20 |

To change the demo data, edit `DEMO_STORAGE` / `DEMO_ACCOUNT` at the top of `scripts/capture-readme-media.mjs`.

## Placeholders still open

- `README.md` → `<!-- TODO(media): … -->` under Features: a 5–15 s GIF of the popup detecting a chapter/episode
  and syncing it. Needs a logged-in AniList account and a live reading site, so it can't be automated under the rules above.
  Manual steps: install the store build, log in with a **throwaway demo AniList account**, open a chapter on MangaDex,
  record the popup with any screen recorder, convert with
  `ffmpeg -i in.webm -vf "fps=12,scale=900:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" docs/assets/readme/popup-sync.gif`
  (≤ 5 MB), check that no personal data is visible, then replace the TODO comment with the image.

## Verification log (2026-11-20, Windows 11, Node v26.4.0, npm 11.17.0)

| Command | Result |
|---|---|
| `npm ci` | OK (submodule `src/shared/anilist-tracker-shared` already checked out in the worktree) |
| `npm run typecheck` | OK, no errors |
| `npm run build` | OK, `dist/` created; works with empty `.env` values |
| `npm run build:dev` | OK |
| Load unpacked `dist/` in Chromium (Playwright) | OK: popup, settings and supported-sites pages render |
| `node scripts/capture-readme-media.mjs` | OK, 4 PNGs written |
| Links in README | Store links, upstream repo, shared submodule repo and upstream PRs #12/#13 checked with `gh`/HTTP |

Not verified: OAuth login (needs AniList client credentials and the upstream backend; no real account used),
detection on live sites (no automated access to third-party sites), `npm run build:store` (needs `zip` on PATH),
store install flow (manual). The upstream backend repository is not public, so the README doesn't link it.

## Update checklist

1. Read the diff since the "Last verified" commit (`git log bca5b42..HEAD`).
2. New/removed site → update the Supported sites table and the count ("12 dedicated sites").
3. New setting or default changed → update Features "Optional extras", Usage table, screenshots.
4. New env var → update the Configuration table, `.env.example`, `AGENTS.md`.
5. Version bump → the badge in `README.md`, "AniList Tracker x.y.z" in Quick Start.
6. Donghua branch merged → move it from "In progress" to Features/Supported sites in Status / Roadmap.
7. `npm run build` → `node scripts/capture-readme-media.mjs` → look at every image → update dates here.
8. Run `npm run typecheck` and `npm run build`, then update the verification log.
