// pnpm build && pnpm start -p 3010
// for count in 100 1000; do for speed in slow fast; do node scripts/perf/scroll-baseline.mjs --base=http://127.0.0.1:3010 --count="$count" --speed="$speed" --runs=5 --label=repeat-2026-10-08; done; done
// Deterministic API fixture; production bundle, 390x844, Slow 4G, 4x CPU.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const base = process.argv.find((arg) => arg.startsWith("--base="))?.slice(7) ?? "http://localhost:3010";
const runs = Number(process.argv.find((arg) => arg.startsWith("--runs="))?.slice(7) ?? 3);
const count = Number(process.argv.find((arg) => arg.startsWith("--count="))?.slice(8) ?? 100);
const speed = process.argv.find((arg) => arg.startsWith("--speed="))?.slice(8) ?? "slow";
const experiment = process.argv.find((arg) => arg.startsWith("--experiment="))?.slice(13) ?? "baseline";
const label = process.argv.find((arg) => arg.startsWith("--label="))?.slice(8) ?? "";
const resume = process.argv.includes("--resume");
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname) || !Number.isInteger(runs) || runs < 1)
  throw new Error("로컬 주소와 양의 --runs 값이 필요합니다.");
if (![100, 500, 1000].includes(count) || !["slow", "fast", "read"].includes(speed)) throw new Error("--count=100|500|1000, --speed=slow|fast|read");
// read: 읽으면서 스크롤하는 사용자 기준, rAF마다 일정 속도(1px/ms)로 연속 스크롤
const READ_PX_PER_MS = 1;
if (!["baseline", "margin0", "margin400", "visibility"].includes(experiment)) throw new Error("--experiment=baseline|margin0|margin400|visibility");
if (label && !/^[a-zA-Z0-9_-]+$/.test(label)) throw new Error("--label에는 영문·숫자·_·-만 사용할 수 있습니다.");
const out = path.resolve(`scripts/perf/out/scroll-baseline/${count}-${speed}${experiment === "baseline" ? "" : `-${experiment}`}${label ? `-${label}` : ""}`);
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const selector = 'section[aria-label="재고 목록"]';
const cardSelector = `${selector} li:has(a[href^="/refrigerator/ingredients/"])`;
const MB = 1048576;
const fixture = (cursor) => ({
  code: "PERF-200-001", message: "OK",
  data: {
    ingredientsNum: count, filteredCount: count, refrigeratorCapacity: 100,
    ingredients: Array.from({ length: 10 }, (_, n) => ({
      ingredientId: String(cursor + n + 1), name: `재료 ${String(cursor + n + 1).padStart(3, "0")}`,
      category: "VEGETABLE", quantity: 1, weightValue: null, weightUnit: "NONE",
      storageType: "REFRIGERATED", status: "NORMAL", daysUntilExpiration: 10,
    })),
    nextCursor: cursor + 10 < count ? String(cursor + 10) : null,
  },
});

async function measure(browser, run) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await context.addCookies([{ name: "accessToken", value: "local-perf-fixture", url: base }]);
  if (experiment.startsWith("margin")) await context.addInitScript((margin) => {
    const NativeObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback, options) {
        super(callback, options?.rootMargin === "200px" ? { ...options, rootMargin: margin } : options);
      }
    };
  }, `${experiment.slice(6)}px`);
  await context.addInitScript(() => {
    localStorage.setItem("dameokja.currentRefrigeratorId", "1");
    window.__scrollPerf = { frames: [], longTasks: [], loafs: [], shifts: [], pages: [], bottoms: [], observing: false };
    const p = window.__scrollPerf;
    for (const [type, target] of [["longtask", p.longTasks], ["long-animation-frame", p.loafs], ["layout-shift", p.shifts]]) {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
      new PerformanceObserver((list) => {
        if (!p.observing) return;
        for (const e of list.getEntries()) target.push(type === "long-animation-frame" ? {
          startTime: e.startTime, duration: e.duration, blockingDuration: e.blockingDuration,
          scripts: (e.scripts ?? []).map((s) => ({ duration: s.duration, sourceURL: s.sourceURL, sourceFunctionName: s.sourceFunctionName, invoker: s.invoker })),
        } : type === "layout-shift" ? { startTime: e.startTime, value: e.value, hadRecentInput: e.hadRecentInput } : { startTime: e.startTime, duration: e.duration });
      }).observe({ type, buffered: true });
    }
    let previous;
    const frame = (now) => { if (p.observing && previous !== undefined) p.frames.push(now - previous); previous = now; requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
    new MutationObserver(() => {
      if (!p.observing) return;
      const count = document.querySelectorAll('section[aria-label="재고 목록"] li:has(a)').length;
      if (count !== p.pages.at(-1)?.count) p.pages.push({ count, at: performance.now() });
    }).observe(document, { childList: true, subtree: true });
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Profiler.enable");
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 563, downloadThroughput: 187500, uploadThroughput: 93750 });
  const requests = [];
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const list = /\/refrigerators\/[^/]+\/ingredients$/.test(url.pathname);
    const cursor = Number(url.searchParams.get("cursor") ?? 0);
    const start = Date.now();
    const data = list ? fixture(cursor) : { code: "PERF-200-001", message: "OK", data: url.pathname.endsWith("/refrigerators/current") ? [{ refrigeratorId: 1, name: "성능 측정", capacity: 100, expiredCount: 0 }] : {} };
    const body = JSON.stringify(data);
    if (list) { await sleep(563 + body.length / 187.5); requests.push({ cursor, start, end: Date.now(), bytes: body.length }); }
    await route.fulfill({ status: 200, contentType: "application/json", body });
  });
  const events = [];
  cdp.on("Tracing.dataCollected", ({ value }) => events.push(...value));
  try {
    await page.goto(`${base}/refrigerator`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction((s) => document.querySelectorAll(s).length === 10, cardSelector, { timeout: 30000 });
    if (experiment === "visibility") await page.addStyleTag({ content: 'section[aria-label="재고 목록"] li { content-visibility: auto; contain-intrinsic-size: auto 74px; }' });
    const before = (await cdp.send("Performance.getMetrics")).metrics;
    await cdp.send("Tracing.start", { categories: "devtools.timeline,toplevel,blink.user_timing,disabled-by-default-devtools.timeline.frame", transferMode: "ReportEvents" });
    await cdp.send("Profiler.start");
    await page.evaluate(() => { const p = window.__scrollPerf; p.observing = true; p.frames = []; p.longTasks = []; p.loafs = []; p.shifts = []; p.pages = [{ count: 10, at: performance.now() }]; p.bottoms = []; performance.mark("scroll-start"); });
    let loops = 0;
    let scrollDistancePx = 0;
    if (speed === "read") scrollDistancePx = await page.locator(selector).evaluate((element, { count, pxPerMs }) => new Promise((resolve) => {
      const p = window.__scrollPerf;
      const start = performance.now();
      let prev, pos = element.scrollTop, moved = 0;
      requestAnimationFrame(function step(t) {
        if (prev !== undefined) {
          const max = element.scrollHeight - element.clientHeight;
          const next = Math.min(pos + pxPerMs * (t - prev), max); // 프레임이 늦어도 같은 속도 유지
          moved += next - pos; pos = next; element.scrollTop = pos;
          if (pos >= max - 2) { // 카드 수 세기는 바닥에서만 (매 프레임 세면 측정 부하가 됨)
            const n = element.querySelectorAll("li:has(a)").length;
            if (!p.bottoms.some((x) => x.count === n)) p.bottoms.push({ count: n, at: performance.now() });
            if (n >= count) return resolve(Math.round(moved));
          }
          if (t - start > 600000) return resolve(Math.round(moved));
        }
        prev = t;
        requestAnimationFrame(step);
      });
    }), { count, pxPerMs: READ_PX_PER_MS });
    while (speed !== "read" && await page.locator(cardSelector).count() < count && loops++ < count * 4) {
      scrollDistancePx += await page.locator(selector).evaluate((element, step) => { const before = element.scrollTop; element.scrollTop = Math.min(element.scrollHeight, element.scrollTop + step); return element.scrollTop - before; }, speed === "slow" ? 320 : 100000);
      await page.locator(selector).evaluate((element) => {
        const p = window.__scrollPerf;
        const count = element.querySelectorAll("li:has(a)").length;
        if (element.scrollTop + element.clientHeight >= element.scrollHeight - 2 && !p.bottoms.some((x) => x.count === count)) p.bottoms.push({ count, at: performance.now() });
      });
      await sleep(speed === "slow" ? 80 : 150);
    }
    await page.waitForFunction(({ s, count }) => document.querySelectorAll(s).length === count, { s: cardSelector, count }, { timeout: 30000 });
    const scrollElapsedMs = await page.evaluate(() => { performance.mark("scroll-end"); window.__scrollPerf.observing = false; return performance.measure("scroll-duration", "scroll-start", "scroll-end").duration; });
    const cpuProfile = (await cdp.send("Profiler.stop")).profile;
    const traceDone = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
    await cdp.send("Tracing.end");
    await traceDone;
    const after = (await cdp.send("Performance.getMetrics")).metrics;
    const { p, timeOrigin, queryCache } = await page.evaluate(() => ({ p: window.__scrollPerf, timeOrigin: performance.timeOrigin, queryCache: window.__listPerfQuerySnapshot?.("ingredient") ?? null }));
    const stat = (snapshot, name) => snapshot.find((m) => m.name === name)?.value ?? 0;
    const duration = (name) => Math.round((stat(after, name) - stat(before, name)) * 1000);
    const traceEvents = events.filter((e) => e.ph === "X" && e.dur);
    const sum = (names) => Math.round(traceEvents.filter((e) => names.includes(e.name)).reduce((n, e) => n + e.dur, 0) / 1000);
    const visible = await page.evaluate(() => ({ nodes: document.querySelectorAll("*").length, images: [...document.images].filter((i) => i.complete).reduce((n, i) => n + i.naturalWidth * i.naturalHeight * 4, 0) / 1048576 }));
    const pageArrival = requests.filter((r) => r.cursor > 0).map((r) => {
      const mark = p.pages.find((x) => x.count >= r.cursor + 10);
      const bottom = p.bottoms.find((x) => x.count === r.cursor);
      return { cursor: r.cursor, requestMs: r.end - r.start, cardVisibleAfterResponseMs: mark ? Math.round(mark.at - (r.end - timeOrigin)) : null, waitAtBottomMs: mark && bottom ? Math.max(0, Math.round(mark.at - bottom.at)) : null };
    });
    const result = {
      run, count, speed, experiment, url: `${base}/refrigerator`, build: "production", viewport: "390x844@2x", cpu: "4x", network: "563ms RTT; 1.5Mbps down; 750kbps up; deterministic API fixture",
      cards: await page.locator(cardSelector).count(),
      scrollInput: speed === "read" ? { method: "rAF element.scrollTop", pxPerMs: READ_PX_PER_MS } : { method: "element.scrollTop", stepPx: speed === "slow" ? 320 : 100000, pauseMs: speed === "slow" ? 80 : 150, steps: loops },
      scrollDurationMs: Math.round(scrollElapsedMs), scrollDistancePx: Math.round(scrollDistancePx), averageScrollPxPerSec: Math.round(scrollDistancePx * 1000 / scrollElapsedMs),
      frames: { sampled: p.frames.length, over16_7ms: p.frames.filter((x) => x > 16.7).length, over33_3ms: p.frames.filter((x) => x > 33.3).length, longestMs: +Math.max(0, ...p.frames).toFixed(1), p95Ms: +(p.frames.toSorted((a, b) => a - b)[Math.floor(p.frames.length * .95)] ?? 0).toFixed(1) },
      compositorFrames: (() => {
        const frames = events.filter((e) => e.name === "BeginFrame" && e.args?.layerTreeId === 2).length;
        const dropped = events.filter((e) => e.name === "DroppedFrame" && e.args?.layerTreeId === 2).length;
        return { frames, dropped, droppedPct: frames ? +(dropped / frames * 100).toFixed(1) : null };
      })(),
      longTasks: { count: p.longTasks.length, longestMs: Math.round(Math.max(0, ...p.longTasks.map((x) => x.duration))) },
      loaf: { count: p.loafs.length, longestMs: Math.round(Math.max(0, ...p.loafs.map((x) => x.duration))), topScripts: p.loafs.flatMap((x) => x.scripts).toSorted((a, b) => b.duration - a.duration).slice(0, 5) },
      workMs: { scripting: sum(["FunctionCall", "EvaluateScript", "EventDispatch"]), style: duration("RecalcStyleDuration"), layout: duration("LayoutDuration"), paint: sum(["Paint"]) },
      forcedReflow: traceEvents.filter((e) => e.args?.data?.warning && /forced|reflow/i.test(String(e.args.data.warning))).length,
      reactCommit: "React DevTools Profiler에서 별도 기록 필요 (일반 production 빌드는 commit 계측 API 없음)",
      domNodes: visible.nodes, jsHeapMb: +(stat(after, "JSHeapUsedSize") / MB).toFixed(2), decodedImageUpperBoundMb: +visible.images.toFixed(2), queryCache,
      cls: +p.shifts.filter((x) => !x.hadRecentInput).reduce((n, x) => n + x.value, 0).toFixed(4),
      nextPages: pageArrival, requests: { total: requests.length, uniqueCursors: new Set(requests.map((r) => r.cursor)).size, duplicateCursors: requests.length - new Set(requests.map((r) => r.cursor)).size, timeline: requests },
    };
    fs.writeFileSync(path.join(out, `run-${run}.json`), JSON.stringify(result, null, 2));
    fs.writeFileSync(path.join(out, `cpu-profile-${run}.json`), JSON.stringify(cpuProfile));
    fs.writeFileSync(path.join(out, `performance-trace-${run}.json`), JSON.stringify({ traceEvents: events }));
    if (run === 1) {
      fs.writeFileSync(path.join(out, "performance-trace.json"), JSON.stringify({ traceEvents: events }));
      await page.screenshot({ path: path.join(out, "refrigerator.png") });
    }
    console.log(JSON.stringify(result));
    return result;
  } finally { await context.close(); }
}

const browser = await chromium.launch({ channel: "chrome" });
try {
  const results = [];
  for (let run = 1; run <= runs; run++) {
    const runFile = path.join(out, `run-${run}.json`);
    if (resume && [runFile, path.join(out, `cpu-profile-${run}.json`), path.join(out, `performance-trace-${run}.json`)].every(fs.existsSync)) {
      results.push(JSON.parse(fs.readFileSync(runFile)));
      continue;
    }
    results.push(await measure(browser, run));
  }
  fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 2));
} finally { await browser.close(); }
