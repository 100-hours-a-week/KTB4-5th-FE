import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

const option = (name, fallback) => process.argv.find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const bases = { a: option("a", "http://localhost:3013"), b: option("b", "http://localhost:3014") };
const runs = Number(option("n", "10"));
const fixture = Number(option("fixture", "1000"));
const backendPort = Number(option("backend-port", "3020"));
const only = option("only", "");
const variants = option("variants", "a,b").split(",");
const out = path.resolve(option("out", "scripts/perf/out/refrigerator-entry"));
fs.mkdirSync(path.join(out, "traces"), { recursive: true });

const networks = {
  slow4g: { latency: 562.5, bytesPerMs: 184.32 },
  fast4g: { latency: 165, bytesPerMs: 1125 },
};
const conditions = [
  { name: "entry-slow4g", scenario: "entry", network: "slow4g", backendDelay: 20 },
  { name: "entry-fast4g", scenario: "entry", network: "fast4g", backendDelay: 20 },
  { name: "tab-slow4g", scenario: "tab", network: "slow4g", backendDelay: 20 },
  { name: "tab-fast4g", scenario: "tab", network: "fast4g", backendDelay: 20 },
  { name: "entry-backend500", scenario: "entry", network: "slow4g", backendDelay: 500 },
  { name: "entry-backend3000", scenario: "entry", network: "slow4g", backendDelay: 3000 },
  { name: "entry-nocookie", scenario: "entry", network: "slow4g", backendDelay: 20, noState: true },
  { name: "dispose-slow4g-100", scenario: "dispose", network: "slow4g", backendDelay: 20, fixture: 400, optIn: true },
  { name: "dispose-slow4g-450", scenario: "dispose", network: "slow4g", backendDelay: 20, fixture: 1800, optIn: true },
  { name: "dispose-fast4g-450", scenario: "dispose", network: "fast4g", backendDelay: 20, fixture: 1800, optIn: true },
].filter((c) => (only ? only.split(",").includes(c.name) : !c.optIn));

const card = 'section[aria-label="재고 목록"] a[href^="/refrigerator/ingredients/"]';
const statuses = ["NORMAL", "NORMAL", "EXPIRING_SOON", "EXPIRED"];
const categories = ["VEGETABLE", "FRUIT", "MEAT"];
const makeItems = (count) => Array.from({ length: count }, (_, i) => {
  const status = statuses[i % 4];
  return { ingredientId: String(i + 1), name: `재료 ${String(i + 1).padStart(4, "0")}`, category: categories[i % 3], quantity: 1, weightValue: null, weightUnit: "NONE", storageType: i % 3 === 2 ? "FROZEN" : "REFRIGERATED", status, daysUntilExpiration: status === "EXPIRED" ? -1 : status === "EXPIRING_SOON" ? 2 : 10 };
});
let items = makeItems(fixture);
const envelope = (data) => JSON.stringify({ code: "PERF-200-001", message: "OK", data });
function respond(url) {
  if (/\/refrigerators\/[^/]+\/ingredients$/.test(url.pathname)) {
    const filter = url.searchParams.get("filter");
    const category = url.searchParams.get("category");
    const matched = items.filter((x) => (!category || x.category === category) && (!filter || (filter === "REFRIGERATED" || filter === "FROZEN" ? x.storageType === filter : x.status === filter)));
    const cursor = Number(url.searchParams.get("cursor") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 10);
    return envelope({ ingredientsNum: items.length, filteredCount: matched.length, refrigeratorCapacity: Math.max(100, items.length), ingredients: matched.slice(cursor, cursor + size), nextCursor: cursor + size < matched.length ? String(cursor + size) : null });
  }
  if (url.pathname.endsWith("/refrigerators/current")) return envelope([{ refrigeratorId: 1, name: "성능 측정", capacity: Math.max(100, fixture), expiredCount: 0 }]);
  if (url.pathname.endsWith("/notifications/stream")) return envelope({ notificationId: null });
  if (url.pathname.endsWith("/notifications/unread-count")) return envelope({ refrigeratorId: "1", unreadCount: 0 });
  return envelope({});
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let backendDelay = 20;
let backendHits = 0;
const backend = http.createServer((req, res) => {
  backendHits++;
  const body = /accessToken=/.test(req.headers.cookie ?? "") ? respond(new URL(req.url, "http://backend")) : null;
  setTimeout(() => {
    res.writeHead(body ? 200 : 401, { "content-type": "application/json" });
    res.end(body ?? "{}");
  }, backendDelay);
});
await new Promise((resolve) => backend.listen(backendPort, resolve));

const q = (values, p) => {
  const v = [...values].sort((x, y) => x - y);
  const i = (v.length - 1) * p;
  const l = Math.floor(i);
  return v[l] + (v[Math.ceil(i)] - v[l]) * (i - l);
};
function mannWhitney(a, b) {
  const all = [...a.map((x) => [x, 0]), ...b.map((x) => [x, 1])].sort((x, y) => x[0] - y[0]);
  let r = 0, rankB = 0, ties = 0;
  while (r < all.length) {
    let e = r;
    while (e + 1 < all.length && all[e + 1][0] === all[r][0]) e++;
    const t = e - r + 1;
    ties += t ** 3 - t;
    for (let i = r; i <= e; i++) if (all[i][1]) rankB += (r + e + 2) / 2;
    r = e + 1;
  }
  const n1 = a.length, n2 = b.length;
  const sd = Math.sqrt((n1 * n2) / 12 * (n1 + n2 + 1 - ties / ((n1 + n2) * (n1 + n2 - 1))));
  const z = (Math.abs(rankB - (n2 * (n2 + 1)) / 2 - (n1 * n2) / 2) - 0.5) / sd;
  return 2 * (1 - 0.5 * (1 + Math.sqrt(1 - Math.exp((-2 * z * z) / Math.PI))));
}

async function sample(browser, condition, variant, trace) {
  const base = bases[variant];
  const network = networks[condition.network];
  backendDelay = condition.backendDelay;
  if (items.length !== (condition.fixture ?? fixture)) items = makeItems(condition.fixture ?? fixture);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  const cookies = [{ name: "accessToken", value: "local-perf-fixture", url: base }];
  if (!condition.noState) cookies.push({ name: "currentRefrigeratorId", value: "1", url: base });
  await context.addCookies(cookies);
  await context.route("**/api/v1/**", async (route) => {
    const body = respond(new URL(route.request().url()));
    await sleep(network.latency + body.length / network.bytesPerMs);
    await route.fulfill({ status: 200, contentType: "application/json", body });
  });
  await context.addInitScript(({ card, noState }) => {
    if (!noState) localStorage.setItem("dameokja.currentRefrigeratorId", "1");
    const m = { tap: null, cardDom: null, cardPaint: null, fcp: null, lcp: null, cls: 0, sheetDom: null, sheetPaint: null, sheetFull: null, events: [], longTasks: [] };
    window.__entry = m;
    new MutationObserver(() => {
      const open = [...document.querySelectorAll('[role="dialog"]')].some((e) => e.textContent.includes("정리할 재료를 확인해 주세요"));
      if (!open) { m.sheetDom = null; m.sheetPaint = null; m.sheetFull = null; return; }
      if (m.sheetDom === null) {
        m.sheetDom = performance.now();
        requestAnimationFrame(() => setTimeout(() => { m.sheetPaint = performance.now(); }, 0));
      }
      if (m.sheetFull !== null) return;
      const ready = [...document.querySelectorAll('[role="dialog"] button')].some((e) => /^\d+종 폐기하기$/.test(e.textContent.trim()) && !e.disabled);
      if (ready) { m.sheetFull = -1; requestAnimationFrame(() => setTimeout(() => { m.sheetFull = performance.now(); }, 0)); }
    }).observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["disabled"] });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (e.interactionId) m.events.push({ start: e.startTime, duration: e.duration }); }).observe({ type: "event", durationThreshold: 16, buffered: true });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) m.longTasks.push({ start: e.startTime, duration: e.duration }); }).observe({ type: "longtask", buffered: true });
    const check = () => {
      if (m.cardDom !== null || !document.querySelector(card)) return;
      m.cardDom = performance.now();
      requestAnimationFrame(() => setTimeout(() => { m.cardPaint = performance.now(); }, 0));
    };
    new MutationObserver(check).observe(document, { childList: true, subtree: true });
    addEventListener("pointerdown", () => { m.tap = performance.now(); m.cardDom = null; m.cardPaint = null; check(); }, { capture: true });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (e.name === "first-contentful-paint") m.fcp = e.startTime; }).observe({ type: "paint", buffered: true });
    new PerformanceObserver((list) => { const e = list.getEntries().at(-1); if (e) m.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) m.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  }, { card, noState: Boolean(condition.noState) });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: network.latency, downloadThroughput: network.bytesPerMs * 1000, uploadThroughput: network.bytesPerMs * 1000 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const hitsBefore = backendHits;
  try {
    if (condition.scenario === "tab") {
      await page.goto(`${base}/`, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(2500);
    }
    if (trace) await browser.startTracing(page, { path: trace, screenshots: true, categories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "disabled-by-default-devtools.screenshot", "blink.user_timing", "loading", "latencyInfo", "v8.execute", "disabled-by-default-v8.cpu_profiler"] });
    if (condition.scenario === "dispose") {
      const r = await dispose(page, base);
      if (trace) await browser.stopTracing();
      return { ...r, serverFetches: backendHits - hitsBefore };
    }
    if (condition.scenario === "tab") await page.locator('a[href="/refrigerator"]').first().click();
    else await page.goto(`${base}/refrigerator`, { waitUntil: "commit", timeout: 60000 });
    await page.waitForFunction(() => window.__entry?.cardPaint !== null, null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    if (trace) await browser.stopTracing();
    return await page.evaluate(({ scenario }) => {
      const m = window.__entry;
      const nav = performance.getEntriesByType("navigation")[0];
      const from = scenario === "tab" ? m.tap : 0;
      const api = performance.getEntriesByType("resource").filter((e) => /\/ingredients\?/.test(e.name) && e.startTime >= from && e.startTime < m.cardDom);
      const rsc = performance.getEntriesByType("resource").filter((e) => /_rsc=/.test(e.name) && e.startTime >= from && e.startTime < m.cardDom);
      return {
        ttfbMs: scenario === "tab" ? rsc[0]?.responseStart - rsc[0]?.startTime : nav.responseStart,
        htmlMs: scenario === "tab" ? rsc[0]?.responseEnd - rsc[0]?.startTime : nav.responseEnd,
        fcpMs: m.fcp,
        lcpMs: m.lcp,
        firstCardMs: m.cardPaint - from,
        apiBeforeCard: api.length,
        cls: m.cls,
      };
    }, { scenario: condition.scenario }).then((r) => ({ ...r, serverFetches: backendHits - hitsBefore }));
  } finally {
    await context.close();
  }
}

async function dispose(page, base) {
  await page.goto(`${base}/refrigerator`, { waitUntil: "commit", timeout: 60000 });
  await page.waitForFunction(() => window.__entry?.cardPaint !== null, null, { timeout: 30000 });
  await page.waitForLoadState("load", { timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.locator('[role="group"][aria-label="재고 필터"] button').filter({ hasText: /^만료$/ }).click();
  const banner = page.locator("button", { hasText: "한 번에 정리하기" });
  await banner.waitFor({ timeout: 30000 }).catch(async (error) => {
    await page.screenshot({ path: path.join(out, "dispose-fail.png") });
    throw error;
  });
  await page.waitForTimeout(3000);
  const open = async () => {
    const from = await page.evaluate(() => performance.now());
    await banner.click();
    await page.waitForFunction(() => window.__entry.sheetPaint !== null && window.__entry.sheetFull > 0, null, { timeout: 300000 });
    await page.waitForTimeout(1000);
    return from;
  };
  const firstFrom = await open();
  const first = await page.evaluate((from) => {
    const m = window.__entry;
    const inWindow = (e, a, b) => e.start >= a && e.start < b;
    return {
      tapToSheetMs: m.sheetPaint - m.tap,
      tapToFullMs: m.sheetFull - m.tap,
      apiAfterTap: performance.getEntriesByType("resource").filter((e) => /ingredients\?/.test(e.name) && e.startTime >= m.tap && e.startTime < m.sheetFull).length,
      longTaskMs: m.longTasks.filter((e) => inWindow(e, m.tap, m.sheetFull)).reduce((a, e) => a + e.duration, 0),
      bannerInpMs: Math.max(0, ...m.events.filter((e) => inWindow(e, from, m.sheetDom)).map((e) => e.duration)),
    };
  }, firstFrom);
  const closeFrom = await page.evaluate(() => performance.now());
  await page.locator('[role="dialog"] button', { hasText: "취소" }).click();
  await page.waitForFunction(() => window.__entry.sheetDom === null, null, { timeout: 10000 });
  await page.waitForTimeout(1000);
  const reopenFrom = await open();
  const second = await page.evaluate(({ closeFrom, reopenFrom }) => {
    const m = window.__entry;
    const max = (a, b) => Math.max(0, ...m.events.filter((e) => e.start >= a && e.start < b).map((e) => e.duration));
    return { closeInpMs: max(closeFrom, reopenFrom), reopenInpMs: max(reopenFrom, Infinity), reopenToSheetMs: m.sheetPaint - m.tap, reopenToFullMs: m.sheetFull - m.tap, inpMs: Math.max(0, ...m.events.map((e) => e.duration)) };
  }, { closeFrom, reopenFrom });
  return { ...first, ...second };
}

const entryMetrics = ["firstCardMs", "ttfbMs", "htmlMs", "fcpMs", "lcpMs", "apiBeforeCard", "serverFetches", "cls"];
const disposeMetrics = ["tapToSheetMs", "tapToFullMs", "apiAfterTap", "serverFetches", "longTaskMs", "bannerInpMs", "closeInpMs", "reopenInpMs", "reopenToSheetMs", "reopenToFullMs", "inpMs"];
const metricsFor = (condition) => (condition.scenario === "dispose" ? disposeMetrics : entryMetrics);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const rows = [];
try {
  for (const condition of conditions) {
    const metrics = metricsFor(condition);
    for (const variant of variants) await sample(browser, condition, variant).catch(() => null);
    for (let run = 1; run <= runs; run++) {
      for (const variant of run % 2 ? variants : [...variants].reverse()) {
        const row = await sample(browser, condition, variant).catch((error) => ({ error: error.message }));
        rows.push({ condition: condition.name, variant, run, ...row });
        console.log(condition.name, variant, run, row.error ?? metrics.map((k) => `${k}=${Number(row[k]).toFixed(k === "cls" ? 3 : 0)}`).join(" "));
      }
    }
    for (const variant of variants) await sample(browser, condition, variant, path.join(out, "traces", `${condition.name}-${variant}.json`)).catch((error) => console.log("trace 실패", condition.name, variant, error.message));
  }
} finally {
  await browser.close();
  backend.close();
}

const summary = {};
for (const condition of conditions) {
  summary[condition.name] = {};
  for (const k of metricsFor(condition)) {
    const pick = (v) => rows.filter((r) => r.condition === condition.name && r.variant === v && Number.isFinite(r[k])).map((r) => r[k]);
    const s = (v) => (v.length ? { n: v.length, p50: q(v, 0.5), min: Math.min(...v), max: Math.max(...v) } : null);
    const a = pick("a"), b = pick("b");
    summary[condition.name][k] = { a: s(a), b: s(b), p: a.length && b.length ? mannWhitney(a, b) : null };
  }
}
fs.writeFileSync(path.join(out, "raw.json"), JSON.stringify(rows, null, 2));
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(summary, null, 2));
for (const [name, m] of Object.entries(summary)) {
  console.log(`\n${name}`);
  const f = (v) => (v ? `${v.p50.toFixed(0)} [${v.min.toFixed(0)}-${v.max.toFixed(0)}]` : "-");
  for (const [k, v] of Object.entries(m)) console.log(`  ${k.padEnd(16)} a ${f(v.a)}  b ${f(v.b)}  p=${v.p?.toFixed(4) ?? "-"}`);
}
