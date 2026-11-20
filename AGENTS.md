# AGENTS.md: instructions for AI coding agents

AniList Tracker is a Manifest V3 browser extension (Chrome/Edge) written in TypeScript and built with Vite + CRXJS.
It detects manga/anime progress on supported sites and syncs it to AniList via its GraphQL API.

**Fork notice:** this repo (`AnuCod3/anilist-tracker`, remote `origin`) is a fork of `TheNesur/anilist-tracker` (remote `upstream`).
Push only to `origin` and open PRs only with `--repo AnuCod3/anilist-tracker` unless the owner explicitly asks for an upstream PR.

## Setup (verified 2026-11-20 on Windows 11, Node 26 / npm 11; CI uses Node 20)

```powershell
git submodule update --init --recursive   # src/shared/anilist-tracker-shared is required to compile
npm ci
Copy-Item .env.example .env               # optional; values only matter for OAuth login
npm run typecheck
npm run build                             # output: dist/
```

- Load `dist/` via `chrome://extensions` → Developer mode → **Load unpacked**.
- `.env` keys: `VITE_ANILIST_CLIENT_ID`, `VITE_ANILIST_REDIRECT_URI`, `VITE_TOKEN_ENDPOINT` (optional, has a default).
  Never invent values; ask the owner. The build succeeds with them empty, but login will not work.
- Never commit `.env`, `dev-key.txt`, `*.pem`, `*.crx`, or `dist/` (all git-ignored).

## Commands

| Command | Purpose |
|---|---|
| `npm run typecheck` | `tsc --noEmit`. The only automated check; there are no unit tests. |
| `npm run build` | Production build into `dist/`. |
| `npm run build:dev` | Dev build (dev icons, `auth-dev` host permission, stable ID via `dev-key.txt` if present). |
| `npm run build:store` | Build + zip (`zip` must be on PATH). |
| `npm run dev` | Vite dev server with HMR. In a shared environment pass a fixed port: `npm run dev -- --port <port>`. |
| `node scripts/capture-readme-media.mjs` | Regenerates README screenshots (needs `npm install --no-save playwright` and a built `dist/`). |

CI (`.github/workflows/ci.yml`): `npm ci` → `npm run typecheck` → `npm run build`, with submodules checked out.

## Code map

- `public/manifest.json`: permissions, host permissions, content-script URL matches. Version is overwritten from `package.json` at build.
- `src/background/`: service worker (`index.ts` message router, `oauth.ts`, `progress.ts` update + offline retry queue, `alias.ts` community title matching, `badge.ts`, `tab-state.ts`, `migrations.ts`).
- `src/content/`: `index.ts` (detection on supported sites), `catalog.ts` (optional catalog status overlay).
- `src/parsers/`: per-site parsers in `manga/`, `anime/`, `catalog/`; factory in `index.ts`.
- `src/popup/`: popup UI, `generic-detect.ts` (on-demand detection for unsupported sites), `views/`.
- `src/options/`: settings page. `src/sites/`: supported-sites page + `registry.ts` (hostnames, display names).
- `src/utils/`: `anilist.ts` (GraphQL), `storage.ts`, `i18n.ts`, `matching.ts`, `request-queue.ts`.
- `src/types/index.ts`: shared types, `SupportedSite`, `DEFAULT_SETTINGS`.
- `_locales/{en,fr}/messages.json`: every UI string must exist in both locales.

## Conventions

- TypeScript strict mode; follow the existing structure (see `CONTRIBUTING.md`).
- New site = parser + `SupportedSite` + `getParser()` + `src/sites/registry.ts` + `manifest.json` matches (see README → "Adding a new site").
- Features that share data must be opt-in; update `PRIVACY.md` if data handling changes.
- Upstream's branch model: feature branches from `dev`, PRs to `dev`; `main` mirrors the store release.
- Conventional commit messages (`feat:`, `fix:`, `docs:` …).

## Docs maintenance

When features change, follow `docs/README_MAINTENANCE.md`: update the listed README sections, regenerate screenshots, and update the "Last verified" dates.
