// #178: production builds on separate ports, one first click per fresh context.
// PERF_LOGIN_ID=... PERF_LOGIN_PW=... node scripts/perf/filter-chip-178.mjs --before=http://localhost:3011 --after=http://localhost:3012
// Optional: --phase=diagnostic|pilot|main|all --effect=0.2 --out=scripts/perf/out/filter-chip-178
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const option = (name, fallback) => process.argv.find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const before = option("before", "http://localhost:3011");
const after = option("after", "http://localhost:3012");
const middle = option("middle", "");
const bases = Object.fromEntries(Object.entries({ before, middle, after }).filter(([, base]) => base));
const phase = option("phase", "all");
const diagnosticVariant = option("diagnostic-variant", "before");
const effect = Number(option("effect", "0.2"));
const chipLabel = option("chip", "만료");
const filterValue = option("filter", "EXPIRED");
const scrollFirst = process.argv.includes("--scroll");
const settleMs = Number(option("settle", scrollFirst ? "2000" : "100"));
const fixture = Number(option("fixture", "0"));
const scrollRounds = Number(option("scroll-rounds", "20"));
const pilotRuns = Number(option("n", "20"));
const out = path.resolve(option("out", "scripts/perf/out/filter-chip-178"));
if (!Object.values(bases).every((base) => ["localhost", "127.0.0.1"].includes(new URL(base).hostname))) throw new Error("로컬 빌드만 측정할 수 있습니다.");
if (!["diagnostic", "pilot", "main", "all"].includes(phase) || !Object.keys(bases).includes(diagnosticVariant) || !(effect > 0 && effect < 1)) throw new Error("--phase, --diagnostic-variant 또는 --effect 값이 잘못되었습니다.");
fs.mkdirSync(out, { recursive: true });

const selector = 'section[aria-label="재고 목록"]';
const card = `${selector} a[href^="/refrigerator/ingredients/"]`;
const chip = '[role="group"][aria-label="재고 필터"] button';
const keys = ["inpMs", "chipPaintMs", "loadingPaintMs", "listPaintMs", "fe1Ms", "networkMs", "fe2Ms", "cls", "firstCardMs", "lcpMs"];
const median = (a) => quantile(a, 0.5);
function quantile(values, q) {
  const a = [...values].sort((x, y) => x - y);
  const i = (a.length - 1) * q;
  return a[Math.floor(i)] + (a[Math.ceil(i)] - a[Math.floor(i)]) * (i % 1);
}
function summarize(rows, key) {
  const values = rows.map((row) => row[key]).filter(Number.isFinite);
  if (!values.length) return null;
  const mean = values.reduce((a, b) => a + b) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, values.length - 1));
  return { n: values.length, median: median(values), iqr: quantile(values, 0.75) - quantile(values, 0.25), p90: quantile(values, 0.9), p95: quantile(values, 0.95), cv: mean ? sd / mean : null };
}
function rankTest(a, b) {
  const values = [...a.map((x) => [x, 0]), ...b.map((x) => [x, 1])].sort((x, y) => x[0] - y[0]);
  let rank = 1, rankB = 0, tieCorrection = 0;
  while (rank <= values.length) {
    let end = rank;
    while (end < values.length && values[end][0] === values[rank - 1][0]) end++;
    const size = end - rank + 1;
    tieCorrection += size ** 3 - size;
    for (let i = rank - 1; i < end; i++) if (values[i][1]) rankB += (rank + end) / 2;
    rank = end + 1;
  }
  const uB = rankB - b.length * (b.length + 1) / 2;
  const n = a.length + b.length;
  const variance = a.length * b.length / 12 * (n + 1 - tieCorrection / (n * (n - 1)));
  const z = variance ? Math.max(0, Math.abs(uB - a.length * b.length / 2) - 0.5) / Math.sqrt(variance) : 0;
  // Normal approximation with tie correction; two-sided p, adequate for n >= 10.
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const cdfTail = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * (0.319381530 * t - 0.356563782 * t ** 2 + 1.781477937 * t ** 3 - 1.821255978 * t ** 4 + 1.330274429 * t ** 5);
  return { p: Math.min(1, 2 * cdfTail), cliffsDelta: 2 * uB / (a.length * b.length) - 1 };
}
function bootstrapP90(a, b) {
  const differences = [];
  let seed = 178;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
  for (let i = 0; i < 1000; i++) {
    const sample = (values) => Array.from({ length: values.length }, () => values[Math.floor(random() * values.length)]);
    differences.push(quantile(sample(b), 0.9) - quantile(sample(a), 0.9));
  }
  return [quantile(differences, 0.025), quantile(differences, 0.975)];
}
function writeCsv(file, rows) {
  const fields = ["phase", "variant", "run", "warmup", ...keys, "rscCount", "apiCount", "beforeTop", "beforeHeight", "afterTop", "afterHeight", "layoutShift", "lcpElement", "cls", "shiftCount", "shiftSources", "over1000Ms", "trace"];
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  fs.writeFileSync(file, [fields.join(","), ...rows.map((row) => fields.map((field) => quote(row[field])).join(","))].join("\n") + "\n");
}

const fixtureStatuses = ["NORMAL", "NORMAL", "EXPIRING_SOON", "EXPIRED"];
const fixtureCategories = ["VEGETABLE", "FRUIT", "MEAT"];
const fixtureItems = Array.from({ length: fixture }, (_, i) => {
  const status = fixtureStatuses[i % 4];
  return { ingredientId: String(i + 1), name: `재료 ${String(i + 1).padStart(4, "0")}`, category: fixtureCategories[i % 3], quantity: 1, weightValue: null, weightUnit: "NONE", storageType: i % 3 === 2 ? "FROZEN" : "REFRIGERATED", status, daysUntilExpiration: status === "EXPIRED" ? -1 : status === "EXPIRING_SOON" ? 2 : 10 };
});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function routeFixture(route) {
  const url = new URL(route.request().url());
  const ok = (data) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: "PERF-200-001", message: "OK", data }) });
  if (/\/refrigerators\/[^/]+\/ingredients$/.test(url.pathname)) {
    const filter = url.searchParams.get("filter");
    const category = url.searchParams.get("category");
    const matched = fixtureItems.filter((x) => (!category || x.category === category) && (!filter || (filter === "REFRIGERATED" || filter === "FROZEN" ? x.storageType === filter : x.status === filter)));
    const cursor = Number(url.searchParams.get("cursor") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 10);
    const ingredients = matched.slice(cursor, cursor + size);
    const nextCursor = cursor + size < matched.length ? String(cursor + size) : null;
    const body = { ingredientsNum: fixture, filteredCount: matched.length, refrigeratorCapacity: Math.max(100, fixture), ingredients, nextCursor };
    await sleep(562.5 + JSON.stringify(body).length / 180);
    return ok(body);
  }
  await sleep(562.5);
  if (url.pathname.endsWith("/refrigerators/current")) return ok([{ refrigeratorId: 1, name: "성능 측정", capacity: Math.max(100, fixture), expiredCount: 0 }]);
  if (url.pathname.endsWith("/notifications/stream")) return ok({ notificationId: null });
  if (url.pathname.endsWith("/notifications/unread-count")) return ok({ refrigeratorId: "1", unreadCount: 0 });
  return ok({});
}

async function newContext(browser, options) {
  const context = await browser.newContext(options);
  if (fixture) {
    await context.route("**/api/v1/**", routeFixture);
    await context.addCookies([{ name: "currentRefrigeratorId", value: "1", domain: "localhost", path: "/" }]);
    await context.addInitScript(() => localStorage.setItem("dameokja.currentRefrigeratorId", "1"));
  }
  if (process.env.PERF_API_ORIGIN) await context.route("**/api/v1/**", (route) => route.continue({ headers: { ...route.request().headers(), origin: process.env.PERF_API_ORIGIN } }));
  return context;
}

async function signIn(browser) {
  const context = await newContext(browser, { serviceWorkers: "block" });
  try {
    const page = await context.newPage();
    await page.goto(`${before}/login/local`);
    await page.getByPlaceholder("아이디를 입력해주세요").fill(process.env.PERF_LOGIN_ID);
    await page.getByPlaceholder("비밀번호를 입력해주세요").fill(process.env.PERF_LOGIN_PW);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${before}/`, { timeout: 20000 });
    return await context.storageState();
  } finally { await context.close(); }
}

async function verifyOrigin(browser, base, state) {
  const context = await newContext(browser, { storageState: state, serviceWorkers: "block" });
  try {
    const page = await context.newPage();
    await page.goto(`${base}/refrigerator`);
    await page.locator(chip).first().waitFor();
    await page.locator(card).first().waitFor({ timeout: 20000 });
    if (new URL(page.url()).pathname !== "/refrigerator") throw new Error(`${base} 인증 실패: ${page.url()}`);
    return await context.storageState();
  } finally { await context.close(); }
}

async function sample(browser, state, variant, run, stage, warmup, trace) {
  const base = bases[variant];
  const context = await newContext(browser, { storageState: state, serviceWorkers: "block", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(option("cpu", "4")) });
  await page.addInitScript(({ selector, card, chip, chipLabel, filterValue }) => {
    const monitor = { lcp: null, lcpAtClick: null, firstCard: null, click: null, chip: null, loading: null, list: null, initialIds: null, layout: [], events: [], shifts: [] };
    window.__filter178 = monitor;
    const bounds = () => { const rect = document.querySelector(selector)?.getBoundingClientRect(); return rect && { top: rect.top, height: rect.height }; };
    const paint = (key) => { if (monitor.click !== null && monitor[key] === null) requestAnimationFrame(() => setTimeout(() => { if (monitor[key] === null) { monitor[key] = performance.now(); monitor.layout.push({ phase: key, ...bounds() }); } }, 0)); };
    const check = () => {
      if (monitor.firstCard === null && document.querySelector(card)) monitor.firstCard = performance.now();
      const button = [...document.querySelectorAll(chip)].find((x) => x.textContent.trim() === chipLabel);
      if (button?.getAttribute("aria-pressed") === "true") paint("chip");
      const section = document.querySelector(selector);
      if (section?.textContent.includes("재고를 불러오는 중입니다")) paint("loading");
      const ids = [...document.querySelectorAll(card)].map((x) => x.getAttribute("href")).join(",");
      if (location.search.includes(`filter=${filterValue}`) && !section?.textContent.includes("재고를 불러오는 중입니다") && (monitor.loading !== null || (ids !== "" && ids !== monitor.initialIds) || section?.textContent.includes("조건에 맞는 재료가 없어요"))) paint("list");
    };
    new MutationObserver(check).observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-pressed", "class"] });
    addEventListener("pointerdown", (event) => {
      if (event.target.closest(chip)?.textContent.trim() !== chipLabel || monitor.click !== null) return;
      monitor.click = performance.now();
      monitor.lcpAtClick = monitor.lcp;
      monitor.lcpElementAtClick = monitor.lcpElement;
      monitor.layout.push({ phase: "before", ...bounds() });
    }, true);
    if (PerformanceObserver.supportedEntryTypes.includes("event")) new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries()) if (entry.interactionId && ["pointerdown", "pointerup", "click"].includes(entry.name)) monitor.events.push({ name: entry.name, start: entry.startTime, duration: entry.duration, interactionId: entry.interactionId });
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    new PerformanceObserver((entries) => { for (const entry of entries.getEntries()) { monitor.lcp = entry.startTime; monitor.lcpElement = `${entry.element?.tagName ?? "?"}:${(entry.url || entry.element?.textContent || "").trim().slice(0, 24)}`; } }).observe({ type: "largest-contentful-paint", buffered: true });
    if (PerformanceObserver.supportedEntryTypes.includes("layout-shift")) new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries()) if (monitor.click !== null && entry.startTime >= monitor.click) monitor.shifts.push({ start: entry.startTime, value: entry.value, hadRecentInput: entry.hadRecentInput, sources: (entry.sources ?? []).map((x) => x.node?.nodeName ?? "?") });
    }).observe({ type: "layout-shift", buffered: true });
  }, { selector, card, chip, chipLabel, filterValue });
  const requests = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    const kind = url.pathname.startsWith("/api/v1/") ? "api" : request.headers().rsc || url.searchParams.has("_rsc") ? "rsc" : null;
    if (kind) requests.push({ kind, url: request.url(), method: request.method(), startedAt: Date.now(), status: null, finishedAt: null });
  });
  page.on("response", (response) => { const request = requests.find((x) => x.url === response.url() && x.status === null); if (request) request.status = response.status(); });
  page.on("requestfinished", (request) => { const entry = requests.find((x) => x.url === request.url() && x.finishedAt === null); if (entry) entry.finishedAt = Date.now(); });
  page.on("requestfailed", (request) => { const entry = requests.find((x) => x.url === request.url() && x.finishedAt === null); if (entry) { entry.status = "failed"; entry.finishedAt = Date.now(); } });
  const traceEvents = [];
  cdp.on("Tracing.dataCollected", ({ value }) => traceEvents.push(...value));
  try {
    await page.goto(`${base}/refrigerator`);
    await page.locator(card).first().waitFor({ timeout: 30000 });
    await page.waitForFunction(({ chip, chipLabel }) => [...document.querySelectorAll(chip)].some((x) => x.textContent.trim() === chipLabel), { chip, chipLabel });
    if (scrollFirst) {
      let height = -1;
      for (let i = 0; i < scrollRounds; i++) {
        const next = await page.evaluate((selector) => { const el = document.querySelector(selector); el.scrollTop = el.scrollHeight; return el.scrollHeight; }, selector);
        if (next === height) break;
        height = next;
        await page.waitForTimeout(1500);
      }
    }
    await page.evaluate((card) => { window.__filter178.initialIds = [...document.querySelectorAll(card)].map((x) => x.getAttribute("href")).join(","); }, card);
    // Let initial requests settle; the sample begins at the first click only.
    await page.waitForTimeout(1000);
    const priorRequests = requests.length;
    await cdp.send("Tracing.start", { categories: option("trace-categories", "devtools.timeline,toplevel,blink.user_timing"), transferMode: "ReportEvents" });
    await page.getByRole("group", { name: "재고 필터" }).getByRole("button", { name: chipLabel, exact: true }).click();
    await page.waitForFunction(() => window.__filter178.list !== null, undefined, { timeout: 30000 });
    await page.waitForTimeout(settleMs);
    const done = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
    await cdp.send("Tracing.end"); await done;
    const data = await page.evaluate(() => ({ monitor: window.__filter178, origin: performance.timeOrigin, resources: performance.getEntriesByType("resource").map((e) => ({ name: e.name, start: e.startTime, end: e.responseEnd })) }));
    const clicked = data.monitor.click;
    const touched = requests.slice(priorRequests).filter((x) => x.startedAt >= data.origin + clicked - 100);
    const resource = data.resources.filter((x) => x.start >= clicked - 10 && x.name.includes(`filter=${filterValue}`) && (x.name.includes("/refrigerator?") || x.name.includes("/ingredients?")));
    const networkStart = resource.length ? Math.min(...resource.map((x) => x.start)) : null;
    const networkEnd = resource.length ? Math.max(...resource.map((x) => x.end)) : null;
    const clickedEvents = data.monitor.events.filter((x) => x.start >= clicked - 100 && x.start <= clicked + 1000);
    const interaction = clickedEvents.find((x) => x.name === "click")?.interactionId ?? clickedEvents[0]?.interactionId;
    const inp = Math.max(0, ...clickedEvents.filter((x) => x.interactionId === interaction).map((x) => x.duration));
    const beforeRect = data.monitor.layout.find((x) => x.phase === "before");
    const afterRect = data.monitor.layout.find((x) => x.phase === "list");
    const row = {
      phase: stage, variant, run, warmup, inpMs: inp || null,
      chipPaintMs: data.monitor.chip === null ? null : data.monitor.chip - clicked,
      loadingPaintMs: data.monitor.loading === null ? null : data.monitor.loading - clicked,
      listPaintMs: data.monitor.list - clicked,
      fe1Ms: networkStart === null ? null : networkStart - clicked,
      networkMs: networkStart === null ? null : networkEnd - networkStart,
      fe2Ms: networkEnd === null ? null : data.monitor.list - networkEnd,
      firstCardMs: data.monitor.firstCard,
      lcpMs: data.monitor.lcpAtClick,
      lcpElement: data.monitor.lcpElementAtClick,
      rscCount: touched.filter((x) => x.kind === "rsc").length,
      apiCount: touched.filter((x) => x.kind === "api").length,
      beforeTop: beforeRect?.top, beforeHeight: beforeRect?.height,
      afterTop: afterRect?.top, afterHeight: afterRect?.height,
      layoutShift: data.monitor.shifts.reduce((sum, x) => sum + x.value, 0),
      cls: data.monitor.shifts.filter((x) => !x.hadRecentInput).reduce((sum, x) => sum + x.value, 0),
      shiftCount: data.monitor.shifts.filter((x) => !x.hadRecentInput).length,
      shiftSources: [...new Set(data.monitor.shifts.filter((x) => !x.hadRecentInput).flatMap((x) => x.sources))].join("|"),
      over1000Ms: data.monitor.list - clicked > 1000,
      requests: touched, resources: resource, layout: data.monitor.layout, eventTiming: clickedEvents,
    };
    if (trace || row.over1000Ms) {
      row.trace = `${stage}-${variant}-${run}-trace.json`;
      fs.writeFileSync(path.join(out, row.trace), JSON.stringify({ traceEvents }));
    }
    return row;
  } finally { await context.close(); }
}

function report(rows, name) {
  const groups = Object.fromEntries(Object.keys(bases).map((variant) => [variant, rows.filter((x) => x.variant === variant && !x.warmup)]));
  const metrics = Object.fromEntries(keys.map((key) => {
    const a = groups.before.map((x) => x[key]).filter(Number.isFinite);
    const b = groups.after.map((x) => x[key]).filter(Number.isFinite);
    return [key, { ...Object.fromEntries(Object.entries(groups).map(([variant, group]) => [variant, summarize(group, key)])), comparison: a.length && b.length ? { ...rankTest(a, b), p90DifferenceCi95: bootstrapP90(a, b), p90ReferenceOnly: a.length < 100 || b.length < 100, p95ReferenceOnly: a.length < 200 || b.length < 200 } : null }];
  }));
  const result = { name, metrics, counts: Object.fromEntries(Object.entries(groups).map(([variant, group]) => [variant, { samples: group.length, rsc: group.map((x) => x.rscCount), api: group.map((x) => x.apiCount), layoutMismatch: group.filter((x) => x.beforeTop !== x.afterTop || x.beforeHeight !== x.afterHeight).length, over1000Ms: group.filter((x) => x.over1000Ms).length }])) };
  fs.writeFileSync(path.join(out, `${name}-summary.json`), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (process.argv.includes("--self-test")) {
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(quantile([1, 2, 3, 4, 5], 0.9), 4.6);
  assert.ok(rankTest([1, 2, 3], [4, 5, 6]).cliffsDelta > 0);
  console.log("통계 계산 자체 점검 통과");
  process.exit(0);
}
if (!fixture && !process.env.PERF_STORAGE_STATE && (!process.env.PERF_LOGIN_ID || !process.env.PERF_LOGIN_PW)) throw new Error("PERF_STORAGE_STATE 또는 PERF_LOGIN_ID와 PERF_LOGIN_PW를 설정하세요.");
const browser = await chromium.launch({ channel: "chrome" });
const all = [];
try {
  const state = fixture ? { cookies: [{ name: "accessToken", value: "local-perf-fixture", domain: "localhost", path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" }], origins: [] } : process.env.PERF_STORAGE_STATE ? JSON.parse(fs.readFileSync(process.env.PERF_STORAGE_STATE)) : await signIn(browser);
  const states = {};
  for (const [variant, base] of Object.entries(bases)) states[variant] = await verifyOrigin(browser, base, state);
  console.log("두 포트에서 같은 인증 상태로 목록 접근 확인");
  const runPair = async (name, n, warmups, traceCount, variants = Object.keys(bases)) => {
    const rows = [];
    for (let i = 1; i <= n + warmups; i++) {
      for (const variant of variants) {
        let row;
        try { row = await sample(browser, states[variant], variant, i, name, i <= warmups, i <= traceCount); }
        catch (error) { console.log(`${name} ${variant} ${i}: 재시도 (${error.name})`); row = await sample(browser, states[variant], variant, i, name, i <= warmups, i <= traceCount); }
        rows.push(row); all.push(row);
        fs.writeFileSync(path.join(out, "raw.json"), JSON.stringify(all, null, 2));
        writeCsv(path.join(out, "raw.csv"), all);
        console.log(`${name} ${variant} ${i}: INP=${row.inpMs}, chip=${row.chipPaintMs?.toFixed(1)}, loading=${row.loadingPaintMs?.toFixed(1) ?? "none"}, firstCard=${row.firstCardMs?.toFixed(0)}, LCP=${row.lcpMs?.toFixed(0)}(${row.lcpElement}), list=${row.listPaintMs.toFixed(1)}, RSC=${row.rscCount}, API=${row.apiCount}, CLS=${row.cls.toFixed(4)}`);
      }
    }
    return report(rows, name);
  };
  if (["diagnostic", "all"].includes(phase)) await runPair("diagnostic", 8, 2, 10, [diagnosticVariant]);
  if (["pilot", "all"].includes(phase)) await runPair("pilot", pilotRuns, 2, 0);
  if (["main", "all"].includes(phase)) {
    const pilotFile = path.join(out, "pilot-summary.json");
    if (!fs.existsSync(pilotFile)) throw new Error("파일럿 결과가 없습니다. --phase=pilot을 먼저 실행하세요.");
    const pilot = JSON.parse(fs.readFileSync(pilotFile));
    const required = Object.fromEntries(keys.filter((x) => x !== "loadingPaintMs").map((key) => [key, Math.max(10, Math.ceil(16 * (Math.max(pilot.metrics[key].before?.cv ?? 0, pilot.metrics[key].after?.cv ?? 0) / effect) ** 2))]));
    fs.writeFileSync(path.join(out, "sample-size.json"), JSON.stringify({ effect, required }, null, 2));
    const n = Math.max(...Object.values(required));
    if (n > 50) { console.log(`본측정 중단: 필요 n=${n} > 50. 지표별 CV와 로드·네트워크·백엔드 변동을 조사하세요.`); }
    else await runPair("main", n, 2, 0);
  }
} finally { await browser.close(); }
