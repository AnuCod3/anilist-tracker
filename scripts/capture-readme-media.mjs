// Regenerates the README screenshots in docs/assets/readme/.
//
// Usage (from the repo root, Windows PowerShell or any shell):
//   npm run build
//   npm install --no-save playwright
//   npx playwright install chromium
//   node scripts/capture-readme-media.mjs
//
// What it does:
// - Loads the built, unpacked extension from dist/ in a throwaway Chromium profile.
// - Seeds chrome.storage.local with DEMO data only (fake user "demo-user", fake id,
//   a few public AniList title mappings). No real account, no real token.
// - Blocks every network request that is not to the extension itself, so nothing
//   reaches AniList or the auth backend.
// - Screenshots the popup (logged out), the settings page and the supported-sites page.
import { chromium } from "playwright";
import { mkdtempSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const OUT = join(ROOT, "docs", "assets", "readme");

const DEMO_STORAGE = {
  schemaVersion: 1,
  theme: "dark",
  showBetaFeatures: true,
  autoMap: true,
  showCatalogStatus: true,
  titleMappings: {
    "Solo Leveling::MANGA": 105398,
    "Frieren: Beyond Journey's End::ANIME": 154587,
    "One Piece::MANGA": 30013,
    "Omniscient Reader's Viewpoint::MANGA": 119257,
  },
};
const DEMO_ACCOUNT = { userId: 1234567, username: "demo-user" };

async function shot(page, file, selector) {
  const opts = { path: join(OUT, file), animations: "disabled" };
  if (selector) await page.locator(selector).screenshot(opts);
  else await page.screenshot({ ...opts, fullPage: true });
  console.log(`saved docs/assets/readme/${file}`);
}

async function main() {
  if (!existsSync(join(DIST, "manifest.json"))) {
    throw new Error("dist/ not found. Run `npm run build` first.");
  }
  mkdirSync(OUT, { recursive: true });
  const userDir = mkdtempSync(join(tmpdir(), "anilist-tracker-shots-"));

  const context = await chromium.launchPersistentContext(userDir, {
    headless: false,
    args: [
      "--headless=new",
      `--disable-extensions-except=${DIST}`,
      `--load-extension=${DIST}`,
    ],
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.5,
    locale: "en-US",
  });

  try {
    // Never talk to real services while capturing.
    await context.route("**/*", (route) => {
      const url = route.request().url();
      return url.startsWith("chrome-extension://") || url.startsWith("data:")
        ? route.continue()
        : route.abort();
    });

    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent("serviceworker");
    const extId = new URL(worker.url()).host;
    const base = `chrome-extension://${extId}`;

    // 1) Popup, logged out (fresh install state).
    await worker.evaluate((s) => chrome.storage.local.set(s), { schemaVersion: 1, theme: "dark" });
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 360, height: 420 });
    await popup.goto(`${base}/src/popup/popup.html`);
    await popup.waitForSelector("#login-view", { state: "visible" });
    await popup.waitForTimeout(300);
    await shot(popup, "popup-login.png", "body");
    await popup.close();

    // 2) Settings page with demo account + demo title mappings.
    await worker.evaluate((s) => chrome.storage.local.set(s), { ...DEMO_STORAGE, ...DEMO_ACCOUNT });
    const options = await context.newPage();
    await options.setViewportSize({ width: 820, height: 600 });
    await options.goto(`${base}/src/options/options.html`);
    await options.waitForSelector(".mapping-row");
    await options.waitForTimeout(300);
    await shot(options, "options-dark.png");

    // 3) Same page in the light theme.
    await worker.evaluate(() => chrome.storage.local.set({ theme: "light" }));
    await options.reload();
    await options.waitForSelector(".mapping-row");
    await options.waitForTimeout(300);
    await shot(options, "options-light.png");
    await options.close();

    // 4) Supported-sites page.
    await worker.evaluate(() => chrome.storage.local.set({ theme: "dark" }));
    const sites = await context.newPage();
    await sites.setViewportSize({ width: 900, height: 400 });
    await sites.goto(`${base}/src/sites/sites.html`);
    await sites.waitForTimeout(500);
    await shot(sites, "supported-sites.png");
    await sites.close();
  } finally {
    await context.close();
    rmSync(userDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
