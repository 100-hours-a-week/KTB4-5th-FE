// NEXT_PUBLIC_LIST_PERF=true pnpm build && NEXT_PUBLIC_LIST_PERF=true pnpm start
// node scripts/perf/list-scroll.mjs [--only=ingredient:10:slow] [--network=slow4g] [--retry-only|--offline-only] [--base=http://localhost:3000]
// Real pages and Query cache; deterministic list APIs. Localhost only, no account required.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const base =
  process.argv.find((arg) => arg.startsWith("--base="))?.slice(7) ??
  "http://localhost:3000";
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
const network =
  process.argv.find((arg) => arg.startsWith("--network="))?.slice(10) ??
  "fast4g";
if (!["fast4g", "slow4g"].includes(network))
  throw new Error("--network는 fast4g 또는 slow4g여야 합니다.");
const retryOnly = process.argv.includes("--retry-only");
const offlineOnly = process.argv.includes("--offline-only");
const runs = Number(
  process.argv.find((arg) => arg.startsWith("--runs="))?.slice(7) ?? 1,
);
if (!Number.isInteger(runs) || runs < 1)
  throw new Error("--runs는 양의 정수여야 합니다.");
const traceRequests = process.argv.includes("--trace-requests");
const parsedBase = new URL(base);
if (!["localhost", "127.0.0.1"].includes(parsedBase.hostname))
  throw new Error("로컬 서버에서만 실행할 수 있습니다.");
const output = path.resolve("scripts/perf/out/list-scroll", network);
fs.mkdirSync(output, { recursive: true });
const rows = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const itemSelector = {
  ingredient:
    'section[aria-label="재고 목록"] li:has(a[href^="/refrigerator/ingredients/"])',
  notification: 'section[aria-label="알림 목록"] li:has(a)',
};
const pathByType = {
  ingredient: "/refrigerator",
  notification: "/notifications",
};
const json = (data) => ({ code: "PERF-200-001", message: "OK", data });
const ingredient = (i) => ({
  ingredientId: String(i + 1),
  name: `재료 ${String(i + 1).padStart(3, "0")}`,
  category: "VEGETABLE",
  quantity: 1,
  weightValue: null,
  weightUnit: "NONE",
  storageType: "REFRIGERATED",
  status: "NORMAL",
  daysUntilExpiration: 10,
});
const notification = (i) => ({
  notificationId: String(i + 1),
  type: "MEMBER",
  title: `알림 ${String(i + 1).padStart(3, "0")}`,
  body: "성능 측정용 알림",
  readAt: "2026-10-07T00:00:00+09:00",
  createdAt: "2026-10-07T00:00:00+09:00",
});

async function run(
  browser,
  type,
  count,
  speed,
  failure = false,
  offline = false,
  round = 1,
) {
  const label = `${type}-${count}-${speed}${failure ? "-retry" : ""}${offline ? "-offline" : ""}${runs > 1 ? `-run${round}` : ""}`;
  const visibleCount = type === "notification" ? Math.min(count, 99) : count;
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    serviceWorkers: "block",
  });
  await context.addCookies([
    { name: "accessToken", value: "local-perf-fixture", url: base },
    { name: "currentRefrigeratorId", value: "1", url: base },
  ]);
  await context.addInitScript(() => {
    window.__listPerfMarks = [];
    new MutationObserver(() => {
      const root = document.querySelector(
        'section[aria-label="재고 목록"], section[aria-label="알림 목록"]',
      );
      if (!root) return;
      const count = root.querySelectorAll("li:has(a)").length;
      if (count !== window.__listPerfMarks.at(-1)?.count)
        window.__listPerfMarks.push({ count, at: Date.now() });
    }).observe(document, { childList: true, subtree: true });
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const requests = [];
  let failAttempts = 0;
  let offlineActive = false;
  let phase = "initial";
  let active = 0;
  let maxConcurrent = 0;
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    const list =
      type === "ingredient"
        ? /\/refrigerators\/[^/]+\/ingredients$/.test(pathname)
        : /\/refrigerators\/[^/]+\/notifications$/.test(pathname);
    if (list) {
      const cursor = Number(url.searchParams.get("cursor") ?? 0);
      const size = Math.min(10, count - cursor);
      const entry = {
        cursor,
        phase,
        startedAt: Date.now(),
        finishedAt: null,
        failed: false,
      };
      requests.push(entry);
      active++;
      maxConcurrent = Math.max(maxConcurrent, active);
      try {
        await sleep(network === "slow4g" ? 563 : 165);
        if (offlineActive || (failure && cursor === 10 && failAttempts < 3)) {
          failAttempts++;
          entry.failed = true;
          await route.abort("internetdisconnected");
        } else {
          const nextCursor =
            cursor + size < count ? String(cursor + size) : null;
          const data =
            type === "ingredient"
              ? {
                  ingredientsNum: count,
                  filteredCount: count,
                  refrigeratorCapacity: 100,
                  ingredients: Array.from({ length: size }, (_, n) =>
                    ingredient(cursor + n),
                  ),
                  nextCursor,
                }
              : {
                  expiredIngredientsNum: 0,
                  notifications: Array.from({ length: size }, (_, n) =>
                    notification(cursor + n),
                  ),
                  nextCursor,
                  hasNext: nextCursor !== null,
                };
          const body = JSON.stringify(json(data));
          await sleep(body.length / (network === "slow4g" ? 184 : 1125));
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body,
          });
        }
      } finally {
        entry.finishedAt = Date.now();
        active--;
      }
      return;
    }
    const data = pathname.endsWith("/refrigerators/current")
      ? [
          {
            refrigeratorId: 1,
            name: "성능 측정",
            capacity: 100,
            expiredCount: 0,
          },
        ]
      : pathname.endsWith("/notifications/stream")
        ? { notificationId: null }
        : pathname.endsWith("/notifications/unread-count")
          ? { refrigeratorId: "1", unreadCount: 0 }
          : {};
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(json(data)),
    });
  });
  const selector = itemSelector[type];
  try {
    const before = await cdp.send("Performance.getMetrics");
    const trace = [];
    cdp.on("Tracing.dataCollected", ({ value }) => trace.push(...value));
    await cdp.send("Tracing.start", {
      categories: "devtools.timeline",
      transferMode: "ReportEvents",
    });
    await page.goto(base + pathByType[type], { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      ({ selector }) => document.querySelectorAll(selector).length >= 10,
      { selector },
      { timeout: 30000 },
    );
    if (!(await page.evaluate(() => Boolean(window.__listPerfQuerySnapshot))))
      throw new Error(
        "NEXT_PUBLIC_LIST_PERF=true로 빌드해야 Query Cache를 측정할 수 있습니다.",
      );
    if (offline) {
      phase = "offline";
      offlineActive = true;
      await context.setOffline(true);
      await page
        .locator(
          `section[aria-label="${type === "ingredient" ? "재고" : "알림"} 목록"]`,
        )
        .evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
      await sleep(1500);
      const requestsWhileOffline = requests.filter(
        (r) => r.cursor === 10,
      ).length;
      await page.screenshot({
        path: path.join(output, `${label}-disconnected.png`),
      });
      offlineActive = false;
      phase = "restored";
      await context.setOffline(false);
      await page.waitForFunction(
        ({ selector }) => document.querySelectorAll(selector).length >= 20,
        { selector },
        { timeout: 20000 },
      );
      await sleep(1200);
      const result = {
        label,
        network,
        requestsWhileOffline,
        requestsAfterRestore:
          requests.filter((r) => r.cursor === 10).length - requestsWhileOffline,
        cursor10Attempts: requests
          .filter((r) => r.cursor === 10)
          .map((r) => ({
            failed: r.failed,
            startedAt: r.startedAt,
            finishedAt: r.finishedAt,
          })),
        visibleAfterRestore: await page.locator(selector).count(),
        ...(traceRequests ? { requestTimeline: requests } : {}),
      };
      rows.push(result);
      await page.screenshot({ path: path.join(output, `${label}.png`) });
      await cdp.send("Tracing.end");
      console.log(JSON.stringify(result));
      return;
    }
    let loops = 0;
    phase = "scrolling";
    while (
      (await page.locator(selector).count()) < visibleCount &&
      loops++ < 250
    ) {
      await page
        .locator(
          `section[aria-label="${type === "ingredient" ? "재고" : "알림"} 목록"]`,
        )
        .evaluate(
          (el, step) => {
            el.scrollTop = Math.min(el.scrollHeight, el.scrollTop + step);
          },
          speed === "slow" ? 320 : 100000,
        );
      await sleep(speed === "slow" ? 80 : 150);
      if (
        failure &&
        (await page.getByRole("button", { name: "다시 시도" }).count())
      )
        break;
    }
    let requestsBeforeRetry;
    if (failure) {
      await page
        .getByRole("button", { name: "다시 시도" })
        .waitFor({ timeout: 30000 });
      await page.screenshot({
        path: path.join(output, `${label}-failure.png`),
      });
      requestsBeforeRetry = requests.length;
      await sleep(1200);
      const automaticRepeat = requests.length - requestsBeforeRetry;
      const retry = page.getByRole("button", { name: "다시 시도" });
      await retry.click();
      await retry.click({ force: true }).catch(() => {});
      await page.waitForFunction(
        ({ selector }) => document.querySelectorAll(selector).length >= 20,
        { selector },
        { timeout: 15000 },
      );
      rows.push({
        label: `${label}-failure`,
        automaticRepeat,
        retryRequests: requests.length - requestsBeforeRetry,
        maxConcurrent,
        failedAttempts: failAttempts,
      });
    }
    if (!failure)
      await page.waitForFunction(
        ({ selector, visibleCount }) =>
          document.querySelectorAll(selector).length === visibleCount,
        { selector, visibleCount },
        { timeout: 10000 },
      );
    const traceDone = new Promise((resolve) =>
      cdp.once("Tracing.tracingComplete", resolve),
    );
    await cdp.send("Tracing.end");
    await traceDone;
    const after = await cdp.send("Performance.getMetrics");
    const metric = (snapshot, key) =>
      snapshot.metrics.find((m) => m.name === key)?.value ?? 0;
    const cache = await page.evaluate(
      (type) => window.__listPerfQuerySnapshot(type),
      type,
    );
    const marks = await page.evaluate(() => window.__listPerfMarks);
    const delays = requests
      .filter((r) => !r.failed && r.cursor > 0)
      .map((r) => {
        const mark = marks.find(
          (m) =>
            m.count >= Math.min(r.cursor + 10, visibleCount) &&
            m.at >= r.finishedAt - 10,
        );
        return mark ? Math.round(mark.at - r.finishedAt) : null;
      })
      .filter((v) => v !== null);
    const result = {
      label,
      network,
      requested: count,
      visible: await page.locator(selector).count(),
      requests: requests.length,
      uniqueCursors: new Set(requests.map((r) => r.cursor)).size,
      duplicateCursors:
        requests.length - new Set(requests.map((r) => r.cursor)).size,
      maxConcurrent,
      cardDelayMedianMs: delays.length
        ? delays.sort((a, b) => a - b)[Math.floor(delays.length / 2)]
        : null,
      domNodes: metric(after, "Nodes"),
      jsHeapMb: +(metric(after, "JSHeapUsedSize") / 1048576).toFixed(2),
      layoutMs: +(
        (metric(after, "LayoutDuration") - metric(before, "LayoutDuration")) *
        1000
      ).toFixed(1),
      paintMs: +(
        trace
          .filter((event) => event.name === "Paint")
          .reduce((sum, event) => sum + (event.dur ?? 0), 0) / 1000
      ).toFixed(1),
      styleMs: +(
        (metric(after, "RecalcStyleDuration") -
          metric(before, "RecalcStyleDuration")) *
        1000
      ).toFixed(1),
      cache,
      ...(traceRequests ? { requestTimeline: requests } : {}),
    };
    rows.push(result);
    await page.screenshot({ path: path.join(output, `${label}.png`) });
    console.log(JSON.stringify(result));
  } catch (error) {
    await page
      .screenshot({ path: path.join(output, `${label}-error.png`) })
      .catch(() => {});
    console.error(label, {
      visible: await page
        .locator(selector)
        .count()
        .catch(() => -1),
      requests,
      url: page.url(),
    });
    throw error;
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ channel: "chrome" });
try {
  if (offlineOnly)
    for (const type of ["ingredient", "notification"])
      for (let round = 1; round <= runs; round++)
        await run(browser, type, 100, "fast", false, true, round);
  if (!retryOnly && !offlineOnly)
    for (const type of ["ingredient", "notification"])
      for (const count of [10, 50, 100])
        for (const speed of ["slow", "fast"]) {
          if (only && only !== `${type}:${count}:${speed}`) continue;
          for (let round = 1; round <= runs; round++)
            await run(browser, type, count, speed, false, false, round);
        }
  if (!only && !offlineOnly)
    for (const type of ["ingredient", "notification"])
      for (let round = 1; round <= runs; round++)
        await run(browser, type, 100, "fast", true, false, round);
  fs.writeFileSync(
    path.join(
      output,
      offlineOnly
        ? "offline-results.json"
        : only
          ? `${only.replaceAll(":", "-")}${runs > 1 ? `-${runs}runs` : ""}.json`
          : runs > 1
            ? `results-${runs}runs.json`
            : "results.json",
    ),
    JSON.stringify(rows, null, 2),
  );
} finally {
  await browser.close();
}
