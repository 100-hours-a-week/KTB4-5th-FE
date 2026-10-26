import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

const option = (name, fallback) => process.argv.find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const bases = { a: option("a", "http://localhost:3013"), b: option("b", "http://localhost:3014") };
const runs = Number(option("n", "10"));
const fixture = Number(option("fixture", "1000"));
const backendPort = Number(option("backend-port", "3020"));
const keyword = option("keyword", "001");
const keyDelay = Number(option("key-delay", "120"));
const heavyCards = Number(option("heavy-cards", "0"));
const out = path.resolve(option("out", "scripts/perf/out/search-deferred"));
const network = { latency: 562.5, bytesPerMs: 184.32 };
fs.mkdirSync(out, { recursive: true });

const statuses = ["NORMAL", "NORMAL", "EXPIRING_SOON", "EXPIRED"];
const categories = ["VEGETABLE", "FRUIT", "MEAT"];
const items = Array.from({ length: fixture }, (_, i) => {
  const status = statuses[i % 4];
  return { ingredientId: String(i + 1), name: `재료 ${String(i + 1).padStart(4, "0")}`, category: categories[i % 3], quantity: 1, weightValue: null, weightUnit: "NONE", storageType: i % 3 === 2 ? "FROZEN" : "REFRIGERATED", status, daysUntilExpiration: status === "EXPIRED" ? -1 : status === "EXPIRING_SOON" ? 2 : 10 };
});
const envelope = (data) => JSON.stringify({ code: "PERF-200-001", message: "OK", data });
function respond(url) {
  if (/\/refrigerators\/[^/]+\/ingredients$/.test(url.pathname)) {
    const filter = url.searchParams.get("filter");
    const category = url.searchParams.get("category");
    const kw = url.searchParams.get("keyword");
    const matched = items.filter((x) => (!kw || x.name.includes(kw)) && (!category || x.category === category) && (!filter || (filter === "REFRIGERATED" || filter === "FROZEN" ? x.storageType === filter : x.status === filter)));
    const cursor = Number(url.searchParams.get("cursor") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 10);
    return envelope({ baseDate: new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10), outdated: false, ingredientsNum: items.length, filteredCount: matched.length, refrigeratorCapacity: items.length, refrigeratorName: "성능 측정", ingredients: matched.slice(cursor, cursor + size), nextCursor: cursor + size < matched.length ? String(cursor + size) : null });
  }
  if (url.pathname.endsWith("/refrigerators/current")) return envelope([{ refrigeratorId: 1, name: "성능 측정", capacity: fixture, expiredCount: 0 }]);
  if (url.pathname.endsWith("/notifications/unread-count")) return envelope({ refrigeratorId: "1", unreadCount: 0 });
  return envelope({});
}
const backend = http.createServer((req, res) => {
  const body = /accessToken=/.test(req.headers.cookie ?? "") ? respond(new URL(req.url, "http://backend")) : null;
  setTimeout(() => {
    res.writeHead(body ? 200 : 401, { "content-type": "application/json" });
    res.end(body ?? "{}");
  }, 20);
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
  if (!sd) return 1;
  const z = (Math.abs(rankB - (n2 * (n2 + 1)) / 2 - (n1 * n2) / 2) - 0.5) / sd;
  return 2 * (1 - 0.5 * (1 + Math.sqrt(1 - Math.exp((-2 * z * z) / Math.PI))));
}

async function sample(browser, variant, record) {
  const base = bases[variant];
  const dir = record ? path.join(out, `record-${variant}`) : null;
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    serviceWorkers: "block",
    ...(dir ? { recordVideo: { dir, size: { width: 390, height: 844 } }, recordHar: { path: path.join(dir, "network.har") } } : {}),
  });
  await context.addCookies([{ name: "accessToken", value: "local-perf-fixture", url: base }, { name: "currentRefrigeratorId", value: "1", url: base }]);
  await context.addInitScript((kw) => {
    const m = { events: [], longTasks: [], lastKey: null, result: null, skeleton: [] };
    window.__search = m;
    let skeletonOn = null;
    new MutationObserver(() => {
      const sk = document.querySelector('[role="status"][aria-label="재고를 불러오는 중입니다"]');
      if (sk && skeletonOn === null) skeletonOn = performance.now();
      if (!sk && skeletonOn !== null) { m.skeleton.push([skeletonOn, performance.now()]); skeletonOn = null; }
      if (m.lastKey === null || m.result !== null) return;
      const cards = [...document.querySelectorAll('section[aria-label="재고 목록"] a[href^="/refrigerator/ingredients/"]')];
      if (cards.length && cards.every((c) => c.textContent.includes(kw))) {
        m.result = -1;
        requestAnimationFrame(() => setTimeout(() => { m.result = performance.now(); }, 0));
      }
    }).observe(document, { childList: true, subtree: true, characterData: true });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (e.interactionId) m.events.push({ name: e.name, start: e.startTime, duration: e.duration, processing: e.processingEnd - e.processingStart }); }).observe({ type: "event", durationThreshold: 16, buffered: true });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) m.longTasks.push({ start: e.startTime, duration: e.duration }); }).observe({ type: "longtask", buffered: true });
  }, keyword);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: network.latency, downloadThroughput: network.bytesPerMs * 1000, uploadThroughput: network.bytesPerMs * 1000 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  try {
    await page.goto(`${base}/refrigerator`, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(3000);
    const cardSelector = 'section[aria-label="재고 목록"] a[href^="/refrigerator/ingredients/"]';
    for (let i = 0; i < 40 && (await page.locator(cardSelector).count()) < heavyCards; i++) {
      await page.locator('section[aria-label="재고 목록"]').evaluate((e) => e.scrollTo(0, e.scrollHeight));
      await page.waitForTimeout(800);
    }
    const cardsBefore = await page.locator(cardSelector).count();
    const input = page.locator("#ingredient-search");
    await input.click();
    if (dir) await browser.startTracing(page, { path: path.join(dir, "trace.json"), screenshots: true, categories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "disabled-by-default-devtools.screenshot", "blink.user_timing", "loading", "latencyInfo", "v8.execute", "disabled-by-default-v8.cpu_profiler"] });
    const typingStart = await page.evaluate(() => performance.now());
    if (heavyCards) {
      await page.keyboard.type(keyword[0]);
      await page.waitForTimeout(330);
      await page.keyboard.type(keyword.slice(1), { delay: 60 });
    } else await page.keyboard.type(keyword, { delay: keyDelay });
    await page.evaluate(() => { window.__search.lastKey = performance.now(); });
    await page.waitForFunction(() => window.__search.result > 0, null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    if (dir) await browser.stopTracing();
    return await page.evaluate(({ typingStart, kw }) => {
      const m = window.__search;
      const end = m.result;
      const inWindow = (e) => e.start >= typingStart && e.start < end;
      const keyEvents = m.events.filter((e) => inWindow(e) && /key|input|beforeinput/.test(e.name));
      const api = performance.getEntriesByType("resource").filter((e) => e.name.includes("/ingredients?") && e.name.includes("keyword=") && e.startTime >= typingStart);
      const skeletonMs = m.skeleton.filter(([on]) => on >= typingStart).reduce((a, [on, off]) => a + off - on, 0);
      return {
        resultMs: m.result - m.lastKey,
        keyMaxMs: Math.max(0, ...keyEvents.map((e) => e.duration)),
        keyCount: keyEvents.length,
        longTaskMs: m.longTasks.filter(inWindow).reduce((a, e) => a + e.duration, 0),
        keywordApiCount: api.length,
        partialKeywordApi: api.filter((e) => !new URL(e.name).searchParams.get("keyword").startsWith(kw)).length,
        skeletonMs,
      };
    }, { typingStart, kw: keyword }).then((r) => ({ ...r, cardsBefore }));
  } finally {
    const video = page.video();
    await context.close();
    if (dir && video) fs.renameSync(await video.path(), path.join(dir, "screen.webm"));
  }
}

const metrics = ["cardsBefore", "resultMs", "keyMaxMs", "longTaskMs", "keywordApiCount", "partialKeywordApi", "skeletonMs"];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const rows = [];
try {
  for (const variant of ["a", "b"]) await sample(browser, variant).catch(() => null);
  for (let run = 1; run <= runs; run++) {
    for (const variant of run % 2 ? ["a", "b"] : ["b", "a"]) {
      const row = await sample(browser, variant).catch((error) => ({ error: error.message }));
      rows.push({ variant, run, ...row });
      console.log(variant, run, row.error ?? metrics.map((k) => `${k}=${Number(row[k]).toFixed(0)}`).join(" "));
    }
  }
  for (const variant of ["a", "b"]) await sample(browser, variant, true).catch((error) => console.log("record 실패", variant, error.message));
} finally {
  await browser.close();
  backend.close();
}

for (const variant of ["a", "b"]) {
  const dir = path.join(out, `record-${variant}`);
  const webm = path.join(dir, "screen.webm");
  if (!fs.existsSync(webm)) continue;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(dir, "screen.mp4")]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", webm, "-vf", "fps=12,scale=390:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", path.join(dir, "screen.gif")]);
}

const summary = {};
for (const k of metrics) {
  const pick = (v) => rows.filter((r) => r.variant === v && Number.isFinite(r[k])).map((r) => r[k]);
  const s = (v) => (v.length ? { n: v.length, p50: q(v, 0.5), p95: q(v, 0.95), p99: q(v, 0.99), min: Math.min(...v), max: Math.max(...v) } : null);
  const a = pick("a"), b = pick("b");
  summary[k] = { a: s(a), b: s(b), p: a.length && b.length ? mannWhitney(a, b) : null };
}
fs.writeFileSync(path.join(out, "raw.json"), JSON.stringify(rows, null, 2));
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(summary, null, 2));
const f = (v) => (v ? `${v.p50.toFixed(0)} p95 ${v.p95.toFixed(0)} p99 ${v.p99.toFixed(0)} [${v.min.toFixed(0)}-${v.max.toFixed(0)}]` : "-");
for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(18)} a ${f(v.a)}  b ${f(v.b)}  p=${v.p?.toFixed(4) ?? "-"}`);
