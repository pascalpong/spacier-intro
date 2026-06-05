/**
 * Capture screenshots of the public client sites for the Work grid.
 *
 *   node scripts/capture-work.mjs           # uses an auto-detected Chrome
 *   CHROME_PATH="/path/to/chrome" node scripts/capture-work.mjs
 *
 * Writes public/work/<id>.png. Only public, non-logged-in pages are listed
 * here on purpose — never point this at anything behind a login.
 */
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/work");
mkdirSync(OUT, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Volumes/Mac External/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error("No Chrome found. Set CHROME_PATH=/path/to/chrome");
  process.exit(1);
}

const TARGETS = [
  { id: "soluna", url: "https://www.soluna-zurich.ch/" },
  { id: "sony", url: "https://sony-slider.vercel.app/" },
  { id: "adriatique", url: "https://www.adriatique.ch/" },
  { id: "serapyavuz", url: "https://www.serapyavuz.com/" },
  { id: "20min", url: "https://advertising.20min.ch/" },
];

// Optional: capture only specific ids, e.g. `node scripts/capture-work.mjs sony`
const only = process.argv.slice(2);
const targets = only.length ? TARGETS.filter((t) => only.includes(t.id)) : TARGETS;

// Best-effort cookie/consent dismissal (incl. shadow DOM).
const dismissConsent = () => {
  const wanted =
    /^(accept|accept all|allow all|agree|ok|got it|i agree|akzeptieren|alle akzeptieren|zustimmen|einverstanden|verstanden|annehmen|alle cookies)/i;
  const ids = [
    "#onetrust-accept-btn-handler",
    "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
    '[data-testid="uc-accept-all-button"]',
    "button.cookie-accept",
    ".cm-btn-success",
  ];
  const clickIn = (root) => {
    for (const sel of ids) {
      const el = root.querySelector?.(sel);
      if (el) {
        el.click();
        return true;
      }
    }
    const btns = root.querySelectorAll?.("button, a, [role=button]") || [];
    for (const b of btns) {
      const t = (b.textContent || "").trim();
      if (t && wanted.test(t)) {
        b.click();
        return true;
      }
    }
    for (const el of root.querySelectorAll?.("*") || []) {
      if (el.shadowRoot && clickIn(el.shadowRoot)) return true;
    }
    return false;
  };
  try {
    clickIn(document);
  } catch {
    /* ignore */
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  args: ["--hide-scrollbars", "--no-first-run"],
  defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 1 },
});

for (const { id, url } of targets) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    await sleep(1500);
    await page.evaluate(dismissConsent);
    await sleep(1200);
    await page.screenshot({ path: resolve(OUT, `${id}.jpg`), type: "jpeg", quality: 82 });
    console.log(`OK   ${id}`);
  } catch (e) {
    console.error(`FAIL ${id}: ${e.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log("done");
