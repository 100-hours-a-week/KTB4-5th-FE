import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

const option = (name, fallback) => process.argv.find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const live = Object.fromEntries(option("live", "").split(",").filter(Boolean).map((x) => x.split("=")));
const variants = Object.keys(live);
const runs = Number(option("n", "10"));
const block = Number(option("block", "10"));
const record = !process.argv.includes("--no-record");
const out = path.resolve(option("out", "scripts/perf/out/refrigerator-first-load"));
let state = JSON.parse(fs.readFileSync(option("state", ""), "utf8"));
fs.mkdirSync(out, { recursive: true });

const base = "http://localhost:3000";
const cardSelector = 'section[aria-label="재고 목록"] a[href^="/refrigerator/ingredients/"]';
const chipSelector = '[role="group"][aria-label="재고 필터"] > button';

const up = () => new Promise((resolve) => { const req = http.get(`${base}/login`, (res) => { res.resume(); resolve(res.statusCode === 200); }); req.on("error", () => resolve(false)); req.setTimeout(2000, () => { req.destroy(); resolve(false); }); });
let server = null;
async function startServer(variant) {
  for (let i = 0; i < 150 && (await up()); i++) await new Promise((r) => setTimeout(r, 200));
  server = spawn("pnpm", ["exec", "next", "start", "-p", "3000"], { cwd: live[variant], env: { ...process.env, BACKEND_ORIGIN: "http://localhost:8080" }, detached: true, stdio: "ignore" });
  for (let i = 0; i < 100; i++) { if (await up()) return; await new Promise((r) => setTimeout(r, 200)); }
  throw new Error(`server ${variant} not ready`);
}
async function stopServer() {
  if (!server) return;
  try { process.kill(-server.pid, "SIGTERM"); } catch {}
  server = null;
  for (let i = 0; i < 50 && (await up()); i++) await new Promise((r) => setTimeout(r, 200));
}

async function sample(browser, variant, dir) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    serviceWorkers: "block",
    storageState: state,
    ...(dir ? { recordVideo: { dir, size: { width: 390, height: 844 } }, recordHar: { path: path.join(dir, "network.har") } } : {}),
  });
  await context.addInitScript(({ cardSelector, chipSelector }) => {
    const m = { firstCard: null, skeleton: null, hydrated: null, lcp: null, lcpTag: null };
    window.__load = m;
    new MutationObserver(() => {
      const now = performance.now();
      if (m.skeleton === null && document.querySelector('[role="status"][aria-label="재고를 불러오는 중입니다"]')) m.skeleton = now;
      if (m.firstCard === null && document.querySelector(cardSelector)) requestAnimationFrame(() => setTimeout(() => { m.firstCard ??= performance.now(); }, 0));
    }).observe(document, { childList: true, subtree: true });
    const poll = () => {
      const chip = document.querySelector(chipSelector);
      if (chip && Object.keys(chip).some((k) => k.startsWith("__reactProps"))) m.hydrated = performance.now();
      else requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
    new PerformanceObserver((list) => { for (const e of list.getEntries()) { m.lcp = e.startTime; m.lcpTag = `${e.element?.tagName ?? "?"}${e.element?.closest?.('section[aria-label="재고 목록"]') ? "(목록)" : ""}`; } }).observe({ type: "largest-contentful-paint", buffered: true });
  }, { cardSelector, chipSelector });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 184320 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  try {
    if (dir) await browser.startTracing(page, { path: path.join(dir, "trace.json"), screenshots: true, categories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "disabled-by-default-devtools.screenshot", "blink.user_timing", "loading", "latencyInfo", "v8.execute"] });
    await page.goto(`${base}/refrigerator`, { waitUntil: "load", timeout: 90000 });
    await page.waitForFunction(() => window.__load.firstCard && window.__load.hydrated, null, { timeout: 90000 });
    await page.waitForTimeout(1500);
    if (dir) await browser.stopTracing();
    return await page.evaluate(() => {
      const m = window.__load;
      const nav = performance.getEntriesByType("navigation")[0];
      const res = performance.getEntriesByType("resource");
      const list = res.filter((e) => /\/refrigerators\/[^/]+\/ingredients\?/.test(e.name));
      return {
        ttfbMs: nav.responseStart,
        htmlDoneMs: nav.responseEnd,
        fcpMs: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
        lcpMs: m.lcp,
        lcpTag: m.lcpTag,
        firstCardMs: m.firstCard,
        skeletonShown: m.skeleton !== null,
        hydratedMs: m.hydrated,
        lastJsMs: Math.max(0, ...res.filter((e) => e.name.endsWith(".js")).map((e) => e.responseEnd)),
        listApiBeforeCard: list.filter((e) => e.startTime < m.firstCard).length,
        firstListApiStartMs: list.length ? Math.min(...list.map((e) => e.startTime)) : null,
        url: location.pathname,
      };
    });
  } finally {
    state = await context.storageState().catch(() => state);
    fs.writeFileSync(option("state", ""), JSON.stringify(state));
    const video = page.video();
    await context.close();
    if (dir && video) fs.renameSync(await video.path(), path.join(dir, "screen.webm"));
  }
}

const q = (values, p) => { const v = [...values].sort((x, y) => x - y); const i = (v.length - 1) * p; const l = Math.floor(i); return v[l] + (v[Math.ceil(i)] - v[l]) * (i - l); };
function mannWhitney(a, b) {
  const all = [...a.map((x) => [x, 0]), ...b.map((x) => [x, 1])].sort((x, y) => x[0] - y[0]);
  let r = 0, rankB = 0, ties = 0;
  while (r < all.length) { let e = r; while (e + 1 < all.length && all[e + 1][0] === all[r][0]) e++; const t = e - r + 1; ties += t ** 3 - t; for (let i = r; i <= e; i++) if (all[i][1]) rankB += (r + e + 2) / 2; r = e + 1; }
  const n1 = a.length, n2 = b.length;
  const sd = Math.sqrt((n1 * n2) / 12 * (n1 + n2 + 1 - ties / ((n1 + n2) * (n1 + n2 - 1))));
  if (!sd) return 1;
  const z = (Math.abs(rankB - (n2 * (n2 + 1)) / 2 - (n1 * n2) / 2) - 0.5) / sd;
  return 2 * (1 - 0.5 * (1 + Math.sqrt(1 - Math.exp((-2 * z * z) / Math.PI))));
}

const metrics = ["ttfbMs", "htmlDoneMs", "fcpMs", "lcpMs", "firstCardMs", "hydratedMs", "lastJsMs", "firstListApiStartMs", "listApiBeforeCard"];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const rows = [];
const recorded = {};
let fails = 0;
try {
  for (let b = 0, run = 0; run < runs; b++, run += block) {
    for (const variant of b % 2 ? [...variants].reverse() : variants) {
      await startServer(variant);
      await sample(browser, variant).catch(() => null);
      for (let i = 1; i <= Math.min(block, runs - run); i++) {
        const row = await sample(browser, variant).catch((error) => ({ error: error.message }));
        rows.push({ variant, run: run + i, ...row });
        console.log(variant, run + i, row.error ?? metrics.map((k) => `${k}=${Number(row[k]).toFixed(0)}`).join(" ") + ` lcp=${row.lcpTag} sk=${row.skeletonShown} ${row.url}`);
        fails = row.error ? fails + 1 : 0;
        if (fails >= 5) throw new Error("5회 연속 실패: 로그인 만료 확인 필요");
      }
      await stopServer();
    }
  }
  if (record) for (const variant of variants) {
    const dir = path.join(out, `record-${variant}`);
    fs.mkdirSync(dir, { recursive: true });
    await startServer(variant);
    recorded[variant] = await sample(browser, variant, dir).catch((error) => console.log("record 실패", variant, error.message));
    await stopServer();
  }
} finally {
  await stopServer();
  await browser.close();
  fs.writeFileSync(path.join(out, "raw.json"), JSON.stringify(rows, null, 2));
}

const summary = {};
for (const v of variants) {
  const ok = rows.filter((r) => r.variant === v && !r.error);
  summary[`${v}.skeleton`] = `${ok.filter((r) => r.skeletonShown).length}/${ok.length}`;
  summary[`${v}.lcpTag`] = Object.entries(ok.reduce((a, r) => ({ ...a, [r.lcpTag]: (a[r.lcpTag] ?? 0) + 1 }), {})).map(([k, n]) => `${k}:${n}`).join(" ");
}
for (const k of metrics) {
  const pick = (v) => rows.filter((r) => r.variant === v && Number.isFinite(r[k])).map((r) => r[k]);
  const s = (v) => (v.length ? { n: v.length, p50: q(v, 0.5), p95: q(v, 0.95), p99: q(v, 0.99), min: Math.min(...v), max: Math.max(...v) } : null);
  summary[k] = Object.fromEntries(variants.map((v) => [v, s(pick(v))]));
  for (const v of variants.slice(1)) summary[k][`p_${variants[0]}_${v}`] = pick(variants[0]).length && pick(v).length ? mannWhitney(pick(variants[0]), pick(v)) : null;
}
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(summary, null, 2));
const f = (v) => (v ? `${v.p50.toFixed(0)} p95 ${v.p95.toFixed(0)} p99 ${v.p99.toFixed(0)} [${v.min.toFixed(0)}-${v.max.toFixed(0)}]` : "-");
for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(20)} ${typeof v === "string" ? v : variants.map((x) => `${x} ${f(v[x])}`).join("  ") + variants.slice(1).map((x) => `  p=${v[`p_${variants[0]}_${x}`]?.toFixed(4) ?? "-"}`).join("")}`);
