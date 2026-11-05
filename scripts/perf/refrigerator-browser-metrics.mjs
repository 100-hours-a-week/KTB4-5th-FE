// Same deterministic fixture as transition-1500/benchmark.mjs. No application changes.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

const option = (name, fallback) =>
  process.argv
    .find((x) => x.startsWith(`--${name}=`))
    ?.slice(name.length + 3) ?? fallback;
const bases = Object.fromEntries(
  ["a", "b", "c"]
    .map((v, i) => [v, option(v, `http://localhost:${3013 + i}`)])
    .filter(([v]) => option("variants", "a,b").split(",").includes(v)),
);
const variants = Object.keys(bases);
const runs = Number(option("n", "10"));
const fixture = Number(option("fixture", "2000"));
const backendPort = Number(option("backend-port", "3020"));
const record = !process.argv.includes("--no-record");
const out = path.resolve(
  option("out", "scripts/perf/out/transition-browser-metrics"),
);
fs.mkdirSync(out, { recursive: true });

const statuses = ["NORMAL", "NORMAL", "EXPIRING_SOON", "EXPIRED"];
const categories = ["VEGETABLE", "FRUIT", "MEAT"];
const items = Array.from({ length: fixture }, (_, i) => {
  const status = statuses[i % 4];
  return {
    ingredientId: String(i + 1),
    name: `재료 ${String(i + 1).padStart(4, "0")}`,
    category: categories[i % 3],
    quantity: 1,
    weightValue: null,
    weightUnit: "NONE",
    storageType: i % 3 === 2 ? "FROZEN" : "REFRIGERATED",
    status,
    daysUntilExpiration:
      status === "EXPIRED" ? -1 : status === "EXPIRING_SOON" ? 2 : 10,
  };
});
const envelope = (data) =>
  JSON.stringify({ code: "PERF-200-001", message: "OK", data });
function respond(url) {
  if (/\/refrigerators\/[^/]+\/ingredients$/.test(url.pathname)) {
    const filter = url.searchParams.get("filter");
    const category = url.searchParams.get("category");
    const matched = items.filter(
      (x) =>
        (!category || x.category === category) &&
        (!filter ||
          (filter === "REFRIGERATED" || filter === "FROZEN"
            ? x.storageType === filter
            : x.status === filter)),
    );
    const cursor = Number(url.searchParams.get("cursor") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 10);
    return envelope({
      baseDate: new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10),
      outdated: false,
      ingredientsNum: items.length,
      filteredCount: matched.length,
      refrigeratorCapacity: items.length,
      refrigeratorName: "성능 측정",
      ingredients: matched.slice(cursor, cursor + size),
      nextCursor: cursor + size < matched.length ? String(cursor + size) : null,
    });
  }
  if (url.pathname.endsWith("/refrigerators/current"))
    return envelope([
      {
        refrigeratorId: 1,
        name: "성능 측정",
        capacity: fixture,
        expiredCount: 0,
      },
    ]);
  if (url.pathname.endsWith("/notifications/unread-count"))
    return envelope({ refrigeratorId: "1", unreadCount: 0 });
  return envelope({});
}
const backend = http.createServer((req, res) => {
  const body = /accessToken=/.test(req.headers.cookie ?? "")
    ? respond(new URL(req.url, "http://backend"))
    : null;
  setTimeout(() => {
    res.writeHead(body ? 200 : 401, { "content-type": "application/json" });
    res.end(body ?? "{}");
  }, 20);
});
await new Promise((resolve) => backend.listen(backendPort, resolve));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const phases = option("phases", "entry,filter,scroll,memory").split(",");
const scrollRuns = Number(option("scroll-runs", "5"));
const memoryRuns = Number(option("memory-runs", "2"));
const memoryCycles = Number(option("memory-cycles", "20"));
const targetCards = 1510;
const sectionSelector = 'section[aria-label="재고 목록"]';
const cardSelector = `${sectionSelector} a[href^="/refrigerator/ingredients/"]`;
const vitalsFile = path.resolve(
  "node_modules/.pnpm/web-vitals@6.2.2/node_modules/web-vitals/dist/web-vitals.attribution.iife.js",
);
const vitalsSource = fs.readFileSync(vitalsFile, "utf8");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const browserVersion = browser.version();
const rows = [];
const failures = [];
const quantile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b),
    i = (sorted.length - 1) * p;
  return (
    sorted[Math.floor(i)] +
    (sorted[Math.ceil(i)] - sorted[Math.floor(i)]) * (i % 1)
  );
};
assert(
  quantile([1, 3, 2], 0.5) === 2 && quantile([0, 100], 0.95) === 95,
  "quantile self-check",
);
const metrics = async (cdp) =>
  Object.fromEntries(
    (await cdp.send("Performance.getMetrics")).metrics.map(
      ({ name, value }) => [name, value],
    ),
  );
const throttle = (cdp, enabled) =>
  Promise.all([
    cdp.send("Emulation.setCPUThrottlingRate", { rate: enabled ? 4 : 1 }),
    cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: enabled ? 562.5 : 0,
      downloadThroughput: enabled ? 184320 : -1,
      uploadThroughput: enabled ? 184320 : -1,
    }),
  ]);
async function finalizeVitals(page) {
  await page.goto("about:blank", { waitUntil: "load" });
  await page.waitForTimeout(100);
}
function summarizeNetwork(requests, start, end) {
  const list = requests.filter((r) => r.start >= start && r.start < end);
  const groups = {};
  for (const r of list) {
    const key = r.type ?? "Other";
    (groups[key] ??= []).push(r);
  }
  const summary = (list) => ({
    requests: list.length,
    completed: list.filter((x) => x.end).length,
    failed: list.filter((x) => x.failed).length,
    encodedBytes: list.reduce((n, x) => n + (x.encodedBytes ?? 0), 0),
    decodedBytes: list.reduce((n, x) => n + (x.decodedBytes ?? 0), 0),
    fromCache: list.filter((x) => x.fromCache).length,
    durationP50Ms: quantile(
      list.filter((x) => x.end).map((x) => (x.end - x.start) * 1000),
      0.5,
    ),
    durationP95Ms: quantile(
      list.filter((x) => x.end).map((x) => (x.end - x.start) * 1000),
      0.95,
    ),
  });
  return {
    ...summary(list),
    types: Object.fromEntries(
      Object.entries(groups).map(([k, v]) => [k, summary(v)]),
    ),
  };
}
async function sample(variant, phase, run, record = false) {
  const id = `${phase}-${variant}-${run}${record ? "-record" : ""}`;
  const dir = path.join(out, id);
  fs.mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    serviceWorkers: "block",
  });
  const vitals = {},
    vitalsHistory = [];
  await context.exposeBinding("__reportVital", (_, metric) => {
    vitals[metric.name] = metric;
    vitalsHistory.push(metric);
  });
  await context.addCookies([
    { name: "accessToken", value: "local-perf-fixture", url: bases[variant] },
    { name: "currentRefrigeratorId", value: "1", url: bases[variant] },
  ]);
  if (phase !== "memory")
    await context.addInitScript({
      content:
        vitalsSource +
        `\nfor (const name of ['LCP','CLS','INP','FCP','TTFB']) webVitals['on'+name]((m)=>{const a=m.attribution??{};window.__reportVital({name:m.name,value:m.value,rating:m.rating,navigationType:m.navigationType,id:m.id,attribution:{inputDelay:a.inputDelay,processingDuration:a.processingDuration,presentationDelay:a.presentationDelay,interactionType:a.interactionType,interactionTarget:a.interactionTarget},entries:m.entries.map(e=>({name:e.name,startTime:e.startTime,duration:e.duration,interactionId:e.interactionId}))});},{reportAllChanges:true,reportSoftNavs:false,durationThreshold:16});`,
    });
  await context.addInitScript(() => {
    sessionStorage.setItem("dameokja.tasteSurveyClosed", "true");
    const p = (window.__browserPerf = {
      active: false,
      frames: [],
      longTasks: [],
      loafs: [],
      shifts: [],
      supported: PerformanceObserver.supportedEntryTypes,
    });
    for (const type of ["longtask", "long-animation-frame", "layout-shift"]) {
      if (!p.supported.includes(type)) continue;
      new PerformanceObserver((list) => {
        if (!p.active) return;
        for (const e of list.getEntries()) {
          if (type === "longtask")
            p.longTasks.push({ start: e.startTime, duration: e.duration });
          else if (type === "layout-shift")
            p.shifts.push({
              start: e.startTime,
              value: e.value,
              hadRecentInput: e.hadRecentInput,
            });
          else
            p.loafs.push({
              start: e.startTime,
              duration: e.duration,
              blockingDuration: e.blockingDuration,
              scripts: (e.scripts ?? []).map((s) => ({
                duration: s.duration,
                sourceURL: s.sourceURL,
                sourceFunctionName: s.sourceFunctionName,
                invoker: s.invoker,
              })),
            });
        }
      }).observe({ type, buffered: true });
    }
    let previous;
    requestAnimationFrame(function tick(t) {
      if (p.active && previous !== undefined) p.frames.push(t - previous);
      previous = p.active ? t : undefined;
      requestAnimationFrame(tick);
    });
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const requests = [],
    requestById = new Map();
  const trace = [];
  cdp.on("Tracing.dataCollected", ({ value }) => trace.push(...value));
  cdp.on("Network.requestWillBeSent", (e) => {
    const row = {
      requestId: e.requestId,
      url: e.request.url,
      type: e.type,
      start: e.timestamp,
      method: e.request.method,
    };
    requests.push(row);
    requestById.set(e.requestId, row);
  });
  cdp.on("Network.responseReceived", (e) => {
    const r = requestById.get(e.requestId);
    if (r)
      Object.assign(r, {
        status: e.response.status,
        fromCache: Boolean(
          e.response.fromDiskCache || e.response.fromServiceWorker,
        ),
        mime: e.response.mimeType,
        ttfbMs: e.response.timing
          ? e.response.timing.receiveHeadersEnd - e.response.timing.sendStart
          : null,
      });
  });
  cdp.on("Network.dataReceived", (e) => {
    const r = requestById.get(e.requestId);
    if (r) r.decodedBytes = (r.decodedBytes ?? 0) + e.dataLength;
  });
  cdp.on("Network.loadingFinished", (e) => {
    const r = requestById.get(e.requestId);
    if (r)
      Object.assign(r, { end: e.timestamp, encodedBytes: e.encodedDataLength });
  });
  cdp.on("Network.loadingFailed", (e) => {
    const r = requestById.get(e.requestId);
    if (r) Object.assign(r, { end: e.timestamp, failed: e.errorText });
  });
  let tracing = false;
  let stage = "setup";
  async function startTrace() {
    await cdp.send("Tracing.start", {
      categories:
        "devtools.timeline,toplevel,blink.user_timing,disabled-by-default-devtools.timeline.frame",
      transferMode: "ReportEvents",
    });
    tracing = true;
  }
  async function stopTrace() {
    if (!tracing) return;
    const done = new Promise((resolve) =>
      cdp.once("Tracing.tracingComplete", resolve),
    );
    await cdp.send("Tracing.end");
    await done;
    tracing = false;
    fs.writeFileSync(
      path.join(dir, "performance-trace.json"),
      JSON.stringify({ traceEvents: trace }),
    );
  }
  async function snapshot(name) {
    const file = fs.createWriteStream(path.join(dir, `${name}.heapsnapshot`));
    const receive = ({ chunk }) => file.write(chunk);
    cdp.on("HeapProfiler.addHeapSnapshotChunk", receive);
    await cdp.send("HeapProfiler.takeHeapSnapshot", { reportProgress: false });
    cdp.off("HeapProfiler.addHeapSnapshotChunk", receive);
    await new Promise((resolve) => file.end(resolve));
  }
  async function heapPoint(cycle) {
    await cdp.send("HeapProfiler.collectGarbage");
    const usage = await cdp.send("Runtime.getHeapUsage");
    const dom = await cdp.send("Memory.getDOMCounters");
    return {
      cycle,
      at: Date.now(),
      usedMiB: usage.usedSize / 1048576,
      totalMiB: usage.totalSize / 1048576,
      embedderMiB: (usage.embedderHeapUsedSize ?? 0) / 1048576,
      backingStorageMiB: (usage.backingStorageSize ?? 0) / 1048576,
      ...dom,
      cards: await page.locator(cardSelector).count(),
    };
  }
  try {
    await cdp.send("Performance.enable");
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await throttle(cdp, phase === "entry");
    const navStart = (await metrics(cdp)).Timestamp;
    stage = "navigation";
    await page.goto(`${bases[variant]}/refrigerator`, {
      waitUntil: "load",
      timeout: 60000,
    });
    stage = "preparation";
    await page.locator(cardSelector).first().waitFor({ timeout: 30000 });
    if (phase !== "entry") {
      for (
        let i = 0, n = await page.locator(cardSelector).count();
        i < 180 && n < 1500;
        i++
      ) {
        await page
          .locator(sectionSelector)
          .evaluate((e) => e.scrollTo(0, e.scrollHeight));
        await page.waitForFunction(
          ({ selector, n }) => document.querySelectorAll(selector).length > n,
          { selector: cardSelector, n },
          { timeout: 10000 },
        );
        n = await page.locator(cardSelector).count();
      }
      await page.locator(sectionSelector).evaluate((e) => e.scrollTo(0, 0));
      await throttle(cdp, true);
    }
    await page.waitForTimeout(4000);
    const cards = await page.locator(cardSelector).count();
    if (phase !== "entry")
      assert(
        cards === targetCards,
        `Expected ${targetCards} cards, got ${cards}`,
      );
    stage = "interaction";
    const before = await metrics(cdp),
      start = before.Timestamp;
    await page.evaluate((active) => {
      window.__browserPerf.active = active;
      performance.mark("benchmark-start");
    }, phase !== "memory");
    if (record || phase === "scroll") await startTrace();
    if (phase === "entry") {
      // End LCP with a real input without changing the list. INP is measured in the heavy filter scenario.
      await page.getByRole("searchbox", { name: "재료 검색" }).click();
      await page.waitForTimeout(1500);
    } else if (phase === "filter") {
      await page
        .getByRole("group", { name: "재고 필터" })
        .getByRole("button", { name: "만료", exact: true })
        .click();
      await page.waitForFunction(
        (s) => document.querySelector(s)?.getAttribute("href")?.endsWith("/4"),
        cardSelector,
        { timeout: 10000 },
      );
      await page.waitForTimeout(1500);
    } else if (phase === "scroll") {
      // Native compositor gesture, fixed distance/time, away from pagination boundary.
      await page.locator(sectionSelector).evaluate((e) => (e.scrollTop = 1000));
      await page.waitForTimeout(200);
      await cdp.send("Input.synthesizeScrollGesture", {
        x: 190,
        y: 500,
        yDistance: -6000,
        speed: 1200,
        gestureSourceType: "mouse",
        preventFling: true,
      });
      await page.waitForTimeout(200);
      await cdp.send("Input.synthesizeScrollGesture", {
        x: 190,
        y: 500,
        yDistance: 6000,
        speed: 1200,
        gestureSourceType: "mouse",
        preventFling: true,
      });
      await page.waitForTimeout(300);
      assert(
        (await page.locator(cardSelector).count()) === targetCards,
        "Scroll changed card count",
      );
    } else if (phase === "memory") {
      await cdp.send("HeapProfiler.enable");
      const points = [await heapPoint(-1)];
      const switchTo = async (label, filter) => {
        await page
          .getByRole("group", { name: "재고 필터" })
          .getByRole("button", { name: label, exact: true })
          .click();
        await page.waitForFunction(
          ({ s, filter }) =>
            new URL(location.href).searchParams.get("filter") === filter &&
            document
              .querySelector(s)
              ?.getAttribute("href")
              ?.endsWith(filter ? "/4" : "/1"),
          { s: cardSelector, filter },
          { timeout: 10000 },
        );
        await page.waitForTimeout(700);
      };
      for (let cycle = 0; cycle < 3; cycle++) {
        await switchTo("만료", "EXPIRED");
        await switchTo("전체", null);
      }
      points.push(await heapPoint(0));
      if (record) await snapshot("baseline");
      for (let cycle = 1; cycle <= memoryCycles; cycle++) {
        await switchTo("만료", "EXPIRED");
        await switchTo("전체", null);
        if (cycle % 5 === 0) points.push(await heapPoint(cycle));
      }
      if (record) await snapshot("after");
      const first = points.find((p) => p.cycle === 0),
        last = points.at(-1);
      assert(
        points
          .filter((p) => p.cycle >= 0)
          .every((p) => p.cards === first.cards),
        "Memory checkpoints must have equal live card count",
      );
      var memory = {
        points,
        cycles: memoryCycles,
        postGcGrowthMiB: last.usedMiB - first.usedMiB,
        postGcGrowthPct: ((last.usedMiB - first.usedMiB) / first.usedMiB) * 100,
        note: "Heavy list checkpoint -1; after warmup the existing pagination policy trims to one page. Comparable checkpoints use equal live card count. Bounded repeated-filter test, not hours-long leak proof.",
      };
    }
    stage = "finalization";
    const after = await metrics(cdp),
      end = after.Timestamp;
    await page.evaluate(() => {
      performance.mark("benchmark-end");
      window.__browserPerf.active = false;
    });
    await page.waitForTimeout(100);
    const p = await page.evaluate(() => window.__browserPerf);
    await stopTrace();
    const work = Object.fromEntries(
      [
        "ScriptDuration",
        "TaskDuration",
        "LayoutDuration",
        "RecalcStyleDuration",
      ].map((k) => [`${k}Ms`, (after[k] - before[k]) * 1000]),
    );
    const fsamples = p.frames;
    const groups = {};
    for (const e of trace.filter((e) =>
      ["BeginFrame", "DrawFrame", "DroppedFrame"].includes(e.name),
    )) {
      const key = `${e.pid}:${e.args?.layerTreeId ?? "none"}`;
      const g = (groups[key] ??= {
        BeginFrame: 0,
        DrawFrame: 0,
        DroppedFrame: 0,
      });
      g[e.name]++;
    }
    const compositor = Object.entries(groups)
      .filter(([, g]) => g.BeginFrame)
      .sort((a, b) => b[1].BeginFrame - a[1].BeginFrame)[0];
    const frameMetrics = {
      elapsedMs: (end - start) * 1000,
      samples: fsamples.length,
      rafFps: fsamples.length
        ? (1000 * fsamples.length) / fsamples.reduce((a, b) => a + b, 0)
        : null,
      frameP50Ms: quantile(fsamples, 0.5),
      frameP95Ms: quantile(fsamples, 0.95),
      frameMaxMs: Math.max(0, ...fsamples),
      gapsOver33ms: fsamples.filter((t) => t > 33.34).length,
      compositor: compositor
        ? {
            stream: compositor[0],
            ...compositor[1],
            droppedPct:
              (compositor[1].DroppedFrame / compositor[1].BeginFrame) * 100,
          }
        : null,
    };
    const longs = {
      count: p.longTasks.length,
      totalMs: p.longTasks.reduce((n, x) => n + x.duration, 0),
      maxMs: Math.max(0, ...p.longTasks.map((x) => x.duration)),
      blockingOver50Ms: p.longTasks.reduce(
        (n, x) => n + Math.max(0, x.duration - 50),
        0,
      ),
      longAnimationFrames: p.loafs.length,
      loafBlockingMs: p.loafs.reduce(
        (n, x) => n + (x.blockingDuration ?? 0),
        0,
      ),
      topScripts: p.loafs
        .flatMap((x) => x.scripts)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
    };
    const network = {
      entry: summarizeNetwork(requests, navStart, start),
      interaction: summarizeNetwork(requests, start, end),
    };
    const endCards = await page.locator(cardSelector).count();
    if (record) await page.screenshot({ path: path.join(dir, "screen.png") });
    await finalizeVitals(page);
    if (phase === "entry")
      assert(
        Number.isFinite(vitals.LCP?.value) &&
          Number.isFinite(vitals.CLS?.value),
        "Missing LCP/CLS",
      );
    if (phase === "filter")
      assert(Number.isFinite(vitals.INP?.value), "Missing official INP");
    const row = {
      variant,
      phase,
      run,
      record,
      window: { navStart, start, end },
      cards,
      endCards,
      browserVersion,
      vitals,
      vitalsHistory,
      work,
      frames: frameMetrics,
      longTasks: longs,
      network,
      memory,
      observedShifts: p.shifts,
      heapMiB: after.JSHeapUsedSize / 1048576,
      domNodes: after.Nodes,
    };
    fs.writeFileSync(
      path.join(dir, "result.json"),
      JSON.stringify(row, null, 2),
    );
    fs.writeFileSync(
      path.join(dir, "network.json"),
      JSON.stringify(requests, null, 2),
    );
    return row;
  } catch (error) {
    error.stage = stage;
    throw error;
  } finally {
    await stopTrace().catch(() => {});
    await context.close();
  }
}
fs.writeFileSync(
  path.join(out, "conditions.json"),
  JSON.stringify(
    {
      browserVersion,
      runs,
      scrollRuns,
      memoryRuns,
      memoryCycles,
      phases,
      targetCards,
      fixture,
      viewport: "390x844@2",
      cpu: "4x",
      network: { latencyMs: 562.5, downloadBps: 184320, uploadBps: 184320 },
      vitalsLibrary: "web-vitals@6.2.2 attribution IIFE (already installed)",
      reportSoftNavs: false,
      entry:
        "throttled before navigation, cold browser HTTP cache, 4s settle then neutral input and pagehide",
      heavy:
        "fast unthrottled preparation then 4x CPU + original network, 4s settle; exact 1510 cards",
      memory:
        "Forced GC every 5 cycles. Warmup 3 filter round trips; then 20 measured round trips. Snapshots in separate record runs.",
      traces:
        "Separate filter recording; scroll traces enabled; CDP Performance counters and observers on all runs; memory snapshots separate.",
      order:
        "odd a,b; even b,a; 1 warmup per variant per phase (memory omitted)",
    },
    null,
    2,
  ),
);
try {
  for (const phase of phases) {
    if (phase !== "memory")
      for (const variant of variants)
        await sample(variant, phase, "warmup").catch((e) =>
          console.log("warmup", phase, variant, e.message),
        );
    const n =
      phase === "scroll" ? scrollRuns : phase === "memory" ? memoryRuns : runs;
    for (let run = 1; run <= n; run++) {
      for (const variant of run % 2 ? variants : [...variants].reverse()) {
        let result;
        for (let attempt = 1; attempt <= 3 && !result; attempt++) {
          try {
            result = await sample(variant, phase, `${run}-${attempt}`);
          } catch (error) {
            failures.push({
              phase,
              variant,
              run,
              attempt,
              error: error.message,
              stage: error.stage,
              stack: error.stack,
            });
            fs.writeFileSync(
              path.join(out, "failures.json"),
              JSON.stringify(failures, null, 2),
            );
            console.log("retry", phase, variant, run, error.message);
          }
        }
        assert(result, `${phase} ${variant} ${run} failed all attempts`);
        rows.push(result);
        fs.writeFileSync(
          path.join(out, "raw.json"),
          JSON.stringify(rows, null, 2),
        );
        console.log(
          JSON.stringify({
            phase,
            variant,
            run,
            INP: result.vitals.INP?.value,
            LCP: result.vitals.LCP?.value,
            CLS: result.vitals.CLS?.value,
            scriptMs: result.work.ScriptDurationMs,
            frames: result.frames.rafFps,
            heap: result.memory?.postGcGrowthMiB,
          }),
        );
      }
    }
  }
  if (record)
    for (const phase of phases.filter((p) => ["filter", "memory"].includes(p)))
      for (const variant of variants) {
        let result;
        for (let attempt = 1; attempt <= 3 && !result; attempt++)
          try {
            result = await sample(
              variant,
              phase,
              `diagnostic-${attempt}`,
              true,
            );
          } catch (e) {
            console.log("record-retry", phase, variant, e.message);
          }
        assert(result, `No diagnostic ${phase} ${variant}`);
        console.log("recorded", phase, variant);
      }
} finally {
  await browser.close();
  backend.close();
}
