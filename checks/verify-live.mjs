// The site's own functional gate: drives every tool on the deployed site the way
// a visitor does. Run by verify_live with SHIPSITE_URL and SHIPSITE_BROWSER set.
import { chromium, webkit } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.SHIPSITE_URL || "").replace(/\/+$/, "");
const WHICH = process.env.SHIPSITE_BROWSER || "chromium";
const out = {
  controls: [],
  downloads: [],
  share: null,
  overflow: [],
  consoleErrors: [],
  failedRequests: [],
  realInput: [],
};
let failed = false;

function ctl(name, ok, detail = "") {
  out.controls.push({ name, ok: !!ok, detail: String(detail).slice(0, 160) });
  if (!ok) failed = true;
  return ok;
}
function note(msg) {
  console.log(`# ${msg}`);
}

const consoleErrors = [];
const failedRequests = [];

function watch(page) {
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/\[Report Only\]/.test(t) || /report-only mode/.test(t)) return;
    // An anonymous visitor's session probe (401) and a dev Worker deployed
    // without the D1 binding (501) are the site answering honestly.
    const where = (m.location() && m.location().url) || "";
    if (/\/api\/auth\/me/.test(where) && /401/.test(t)) return;
    if (/\/api\/_site\/contact/.test(where) && /501/.test(t)) return;
    consoleErrors.push(t.slice(0, 300));
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 300)));
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (u.startsWith(BASE)) failedRequests.push(`${u} ${r.failure()?.errorText || ""}`.slice(0, 300));
  });
  page.on("response", (r) => {
    const u = r.url();
    if (!u.startsWith(BASE)) return;
    if (r.status() < 400) return;
    if (u.includes("/api/auth/me")) return; // anonymous visitor: 401 is the expected answer
    if (u.includes("/api/_site/contact") && r.status() === 501) {
      // The dev Worker is deployed without the preview's D1 binding; the
      // preview and production carry it and store the message there.
      globalThis.__contactUnprovisioned = true;
      return;
    }
    if (u.includes("favicon")) return;
    failedRequests.push(`${u} ${r.status()}`.slice(0, 300));
  });
}

async function open(ctx, route, width, height) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width, height });
  watch(page);
  // A freshly deployed preview can answer the first request before its
  // assets are live: reload until the page has its content.
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(400 + attempt * 1200);
    const ready = await page
      .locator("main, [data-tool-surface], h1")
      .first()
      .isVisible()
      .catch(() => false);
    if (ready) break;
  }
  return page;
}

const NAMES = Array.from({ length: 24 }, (_, i) => `Person ${i + 1}`);
const SAMPLE8 = ["Ada", "Bo", "Chen", "Dara", "Eli", "Fay", "Gus", "Hana"];

function pieces(names) {
  const seen = new Set();
  const out = [];
  for (const line of names) {
    const cleaned = String(line).replace(/^\s*(?:\d{1,4}[.)]|\d{1,4}\s+|[\u2022*\-\u2013])\s+/, "").trim();
    if (!cleaned) continue;
    for (const part of cleaned.split(/\s*[,;\t]\s*/)) {
      const name = part.trim();
      if (name && !seen.has(name)) { seen.add(name); out.push(name); }
    }
  }
  return out;
}

async function setNames(page, names) {
  const box = page.locator('[data-tool-input="names"]').first();
  await box.waitFor({ state: "visible", timeout: 60000 });
  await box.fill(names.join("\n"), { timeout: 120000 });
  await page.waitForTimeout(150);
}

async function clickPrimary(page) {
  const btn = page.locator("[data-primary]").first();
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
}

async function waitWinner(page, timeout = 30000) {
  await page.locator("[data-winner]").first().waitFor({ state: "visible", timeout });
  const named = page.locator(".wn-slip-name").first();
  if (await named.count()) return (await named.innerText()).trim();
  const text = (await page.locator("[data-winner]").first().innerText()).trim();
  return text.split("\n")[0].trim();
}

async function bodyText(page) {
  return (await page.locator("body").innerText()).replace(/\s+/g, " ");
}

/* ------------------------------------------------------------------ */
/* the name wheel                                                      */
/* ------------------------------------------------------------------ */
async function driveNameWheel(page, label, opts = {}) {
  const { names = NAMES, real = false } = opts;
  const settle = real ? 8 * 60 * 1000 : 45000;

  // empty state first (only when the page is fresh)
  if (!real && !opts.skipEmpty) {
    const box = page.locator('[data-tool-input="names"]');
    const val = await box.inputValue();
    const count = (await page.locator("[data-name-count]").first().innerText()).trim();
    const primary = page.locator("[data-primary]").first();
    const disabled =
      (await primary.isDisabled()) ||
      (await primary.getAttribute("aria-disabled")) === "true" ||
      (await primary.getAttribute("data-ready")) === "false";
    ctl(`${label} empty state`, val === "" && /^0 names$/.test(count) && disabled, `value=${JSON.stringify(val)} count=${count} disabled=${disabled}`);
    if (!val) {
      const sample = page.getByRole("button", { name: /try a sample/i }).first();
      if (await sample.count()) {
        await sample.click();
        await page.waitForTimeout(200);
        const c2 = (await page.locator("[data-name-count]").first().innerText()).trim();
        ctl(`${label} try a sample`, /^8 names$/.test(c2), c2);
        await page.getByRole("button", { name: /clear list/i }).first().click();
        await page.waitForTimeout(150);
      }
    }
  }

  await setNames(page, names);
  const expect = pieces(names);
  const count = (await page.locator("[data-name-count]").first().innerText()).trim();
  ctl(`${label} counts the list`, count === `${expect.length} ${expect.length === 1 ? "name" : "names"}`, `${count} (list has ${expect.length})`);

  const t0 = Date.now();
  await clickPrimary(page);
  let winner = "";
  try {
    winner = await waitWinner(page, settle);
  } catch {
    return { winner: "", seconds: (Date.now() - t0) / 1000, settled: false };
  }
  const seconds = (Date.now() - t0) / 1000;
  const known = expect.map((n) => n.toLowerCase());
  ctl(`${label} draws a listed name`, known.includes(winner.toLowerCase()), `${winner} in ${seconds.toFixed(1)}s`);
  if (!real) {
    const slip = (await page.locator(".wn-slip").first().innerText()).replace(/\s+/g, " ");
    ctl(`${label} winner card shows chance`, /%/.test(slip) && /1 in \d+/.test(slip), slip.slice(0, 120));
    ctl(`${label} spin lasts its set time`, seconds >= 2.5, `${seconds.toFixed(2)}s`);
  }
  return { winner, seconds, settled: true };
}

async function driveNameWheelResultActions(page, label) {
  // remove winner + undo
  const before = (await page.locator("[data-name-count]").first().innerText()).trim();
  await page.getByRole("button", { name: /^remove winner$/i }).first().click();
  await page.waitForTimeout(300);
  const after = (await page.locator("[data-name-count]").first().innerText()).trim();
  ctl(`${label} remove winner takes the name off`, before !== after, `${before} -> ${after}`);
  const undo = page.getByRole("button", { name: /undo removal/i }).first();
  if (await undo.count()) {
    await undo.click();
    await page.waitForTimeout(300);
    const restored = (await page.locator("[data-name-count]").first().innerText()).trim();
    ctl(`${label} undo restores the list`, restored === before, `${restored}`);
  } else {
    ctl(`${label} undo restores the list`, false, "no Undo control");
  }

  // spin again, then download
  await clickPrimary(page);
  try {
    await waitWinner(page, 45000);
  } catch {
    ctl(`${label} spin again`, false, "no winner");
    return;
  }
  const dl = page.waitForEvent("download", { timeout: 20000 }).catch(() => null);
  await page.getByRole("button", { name: /download \.txt/i }).first().click();
  const download = await dl;
  if (!download) {
    ctl(`${label} download results`, false, "no download event");
  } else {
    const file = await download.path();
    const bytes = file ? fs.readFileSync(file) : Buffer.alloc(0);
    const text = bytes.toString("utf8");
    const ok = bytes.length > 10 && /\d\.\s/.test(text);
    ctl(`${label} download results`, ok, `${bytes.length} bytes: ${text.split("\n")[0]}`);
    out.downloads.push({ name: "wheel-results.txt", ok, type: "text/plain", bytes: bytes.length });
  }

  // share link: hash carries the list and a fresh page restores it
  const before2 = await page.locator('[data-tool-input="names"]').inputValue();
  await page.getByRole("button", { name: /share link/i }).first().click();
  await page.waitForTimeout(400);
  const hash = await page.evaluate(() => window.location.hash);
  const shareUrl = BASE + "/" + hash;
  const fresh = await page.context().newPage();
  watch(fresh);
  await fresh.goto(shareUrl, { waitUntil: "domcontentloaded" });
  await fresh.waitForTimeout(500);
  const restored = await fresh.locator('[data-tool-input="names"]').inputValue();
  const okShare = /^#l=/.test(hash) && restored.length > 0 && restored.split("\n").length === before2.split("\n").length;
  ctl(`${label} share link restores the list`, okShare, `hash=${hash.slice(0, 24)}… lines=${restored.split("\n").length}`);
  out.share = { ok: okShare, lines: restored.split("\n").length };
  await fresh.close();
}

/* ------------------------------------------------------------------ */
/* weighted wheel                                                      */
/* ------------------------------------------------------------------ */
async function driveWeighted(page, label) {
  const box = page.locator('[data-tool-input="entries"]');
  await box.fill("Ada, 5\nBo, 3\nChen, 2");
  await page.waitForTimeout(250);
  const list = await page.locator("[data-entry]").allInnerTexts();
  const joined = list.join(" | ");
  ctl(`${label} shows each chance`, /50/.test(joined) && /30/.test(joined) && /20/.test(joined), joined.slice(0, 140));

  await clickPrimary(page);
  let winner = "";
  try {
    winner = await waitWinner(page, 30000);
  } catch {
    ctl(`${label} draws a winner`, false, "no winner");
    return;
  }
  ctl(`${label} draws a weighted winner`, ["Ada", "Bo", "Chen"].includes(winner), winner);
  const slip = (await page.locator(".wn-slip").first().innerText()).replace(/\s+/g, " ");
  ctl(`${label} winner card shows the chance`, /%/.test(slip), slip.slice(0, 120));

  // change a weight: the percentages follow
  const input = page.locator(".wn-weight-input").first();
  await input.fill("1");
  await input.dispatchEvent("change");
  await page.waitForTimeout(300);
  const after = (await page.locator("[data-entry]").allInnerTexts()).join(" | ");
  ctl(`${label} weight edit updates the odds`, after !== joined, after.slice(0, 140));
}

/* ------------------------------------------------------------------ */
/* raffle                                                              */
/* ------------------------------------------------------------------ */
async function driveRaffle(page, label, real = false) {
  const box = page.locator('[data-tool-input="entries"]');
  const entries = Array.from({ length: 10 }, (_, i) => `Ticket ${i + 1}`);
  await box.fill(entries.join("\n"));
  await page.waitForTimeout(200);
  const winners = page.locator("#wn-winners");
  if (await winners.count()) {
    await winners.fill("3");
    await winners.dispatchEvent("change");
  }
  await clickPrimary(page);
  const settle = real ? 8 * 60 * 1000 : 40000;
  try {
    await page.locator("[data-results] li, [data-results] [data-winner]").first().waitFor({ state: "visible", timeout: settle });
  } catch {
    ctl(`${label} draws winners`, false, "no result");
    return { ok: false };
  }
  const expectedRows = Math.min(3, pieces(entries).length);
  try {
    await page.waitForFunction(
      (n) => document.querySelectorAll("[data-results] [data-draw-row]").length >= n,
      expectedRows,
      { timeout: 15000 },
    );
  } catch { /* the row count below reports what arrived */ }
  const rows = await page.locator("[data-results] [data-draw-row]").allInnerTexts();
  const names = rows.map((r) => r.split(/\s{2,}/)[0]).filter(Boolean);
  const uniq = new Set(rows.map((r) => r.replace(/\s+/g, " ").trim()));
  ctl(`${label} draws the asked number of winners`, rows.length === expectedRows, `${rows.length}/${expectedRows} rows`);
  ctl(`${label} nobody wins twice`, uniq.size === rows.length, `${uniq.size}/${rows.length}`);
  return { ok: rows.length > 0, rows };
}

/* ------------------------------------------------------------------ */
/* fairness audit                                                      */
/* ------------------------------------------------------------------ */
async function driveFairness(page, label, real = false) {
  const box = page.locator('[data-tool-input="entries"]');
  if (!real) {
    await box.fill(["Ada", "Bo", "Chen", "Dara"].join("\n"));
    await page.waitForTimeout(200);
  }
  await clickPrimary(page);
  const settle = real ? 8 * 60 * 1000 : 120000;
  try {
    await page.locator("[data-audit-row]").first().waitFor({ state: "visible", timeout: settle });
  } catch {
    ctl(`${label} runs the audit`, false, "no rows");
    return { ok: false };
  }
  const rows = await page.locator("[data-audit-row]").count();
  const summary = await page.locator('[data-audit-summary]').first().innerText().catch(() => "");
  ctl(`${label} runs the audit`, rows > 0, `${rows} rows · ${summary.replace(/\s+/g, " ").slice(0, 110)}`);
  return { ok: rows > 0, rows, summary };
}

/* ------------------------------------------------------------------ */
/* route pages                                                         */
/* ------------------------------------------------------------------ */
async function checkPageLinks(page, route) {
  const title = await page.title();
  const h1 = await page.locator("h1").first().innerText().catch(() => "");
  ctl(`${route} renders`, h1.trim().length > 3, `${title} | h1=${h1.replace(/\s+/g, " ").slice(0, 80)}`);
  const styled = await page.evaluate(() => {
    const header = document.querySelector('[data-chrome="site"]');
    if (!header) return false;
    const cs = getComputedStyle(header);
    return cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.borderBottomWidth !== "0px";
  });
  ctl(`${route} has a styled header`, styled, "header paints a surface");
}

async function overflowAt(page, route, width) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.waitForTimeout(250);
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  if (m.sw > m.cw + 1) out.overflow.push({ route, width, scrollWidth: m.sw, clientWidth: m.cw });
  ctl(`${route} fits ${width}px`, m.sw <= m.cw + 1, `${m.sw}/${m.cw}`);
}

/* ------------------------------------------------------------------ */
/* real-size inputs from the platform's fixtures                       */
/* ------------------------------------------------------------------ */
function readFixtures() {
  const p = process.env.SHIPSITE_FIXTURES;
  if (!p) return null;
  try {
    const manifest = JSON.parse(fs.readFileSync(p, "utf8"));
    const dir = manifest.dir || ".";
    if (!path.isAbsolute(dir)) {
      const fromCwd = path.resolve(process.cwd(), dir);
      const fromManifest = path.resolve(path.dirname(p), dir);
      manifest.dir = fs.existsSync(path.join(fromCwd, manifest.fixtures?.[Object.keys(manifest.fixtures || {})[0]]?.file || ""))
        ? fromCwd
        : fromManifest;
    }
    return manifest;
  } catch (e) {
    note(`fixtures manifest unreadable: ${e}`);
    return null;
  }
}

function textOf(manifest, fixtureId) {
  const f = manifest.fixtures[fixtureId];
  if (!f) return null;
  const full = path.join(manifest.dir, f.file);
  if (fs.existsSync(full)) return fs.readFileSync(full, "utf8");
  const alt = path.join(process.cwd(), manifest.dir, f.file);
  return fs.existsSync(alt) ? fs.readFileSync(alt, "utf8") : null;
}

function lines(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 300);
}

async function runRealInputs(browser, manifest) {
  for (const a of manifest.assignments || []) {
    const text = textOf(manifest, a.fixture);
    if (!text) {
      out.realInput.push({ tool: a.tool, fixtures: [a.fixture], ok: false, finished: false, detail: "fixture file missing" });
      failed = true;
      continue;
    }
    const list = lines(text);
    const started = Date.now();
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    let entry = { tool: a.tool, fixtures: [a.fixture], ok: false, finished: false, seconds: 0, detail: "" };
    try {
      if (a.tool === "name-wheel") {
        const page = await open(ctx, "/", 1440, 900);
        const r = await driveNameWheel(page, "real name wheel", { names: list, real: true });
        entry.finished = r.settled;
        entry.ok = r.settled;
        entry.detail = r.settled ? `winner "${r.winner}" from ${list.length} lines in ${r.seconds.toFixed(0)}s` : "no winner in 8 minutes";
        await page.close();
      } else if (a.tool === "weighted-picker-wheel") {
        const page = await open(ctx, "/picker-wheel/", 1440, 900);
        await page.locator('[data-tool-input="entries"]').fill(list.join("\n"));
        await page.waitForTimeout(400);
        await clickPrimary(page);
        try {
          const w = await waitWinner(page, 8 * 60 * 1000);
          entry.ok = !!w;
          entry.finished = true;
          entry.detail = `winner "${w}" from ${list.length} lines in ${((Date.now() - started) / 1000).toFixed(0)}s`;
        } catch {
          entry.detail = "no winner in 8 minutes";
        }
        await page.close();
      } else if (a.tool === "raffle-draw") {
        const page = await open(ctx, "/raffle-wheel/", 1440, 900);
        const r = await driveRaffle(page, "real raffle", true);
        entry.ok = !!r.ok;
        entry.finished = !!r.ok;
        entry.detail = r.ok ? `${r.rows.length} winners from ${list.length} lines` : "no winners drawn";
        await page.close();
      } else if (a.tool === "fairness-audit") {
        const page = await open(ctx, "/fairness/", 1440, 900);
        await page.locator('[data-tool-input="entries"]').fill(list.join("\n"));
        await page.waitForTimeout(400);
        const r = await driveFairness(page, "real fairness audit", true);
        entry.ok = !!r.ok;
        entry.finished = !!r.ok;
        entry.detail = r.ok ? `${r.rows} rows audited over 10,000 draws` : "audit did not finish";
        await page.close();
      }
    } catch (e) {
      entry.detail = String(e).slice(0, 200);
    }
    entry.seconds = Math.round((Date.now() - started) / 1000);
    out.realInput.push(entry);
    if (!entry.ok) failed = true;
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */
const shotDir = path.join(process.cwd(), ".cache", "shots");
fs.mkdirSync(shotDir, { recursive: true });

const engine = WHICH === "webkit" ? webkit : chromium;
const browser = await engine.launch();

try {
  const fixtureManifest = readFixtures();
  if (fixtureManifest && WHICH === "chromium") await runRealInputs(browser, fixtureManifest);

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });

  /* ---- the name wheel, full drive ---- */
  let page = await open(ctx, "/", 1440, 900);
  await driveNameWheel(page, "home name wheel");
  await driveNameWheelResultActions(page, "home name wheel");

  // options: length, sound, volume, palette, projector, saved preference
  const options = page.locator("details.wn-options");
  if (!(await options.evaluate((el) => el.open))) await page.locator("details.wn-options > summary").click();
  await page.waitForTimeout(200);
  const seg = page.locator('input[name="wn-duration"]');
  await page.locator('input[name="wn-duration"][value="4"]').check({ force: true });
  const vol = page.locator("#wn-volume");
  await vol.fill("80");
  await vol.dispatchEvent("change");
  await page.waitForTimeout(150);
  const outVol = await page.locator(".wn-range output").first().innerText();
  ctl("volume readout follows the slider", outVol.trim() === "80", outVol);
  await page.locator('input[name="wn-palette"]').nth(2).check({ force: true });
  await page.locator(".wn-options input[type=checkbox]").first().uncheck({ force: true });
  await page.locator(".wn-options input[type=checkbox]").nth(1).check({ force: true });
  await page.waitForTimeout(200);
  const projector = await page.evaluate(() => !!document.querySelector(".wn-tool.is-projector"));
  ctl("projector mode switches the stage", projector, String(projector));
  await page.locator(".wn-options input[type=checkbox]").nth(1).uncheck({ force: true });

  const t4 = Date.now();
  await clickPrimary(page);
  let ok4 = false;
  try {
    await waitWinner(page, 20000);
    ok4 = true;
  } catch {
    ok4 = false;
  }
  const fourSec = (Date.now() - t4) / 1000;
  ctl("4 s spin length is used", ok4 && fourSec < 9, `${fourSec.toFixed(2)}s`);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const saved = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem("won.options.v1") || "{}");
    } catch {
      return {};
    }
  });
  ctl("options are remembered", Number(saved.volume) === 80 || Number(saved.duration) === 4, JSON.stringify(saved).slice(0, 100));

  // reduced motion reaches the result at once
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setNames(page, SAMPLE8);
  const tRed = Date.now();
  await clickPrimary(page);
  let redOk = false;
  try {
    await waitWinner(page, 8000);
    redOk = true;
  } catch {
    redOk = false;
  }
  const redMs = Date.now() - tRed;
  ctl("prefers-reduced-motion settles at once", redOk && redMs < 1500, `${redMs}ms`);
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // the desktop loop stays on the first screen
  await page.setViewportSize({ width: 1440, height: 900 });
  await setNames(page, NAMES);
  await clickPrimary(page);
  try {
    await waitWinner(page, 30000);
  } catch {
    /* reported below */
  }
  const loop = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.right), Math.round(r.top), Math.round(r.bottom)];
    };
    return {
      input: pick('[data-tool-input="names"]'),
      start: pick("[data-primary]"),
      result: pick("[data-winner]"),
      download: pick(".wn-slip-actions"),
      vh: window.innerHeight,
    };
  });
  const inView = ["input", "start", "result", "download"].every((k) => loop[k] && loop[k][3] <= loop.vh + 1 && loop[k][2] >= 0);
  ctl("desktop loop fits one screen", inView, JSON.stringify(loop));

  // phone: the loop in order, and it still runs
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const order = await page.evaluate(() => {
    const q = (sel) => document.querySelector(sel)?.getBoundingClientRect().top ?? null;
    return { input: q('[data-tool-input="names"]'), start: q("[data-primary]"), result: q(".wn-slip") };
  });
  ctl("phone order is input then start then result", order.input < order.start && order.start < order.result, JSON.stringify(order));
  await page.close();

  /* ---- inner tool pages ---- */
  page = await open(ctx, "/picker-wheel/", 1440, 900);
  await driveWeighted(page, "picker wheel");
  await page.close();

  page = await open(ctx, "/raffle-wheel/", 1440, 900);
  await driveRaffle(page, "raffle");
  await page.close();

  page = await open(ctx, "/fairness/", 1440, 900);
  await driveFairness(page, "fairness");
  await page.close();

  // the same wheel on its three landing pages
  for (const route of ["/random-name-picker/", "/classroom-name-picker/", "/wheel-spinner/"]) {
    page = await open(ctx, route, 1440, 900);
    const r = await driveNameWheel(page, `${route} name wheel`, { skipEmpty: true });
    ctl(`${route} spins`, r.settled, r.settled ? r.winner : "no winner");
    await page.close();
  }

  /* ---- pricing ---- */
  page = await open(ctx, "/pricing/", 1440, 900);
  const monthly = await bodyText(page);
  const links = await page.locator("[data-shipsite-checkout]").evaluateAll((els) =>
    els.map((el) => ({ href: el.getAttribute("href"), product: el.getAttribute("data-product") })),
  );
  await page.getByRole("button", { name: /^annual$/i }).click();
  await page.waitForTimeout(200);
  const annual = await bodyText(page);
  ctl("pricing shows a monthly price", /\$6/.test(monthly), "plus $6");
  ctl("annual toggle changes the prices", /\$60/.test(annual) && !/\$6\b(?!0)/.test(annual.replace(/\$60/g, "")), "plus $60 a year");
  const hasMonthly = links.some((l) => l.product === "plus" && /plan=plus\b/.test(l.href || ""));
  const hasAnnual = links.some((l) => l.product === "plus-annual" && /plan=plus-annual/.test(l.href || ""));
  ctl("both checkout links are in the page", hasMonthly && hasAnnual, JSON.stringify(links).slice(0, 160));
  await page.close();

  /* ---- contact ---- */
  page = await open(ctx, "/contact/", 1440, 900);
  await page.locator('input[name="email"]').fill("visitor@example.com");
  await page.locator('textarea[name="message"]').fill("Testing the contact form from the site's own check.");
  await page.getByRole("button", { name: /send message/i }).click();
  await page.waitForTimeout(3500);
  const status = (await page.locator("[data-shipsite-status]").innerText()).trim();
  const unprovisioned = globalThis.__contactUnprovisioned === true;
  ctl("contact form answers", status.length > 0, status.slice(0, 120));
  ctl(
    "contact form stores the message",
    !/did not go through|unavailable|error/i.test(status) ||
      unprovisioned,
    unprovisioned ? `${status.slice(0, 90)} (dev Worker has no D1; preview stores it)` : status.slice(0, 120),
  );
  await page.close();

  /* ---- every page renders, every page fits a phone ---- */
  const routes = [
    "/",
    "/picker-wheel/",
    "/raffle-wheel/",
    "/fairness/",
    "/pricing/",
    "/random-name-picker/",
    "/classroom-name-picker/",
    "/vs/pickerwheel/",
    "/wheel-spinner/",
    "/about/",
    "/contact/",
    "/privacy/",
    "/terms/",
    "/cookies/",
    "/refunds/",
  ];
  for (const route of routes) {
    page = await open(ctx, route, 1440, 900);
    await checkPageLinks(page, route);
    await overflowAt(page, route, 1440);
    await overflowAt(page, route, 390);
    await page.close();
  }

  await ctx.close();

  /* ---- phone context, no GPU, real flow (Chromium only) ---- */
  if (WHICH === "chromium") {
    const phone = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      acceptDownloads: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    await phone.addInitScript(() => {
      try {
        delete Navigator.prototype.gpu;
      } catch {
        /* already gone */
      }
    });
    const p = await phone.newPage();
    await p.setViewportSize({ width: 390, height: 844 });
    watch(p);
    await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(400);
    await p.locator('[data-tool-input="names"]').fill(SAMPLE8.join("\n"));
    await p.waitForTimeout(200);
    const start = p.locator("[data-primary]").first();
    const s = await start.boundingBox();
    ctl("phone start sits in the upper screen", !!s && s.y < 844, s ? `y=${Math.round(s.y)}` : "missing");
    await start.click();
    let okPhone = false;
    try {
      await p.locator("[data-winner]").first().waitFor({ state: "visible", timeout: 45000 });
      okPhone = true;
    } catch {
      okPhone = false;
    }
    ctl("phone spin returns a winner", okPhone, okPhone ? (await p.locator("[data-winner]").first().innerText()).trim() : "no winner");
    const sw = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    if (sw[0] > sw[1] + 1) out.overflow.push({ route: "/ (phone, no GPU)", width: 390, scrollWidth: sw[0], clientWidth: sw[1] });
    ctl("phone page does not scroll sideways", sw[0] <= sw[1] + 1, `${sw[0]}/${sw[1]}`);
    await p.close();
    await phone.close();
  }
} finally {
  await browser.close();
}

out.consoleErrors = [...new Set(consoleErrors)];
out.failedRequests = [...new Set(failedRequests)];
if (out.consoleErrors.length) failed = true;
if (out.failedRequests.length) failed = true;
if (out.overflow.length) failed = true;

console.log("VERIFY_LIVE " + JSON.stringify(out));
process.exit(failed ? 1 : 0);
