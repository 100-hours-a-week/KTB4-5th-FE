import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

const option = (name, fallback) => process.argv.find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const bases = { a: option("a", "http://localhost:3013"), b: option("b", "http://localhost:3014"), c: option("c", "http://localhost:3015") };
const viaNginx = process.argv.includes("--nginx");
const runs = Number(option("n", "10"));
const backendPort = Number(option("backend-port", "3020"));
const only = option("only", "");
const variants = option("variants", "a,b").split(",");
const out = path.resolve(option("out", "scripts/perf/out/expiration-calendar"));
fs.mkdirSync(out, { recursive: true });

const networks = {
  slow4g: { latency: 562.5, bytesPerMs: 184.32 },
  fast4g: { latency: 165, bytesPerMs: 1125 },
};
const routes = { manual: "/refrigerator/register/manual", edit: "/refrigerator/ingredients/1/edit" };
const conditions = [
  { name: "manual-fast4g", route: "manual", network: "fast4g" },
  { name: "manual-slow4g", route: "manual", network: "slow4g" },
  { name: "edit-fast4g", route: "edit", network: "fast4g" },
  { name: "edit-slow4g", route: "edit", network: "slow4g" },
  { name: "nav-manual-fast4g", route: "manual", network: "fast4g", from: "/refrigerator/register" },
  { name: "nav-manual-slow4g", route: "manual", network: "slow4g", from: "/refrigerator/register" },
  { name: "nav-edit-fast4g", route: "edit", network: "fast4g", from: "/refrigerator/ingredients/1" },
  { name: "nav-edit-slow4g", route: "edit", network: "slow4g", from: "/refrigerator/ingredients/1" },
].filter((c) => (only ? only.split(",").includes(c.name) : true));

const isoDate = (offset) => new Date(Date.now() + 9 * 3600000 + offset * 86400000).toISOString().slice(0, 10);
const envelope = (data) => JSON.stringify({ code: "PERF-200-001", message: "OK", data });
const items = Array.from({ length: 10 }, (_, i) => ({ ingredientId: String(i + 1), name: `재료 ${i + 1}`, category: "VEGETABLE", quantity: 1, weightValue: null, weightUnit: "NONE", storageType: "REFRIGERATED", expirationDate: isoDate(10), status: "NORMAL", daysUntilExpiration: 10 }));
function respond(url) {
  if (/^\/api\/v1\/ingredients\/[^/]+$/.test(url.pathname)) return envelope({ baseDate: isoDate(0), ingredientId: "1", name: "두부", category: "TOFU_BEAN", storageType: "REFRIGERATED", measureType: "COUNT", quantity: 1, weightValue: null, weightUnit: "NONE", expirationDate: isoDate(10), createdDate: isoDate(-1), status: "NORMAL", daysUntilExpiration: 10 });
  if (/\/refrigerators\/[^/]+\/ingredients$/.test(url.pathname)) return envelope({ baseDate: isoDate(0), outdated: false, refrigeratorName: "성능 측정", ingredientsNum: items.length, filteredCount: items.length, refrigeratorCapacity: 100, ingredients: items, nextCursor: null });
  if (url.pathname.endsWith("/image-analyses")) return envelope({ analyses: [] });
  if (url.pathname.endsWith("/refrigerators/current")) return envelope([{ refrigeratorId: 1, name: "성능 측정", capacity: 100, expiredCount: 0 }]);
  if (url.pathname.endsWith("/notifications/stream")) return envelope({ notificationId: null });
  if (url.pathname.endsWith("/notifications/unread-count")) return envelope({ refrigeratorId: "1", unreadCount: 0 });
  return envelope({});
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const backend = http.createServer((req, res) => {
  const body = /accessToken=/.test(req.headers.cookie ?? "") ? respond(new URL(req.url, "http://backend")) : null;
  res.writeHead(body ? 200 : 401, { "content-type": "application/json" });
  res.end(body ?? "{}");
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
  if (sd === 0) return 1;
  const z = (Math.abs(rankB - (n2 * (n2 + 1)) / 2 - (n1 * n2) / 2) - 0.5) / sd;
  return 2 * (1 - 0.5 * (1 + Math.sqrt(1 - Math.exp((-2 * z * z) / Math.PI))));
}

async function sample(browser, condition, variant, shot) {
  const base = bases[variant];
  const network = networks[condition.network];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "block", ignoreHTTPSErrors: true });
  await context.addCookies([
    { name: "accessToken", value: "local-perf-fixture", url: base },
    { name: "currentRefrigeratorId", value: "1", url: base },
    { name: "XSRF-TOKEN", value: "perf", url: base },
  ]);
  if (!viaNginx) await context.route("**/api/v1/**", async (route) => {
    const body = respond(new URL(route.request().url()));
    await sleep(network.latency + body.length / network.bytesPerMs);
    await route.fulfill({ status: 200, contentType: "application/json", headers: { etag: '"perf"' }, body });
  });
  await context.addInitScript(() => {
    localStorage.setItem("dameokja.currentRefrigeratorId", "1");
    const m = { tap: null, gridPaint: null, inputPaint: null, fcp: null, lcp: null };
    window.__cal = m;
    new MutationObserver(() => {
      if (m.inputPaint === null && document.querySelector('button > span[id$="-value"]')) { m.inputPaint = -1; requestAnimationFrame(() => setTimeout(() => { m.inputPaint = performance.now(); }, 0)); }
      const grid = document.querySelector('[role="dialog"] [role="grid"]');
      if (!grid) { m.gridPaint = null; return; }
      if (m.gridPaint === null) { m.gridPaint = -1; requestAnimationFrame(() => setTimeout(() => { m.gridPaint = performance.now(); }, 0)); }
    }).observe(document, { childList: true, subtree: true });
    addEventListener("pointerdown", () => { m.tap = performance.now(); }, { capture: true });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (e.name === "first-contentful-paint") m.fcp = e.startTime; }).observe({ type: "paint", buffered: true });
    new PerformanceObserver((list) => { const e = list.getEntries().at(-1); if (e) m.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  const page = await context.newPage();
  const scripts = [];
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack?.split("\n").slice(0, 3).join(" | ")));
  page.on("console", (message) => message.type() === "error" && pageErrors.push(message.text().slice(0, 300)));
  let phase = "initial";
  page.on("response", async (response) => {
    if (response.request().resourceType() !== "script") return;
    const entry = { url: response.url(), phase, rdp: false };
    scripts.push(entry);
    entry.rdp = await response.text().then((t) => t.includes("rdp-")).catch(() => false);
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: network.latency, downloadThroughput: network.bytesPerMs * 1000, uploadThroughput: network.bytesPerMs * 1000 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const input = page.locator('button:has(> span[id$="-value"])').first();
  const openCalendar = async () => {
    await page.evaluate(() => { window.__cal.gridPaint = null; });
    await input.click();
    await page.waitForFunction(() => window.__cal.gridPaint > 0, null, { timeout: 60000 });
    return page.evaluate(() => window.__cal.gridPaint - window.__cal.tap);
  };
  try {
    await page.goto(`${base}${condition.from ?? routes[condition.route]}`, { waitUntil: "load", timeout: 60000 });
    let nav = null;
    if (condition.from) {
      const link = page.locator(`a[href="${routes[condition.route]}"]`).first();
      await link.waitFor({ timeout: 30000 });
      await page.waitForTimeout(1500);
      const navMark = await page.evaluate(() => performance.now());
      phase = "nav";
      await link.click();
      await page.waitForFunction(() => window.__cal.inputPaint > 0, null, { timeout: 60000 });
      nav = await page.evaluate((from) => {
        const js = performance.getEntriesByType("resource").filter((e) => (e.initiatorType === "script" || /\.js(\?|$)/.test(e.name)) && e.startTime >= from);
        return { ms: window.__cal.inputPaint - window.__cal.tap, jsBytes: js.reduce((a, e) => a + e.transferSize, 0) };
      }, navMark);
      phase = "initial";
    }
    await input.waitFor({ timeout: 30000 });
    await page.waitForTimeout(1500);
    const initial = await page.evaluate(() => {
      const js = performance.getEntriesByType("resource").filter((e) => e.initiatorType === "script" || /\.js(\?|$)/.test(e.name));
      const nav = performance.getEntriesByType("navigation")[0];
      const all = [nav, ...performance.getEntriesByType("resource")];
      const api = all.filter((e) => e.name.includes("/api/v1/") && e.responseStart > 0);
      return { jsBytes: js.reduce((a, e) => a + e.transferSize, 0), jsCount: js.length, jsBeforeLoadBytes: js.filter((e) => e.responseEnd <= nav.loadEventStart).reduce((a, e) => a + e.transferSize, 0), loadMs: nav.loadEventEnd, fcpMs: window.__cal.fcp, lcpMs: window.__cal.lcp, mark: performance.now(), h2Share: all.filter((e) => e.nextHopProtocol === "h2").length / all.length, apiTtfbMs: api.length ? Math.min(...api.map((e) => e.responseStart - e.requestStart)) : null };
    });
    if (shot) await page.screenshot({ path: path.join(out, `${shot}-form.png`) });
    phase = "lazy";
    const firstOpenMs = await openCalendar();
    await page.waitForTimeout(1000);
    if (shot) await page.screenshot({ path: path.join(out, `${shot}-calendar.png`) });
    const lazy = await page.evaluate((from) => {
      const js = performance.getEntriesByType("resource").filter((e) => (e.initiatorType === "script" || /\.js(\?|$)/.test(e.name)) && e.startTime >= from);
      return { jsBytes: js.reduce((a, e) => a + e.transferSize, 0), jsCount: js.length };
    }, initial.mark);
    await page.locator('[role="dialog"] button', { hasText: "닫기" }).click();
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), null, { timeout: 10000 });
    await page.waitForTimeout(800);
    const reopenMs = await openCalendar();
    return {
      navMs: nav?.ms ?? null,
      navJsKB: nav ? nav.jsBytes / 1024 : null,
      h2Share: initial.h2Share,
      apiTtfbMs: initial.apiTtfbMs,
      initialJsKB: initial.jsBytes / 1024,
      jsBeforeLoadKB: initial.jsBeforeLoadBytes / 1024,
      initialJsCount: initial.jsCount,
      calendarInInitial: scripts.some((s) => s.phase === "initial" && s.rdp) ? 1 : 0,
      calendarInLazy: scripts.some((s) => s.phase === "lazy" && s.rdp) ? 1 : 0,
      lazyFiles: scripts.filter((s) => s.phase === "lazy").map((s) => s.url.split("/").pop()).join(","),
      loadMs: initial.loadMs,
      fcpMs: initial.fcpMs,
      lcpMs: initial.lcpMs,
      lazyJsKB: lazy.jsBytes / 1024,
      lazyJsCount: lazy.jsCount,
      firstOpenMs,
      reopenMs,
    };
  } catch (error) {
    await page.screenshot({ path: path.join(out, `fail-${condition.name}-${variant}.png`) }).catch(() => null);
    throw new Error(`${error.message.split("\n")[0]} ${pageErrors.join(" / ")}`);
  } finally {
    await context.close();
  }
}

const metrics = ["navMs", "navJsKB", "h2Share", "initialJsKB", "jsBeforeLoadKB", "initialJsCount", "calendarInInitial", "calendarInLazy", "loadMs", "fcpMs", "lcpMs", "lazyJsKB", "lazyJsCount", "firstOpenMs", "reopenMs"];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const rows = [];
try {
  for (const condition of conditions) {
    for (const variant of variants) await sample(browser, condition, variant, `${condition.name}-${variant}`).catch((error) => console.log("warmup 실패", condition.name, variant, error.message));
    for (let run = 1; run <= runs; run++) {
      for (const variant of run % 2 ? variants : [...variants].reverse()) {
        const row = await sample(browser, condition, variant).catch((error) => ({ error: error.message }));
        rows.push({ condition: condition.name, variant, run, ...row });
        console.log(condition.name, variant, run, row.error ?? metrics.map((k) => `${k}=${Number(row[k]).toFixed(k.endsWith("KB") ? 1 : 0)}`).join(" "));
      }
    }
  }
} finally {
  await browser.close();
  backend.close();
}

const summary = {};
for (const condition of conditions) {
  summary[condition.name] = {};
  for (const k of metrics) {
    const pick = (v) => rows.filter((r) => r.condition === condition.name && r.variant === v && Number.isFinite(r[k])).map((r) => r[k]);
    const s = (v) => (v.length ? { n: v.length, p50: q(v, 0.5), min: Math.min(...v), max: Math.max(...v) } : null);
    const base = pick(variants[0]);
    summary[condition.name][k] = Object.fromEntries(variants.map((v) => {
      const x = pick(v);
      return [v, { ...s(x), p: v !== variants[0] && base.length && x.length ? mannWhitney(base, x) : null }];
    }));
  }
}
fs.writeFileSync(path.join(out, "raw.json"), JSON.stringify(rows, null, 2));
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(summary, null, 2));
for (const [name, m] of Object.entries(summary)) {
  console.log(`\n${name}`);
  const f = (v) => (v ? `${v.p50.toFixed(1)} [${v.min.toFixed(1)}-${v.max.toFixed(1)}]` : "-");
  for (const [k, v] of Object.entries(m)) console.log(`  ${k.padEnd(18)} ${variants.map((x) => `${x} ${f(v[x]?.n ? v[x] : null)}${v[x]?.p != null ? ` (p=${v[x].p.toFixed(4)})` : ""}`).join("  ")}`);
}
