import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

const option = (name, fallback) => process.argv.find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const base = option("base", "http://localhost:3013");
const runs = Number(option("n", "5"));
const out = path.resolve(option("out", "scripts/perf/out/forced-reflow"));
const only = option("only", "");
fs.mkdirSync(out, { recursive: true });

const statuses = ["NORMAL", "NORMAL", "EXPIRING_SOON", "EXPIRED"];
const categories = ["VEGETABLE", "FRUIT", "MEAT"];
const items = Array.from({ length: 1000 }, (_, i) => {
  const status = statuses[i % 4];
  return { ingredientId: String(i + 1), name: `재료 ${String(i + 1).padStart(4, "0")}`, category: categories[i % 3], quantity: 1, weightValue: null, weightUnit: "NONE", storageType: i % 3 === 2 ? "FROZEN" : "REFRIGERATED", status, daysUntilExpiration: status === "EXPIRED" ? -1 : status === "EXPIRING_SOON" ? 2 : 10 };
});
const envelope = (data) => JSON.stringify({ code: "PERF-200-001", message: "OK", data });
function respond(url) {
  if (/\/refrigerators\/[^/]+\/ingredients$/.test(url.pathname)) {
    const filter = url.searchParams.get("filter");
    const category = url.searchParams.get("category");
    const matched = items.filter((x) => (!category || x.category === category) && (!filter || (filter === "REFRIGERATED" || filter === "FROZEN" ? x.storageType === filter : x.status === filter)));
    const cursor = Number(url.searchParams.get("cursor") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 10);
    return envelope({ baseDate: new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10), outdated: false, ingredientsNum: items.length, filteredCount: matched.length, refrigeratorCapacity: items.length, refrigeratorName: "성능 측정", ingredients: matched.slice(cursor, cursor + size), nextCursor: cursor + size < matched.length ? String(cursor + size) : null });
  }
  if (url.pathname.endsWith("/refrigerators/current")) return envelope([{ refrigeratorId: 1, name: "성능 측정", capacity: 1000, expiredCount: 0 }]);
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
await new Promise((resolve) => backend.listen(3020, resolve));

const chips = (group) => `[role="group"][aria-label="${group}"] > button`;
const scenarios = {
  "control-forced-reflow": async (page) => {
    await page.evaluate(() => {
      const box = document.createElement("div");
      document.body.append(box);
      for (let i = 0; i < 50; i++) {
        box.style.width = `${100 + i}px`;
        void box.offsetHeight;
      }
      box.remove();
    });
  },
  "status-chip-rapid-clicks": async (page) => {
    const list = page.locator(chips("재고 필터"));
    const count = await list.count();
    for (let round = 0; round < 2; round++) for (let i = 0; i < count; i++) {
      await list.nth(i).click();
      await page.waitForTimeout(150);
    }
  },
  "category-chip-rapid-clicks": async (page) => {
    const list = page.locator(chips("카테고리 필터"));
    const count = await list.count();
    for (let round = 0; round < 2; round++) for (let i = 0; i < count; i++) {
      await list.nth(i).click();
      await page.waitForTimeout(150);
    }
  },
  "chip-row-horizontal-scroll": async (page) => {
    for (const group of ["재고 필터", "카테고리 필터"]) {
      const box = await page.locator(`[role="group"][aria-label="${group}"]`).boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      for (let i = 0; i < 10; i++) { await page.mouse.wheel(60, 0); await page.waitForTimeout(50); }
      for (let i = 0; i < 10; i++) { await page.mouse.wheel(-60, 0); await page.waitForTimeout(50); }
    }
  },
  "list-vertical-scroll": async (page) => {
    const box = await page.locator('section[aria-label="재고 목록"]').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(100); }
  },
  "scroll-then-status-chip": async (page) => {
    const box = await page.locator('section[aria-label="재고 목록"]').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(100); }
    const list = page.locator(chips("재고 필터"));
    for (let i = 1; i < 4; i++) { await list.nth(i).click(); await page.waitForTimeout(300); }
  },
};

const JS_EVENTS = new Set(["FunctionCall", "EventDispatch", "TimerFire", "FireAnimationFrame", "v8.callFunction", "RunMicrotasks", "FireIdleCallback"]);
function analyze(file) {
  const raw = JSON.parse(fs.readFileSync(file));
  const ev = Array.isArray(raw) ? raw : raw.traceEvents;
  const mainTid = ev.find((e) => e.name === "thread_name" && e.args?.name === "CrRendererMain");
  const onMain = (e) => mainTid && e.pid === mainTid.pid && e.tid === mainTid.tid;
  const js = ev.filter((e) => onMain(e) && e.ph === "X" && JS_EVENTS.has(e.name)).map((e) => [e.ts, e.ts + (e.dur ?? 0)]);
  const tasks = ev.filter((e) => onMain(e) && e.ph === "X" && e.name === "RunTask").map((e) => [e.ts, e.ts + (e.dur ?? 0)]);
  const insideJs = (e) => js.some(([s, f]) => e.ts >= s && e.ts <= f);
  const layouts = ev.filter((e) => onMain(e) && e.ph === "X" && e.name === "Layout");
  const styles = ev.filter((e) => onMain(e) && e.ph === "X" && e.name === "UpdateLayoutTree");
  const forcedLayouts = layouts.filter((e) => e.args?.beginData?.stackTrace?.length || insideJs(e));
  const forcedStyles = styles.filter((e) => e.args?.beginData?.stackTrace?.length || insideJs(e));
  const byStack = layouts.filter((e) => e.args?.beginData?.stackTrace?.length).length;
  const perTask = tasks.map(([s, f]) => forcedLayouts.filter((e) => e.ts >= s && e.ts <= f).length);
  const sources = {};
  for (const e of forcedLayouts) {
    const top = e.args?.beginData?.stackTrace?.[0];
    const key = top ? `${top.functionName || "(anonymous)"} @ ${String(top.url).split("/").pop()}:${top.lineNumber}` : "(stack 없음)";
    sources[key] = (sources[key] ?? 0) + 1;
  }
  return {
    layouts: layouts.length,
    forcedLayouts: forcedLayouts.length,
    forcedByStack: byStack,
    forcedLayoutMs: Number((forcedLayouts.reduce((a, e) => a + (e.dur ?? 0), 0) / 1000).toFixed(2)),
    forcedStyleRecalcs: forcedStyles.length,
    thrashingTasks: perTask.filter((n) => n >= 2).length,
    maxForcedInOneTask: Math.max(0, ...perTask),
    sources,
  };
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [name, act] of Object.entries(scenarios)) {
    if (only && !only.split(",").includes(name)) continue;
    for (let run = 1; run <= runs; run++) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "block" });
      await context.addCookies([{ name: "accessToken", value: "local-perf-fixture", url: base }, { name: "currentRefrigeratorId", value: "1", url: base }]);
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      try {
        await page.goto(`${base}/refrigerator`, { waitUntil: "load", timeout: 60000 });
        await page.waitForTimeout(3000);
        const file = path.join(out, `${name}-${run}.json`);
        await browser.startTracing(page, { path: file, categories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.stack", "disabled-by-default-devtools.timeline.frame", "v8.execute", "blink.user_timing", "loading"] });
        await act(page);
        await page.waitForTimeout(1500);
        await browser.stopTracing();
        const r = { scenario: name, run, ...analyze(file) };
        results.push(r);
        console.log(name, run, JSON.stringify({ ...r, sources: undefined }), JSON.stringify(r.sources));
      } catch (error) {
        console.log(name, run, "실패", error.message);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  backend.close();
}
fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 2));
