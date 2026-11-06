import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import http2 from "node:http2";
import path from "node:path";
import { chromium } from "playwright-core";

const option = (name, fallback) => process.argv.find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const live = Object.fromEntries(option("live", "").split(",").filter(Boolean).map((x) => x.split("=")));
const bases = Object.fromEntries(["a", "b", "c", "d", "e", "f", "g", "h"].map((v, i) => [v, option(v, Object.keys(live).length ? "http://localhost:3000" : `http://localhost:${3013 + i}`)]).filter(([v]) => option("variants", "a,b,c").split(",").includes(v)));
const variants = Object.keys(bases);
const runs = Number(option("n", "10"));
const fixture = Number(option("fixture", "1000"));
const heavyCards = Number(option("heavy-cards", "0"));
const chipLabel = option("chip", process.argv.some((x) => x === "--action=category") ? "채소" : "만료");
const backendPort = Number(option("backend-port", "3020"));
const record = !process.argv.includes("--no-record");
const fastLoad = process.argv.includes("--fast-load");
const stayBottom = process.argv.includes("--stay-bottom");
const rapid = Number(option("rapid", "0"));
const firstLabel = option("first", "임박");
const block = Number(option("block", "10"));
const h2 = process.argv.includes("--h2");
const idle = Number(option("idle", "4000"));
const toggles = Number(option("toggles", "0"));
const toggleMs = Number(option("toggle-ms", "40000"));
const profileAll = process.argv.includes("--profile-all");
const action = option("action", "filter");
const scrollAt = Number(option("scroll-at", "0"));
const chipGroup = action === "category" ? "카테고리 필터" : "재고 필터";
const out = path.resolve(option("out", "scripts/perf/out/filter-chip-deferred"));
fs.mkdirSync(out, { recursive: true });

const statuses = ["NORMAL", "NORMAL", "EXPIRING_SOON", "EXPIRED"];
const categories = ["VEGETABLE", "FRUIT", "MEAT"];
const items = Array.from({ length: fixture }, (_, i) => {
  const status = statuses[i % 4];
  return { ingredientId: String(i + 1), name: `재료 ${String(i + 1).padStart(4, "0")}`, category: categories[i % 3], quantity: 1, weightValue: null, weightUnit: "NONE", storageType: i % 3 === 2 ? "FROZEN" : "REFRIGERATED", status, daysUntilExpiration: status === "EXPIRED" ? -1 : status === "EXPIRING_SOON" ? 2 : 10 };
});
let served = 0;
const envelope = (data) => JSON.stringify({ code: "PERF-200-001", message: "OK", data });
function respond(url) {
  if (/\/refrigerators\/[^/]+\/ingredients$/.test(url.pathname)) {
    const filter = url.searchParams.get("filter");
    const category = url.searchParams.get("category");
    const keyword = url.searchParams.get("keyword");
    const matched = items.filter((x) => (!keyword || x.name.includes(keyword)) && (!category || x.category === category) && (!filter || (filter === "REFRIGERATED" || filter === "FROZEN" ? x.storageType === filter : x.status === filter)));
    if (url.searchParams.get("sort") === "CREATED_DESC") matched.reverse();
    const cursor = Number(url.searchParams.get("cursor") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 10);
    if (!filter && !category && !keyword && url.searchParams.get("sort") !== "CREATED_DESC") served = Math.max(served, Math.min(cursor + size, matched.length));
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
if (!Object.keys(live).length) await new Promise((resolve) => backend.listen(backendPort, resolve));
const proxies = [];
if (h2) {
  const key = path.join(out, "localhost.key"), cert = path.join(out, "localhost.crt");
  if (!fs.existsSync(cert)) execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", key, "-out", cert, "-days", "7", "-subj", "/CN=localhost"], { stdio: "ignore" });
  const tls = { key: fs.readFileSync(key), cert: fs.readFileSync(cert), allowHTTP1: true };
  const hop = ["connection", "keep-alive", "transfer-encoding", "proxy-connection", "upgrade"];
  for (const [i, variant] of variants.entries()) {
    const target = new URL(bases[variant]);
    const server = http2.createSecureServer(tls, (req, res) => {
      const headers = Object.fromEntries(Object.entries(req.headers).filter(([k]) => !k.startsWith(":") && !hop.includes(k)));
      headers.host = target.host;
      const upstream = http.request({ host: target.hostname, port: target.port, path: req.url, method: req.method, headers }, (r) => {
        res.writeHead(r.statusCode, Object.fromEntries(Object.entries(r.headers).filter(([k]) => !hop.includes(k))));
        r.pipe(res);
      });
      upstream.on("error", () => { if (!res.headersSent) res.writeHead(502); res.end(); });
      req.pipe(upstream);
    });
    await new Promise((resolve) => server.listen(3443 + i, resolve));
    proxies.push(server);
    bases[variant] = `https://localhost:${3443 + i}`;
  }
}
let server = null;
const up = () => new Promise((resolve) => { const req = http.get("http://localhost:3000/login", (res) => { res.resume(); resolve(res.statusCode === 200); }); req.on("error", () => resolve(false)); req.setTimeout(2000, () => { req.destroy(); resolve(false); }); });
async function startServer(variant) {
  for (let i = 0; i < 150 && (await up()); i++) await new Promise((r) => setTimeout(r, 200));
  server = spawn("pnpm", ["exec", "next", "start", "-p", "3000"], { cwd: live[variant], env: { ...process.env, BACKEND_ORIGIN: "http://localhost:8080" }, detached: true, stdio: "ignore" });
  for (let i = 0; i < 100; i++) {
    if (await up()) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`server ${variant} not ready`);
}
async function stopServer() {
  if (!server) return;
  try { process.kill(-server.pid, "SIGTERM"); } catch {}
  server = null;
  for (let i = 0; i < 50; i++) {
    if (!(await up())) return;
    await new Promise((r) => setTimeout(r, 200));
  }
}
let liveState = null;
async function login(browser) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  try {
    const page = await context.newPage();
    await page.goto("http://localhost:3000/login/local");
    await page.getByPlaceholder("아이디를 입력해주세요").fill(process.env.PERF_LOGIN_ID);
    await page.getByPlaceholder("비밀번호를 입력해주세요").fill(process.env.PERF_LOGIN_PW);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("http://localhost:3000/", { timeout: 20000 });
    return await context.storageState();
  } finally {
    await context.close();
  }
}

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

const chipSelector = `[role="group"][aria-label="${chipGroup}"] > button`;
const cardSelector = 'section[aria-label="재고 목록"] a[href^="/refrigerator/ingredients/"]';

async function sample(browser, variant, dir) {
  const base = bases[variant];
  served = 0;
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    serviceWorkers: "block",
    ignoreHTTPSErrors: true,
    ...(liveState ? { storageState: liveState } : {}),
    ...(dir ? { recordVideo: { dir, size: { width: 390, height: 844 } }, recordHar: { path: path.join(dir, "network.har") } } : {}),
  });
  if (!liveState) await context.addCookies([{ name: "accessToken", value: "local-perf-fixture", url: base }, { name: "currentRefrigeratorId", value: "1", url: base }]);
  await context.addInitScript(({ chipSelector, cardSelector, chipLabel, action }) => {
    const m = { batch: 0, click: null, initialIds: null, chip: null, list: null, final: null, events: [], longTasks: [], skeleton: false };
    window.__chip = m;
    const paint = (key) => requestAnimationFrame(() => setTimeout(() => { m[key].paint = performance.now(); }, 0));
    new MutationObserver(() => {
      m.batch++;
      if (m.click === null) return;
      const now = performance.now();
      const chip = [...document.querySelectorAll(chipSelector)].find((x) => x.textContent.trim() === chipLabel);
      if (!m.chip && (action === "sort" || action === "search" || chip?.getAttribute("aria-pressed") === "true")) { m.chip = { batch: m.batch, commit: now }; paint("chip"); }
      const section = document.querySelector('section[aria-label="재고 목록"]');
      const loading = Boolean(document.querySelector('[role="status"][aria-label="재고를 불러오는 중입니다"]'));
      if (loading) m.skeleton = true;
      const cards = [...(section?.querySelectorAll(cardSelector) ?? [])];
      const ids = `${cards.slice(0, 3).map((x) => x.getAttribute("href")).join(",")}|${cards[0]?.closest("ul")?.childElementCount ?? 0}`;
      const empty = section?.textContent.includes("조건에 맞는 재료가 없어요");
      if (!m.list && (loading || ids !== m.initialIds || empty)) { m.list = { batch: m.batch, commit: now }; paint("list"); }
      if (!m.final && !loading && (ids !== m.initialIds || empty)) { m.final = { batch: m.batch, commit: now }; paint("final"); }
    }).observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-pressed"] });
    addEventListener("pointerdown", (e) => { if (m.click === null && e.target.closest(chipSelector)?.textContent.trim() === chipLabel) m.click = e.timeStamp; }, true);
    addEventListener("change", (e) => { if (m.click === null && action === "sort" && e.target.id === "ingredient-sort") m.click = e.timeStamp; }, true);
    addEventListener("keydown", (e) => { if (m.click === null && action === "search" && e.key === "Enter" && e.target.id === "ingredient-search") m.click = e.timeStamp; }, true);
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (e.interactionId) m.events.push({ name: e.name, start: e.startTime, duration: e.duration }); }).observe({ type: "event", durationThreshold: 16, buffered: true });
    new PerformanceObserver((list) => { for (const e of list.getEntries()) m.longTasks.push({ start: e.startTime, duration: e.duration }); }).observe({ type: "longtask", buffered: true });
  }, { chipSelector, cardSelector, chipLabel, action });
  if (rapid) await context.addInitScript(({ chipSelector, cardSelector, labels }) => {
    const r = { clicks: [], chips: {}, lists: [], last: null };
    window.__rapid = r;
    const paintOf = (o) => requestAnimationFrame(() => setTimeout(() => { o.paint = performance.now(); }, 0));
    addEventListener("pointerdown", (e) => { const label = e.target.closest(chipSelector)?.textContent.trim(); if (labels.includes(label)) r.clicks.push({ label, t: e.timeStamp }); }, true);
    new MutationObserver(() => {
      if (!r.clicks.length) return;
      const now = performance.now();
      for (const label of labels) {
        const chip = [...document.querySelectorAll(chipSelector)].find((x) => x.textContent.trim() === label);
        if (!r.chips[label] && chip?.getAttribute("aria-pressed") === "true") { r.chips[label] = { commit: now }; paintOf(r.chips[label]); }
      }
      const section = document.querySelector('section[aria-label="재고 목록"]');
      const loading = Boolean(document.querySelector('[role="status"][aria-label="재고를 불러오는 중입니다"]'));
      const id = section?.querySelector(cardSelector)?.getAttribute("href")?.match(/ingredients\/(\d+)/)?.[1];
      const sig = loading ? "loading" : section?.textContent.includes("조건에 맞는 재료가 없어요") ? "empty" : id;
      if (sig !== r.last) { r.last = sig; const entry = { sig, commit: now }; r.lists.push(entry); paintOf(entry); }
    }).observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-pressed"] });
  }, { chipSelector, cardSelector, labels: [firstLabel, chipLabel] });
  const page = await context.newPage();
  const videoStart = Date.now();
  const cdp = await context.newCDPSession(page);
  const throttle = async () => {
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 184320 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  };
  await cdp.send("Network.enable");
  const allUrls = [];
  const t0 = Date.now();
  cdp.on("Network.requestWillBeSent", (e) => { if (e.request.url.includes("/ingredients?")) allUrls.push(`${((Date.now() - t0) / 1000).toFixed(1)}s ${e.request.url.replace(/^.*\/ingredients\?/, "")}`); });
  if (!fastLoad) await throttle();
  try {
    await page.goto(`${base}/refrigerator`, { waitUntil: "load", timeout: 60000 });
    await page.locator(cardSelector).first().waitFor({ timeout: 30000 });
    const count = () => page.locator(cardSelector).count();
    let stale = 0;
    for (let i = 0; i < Math.ceil(heavyCards / 10) + 20 && (liveState ? stale < 3 && (await count()) < heavyCards : served < heavyCards); i++) {
      const before = liveState ? await count() : served;
      await page.locator('section[aria-label="재고 목록"]').evaluate((e) => e.scrollTo(0, e.scrollHeight));
      if (liveState) { for (let t = 0; t < 30 && (await count()) === before; t++) await page.waitForTimeout(100); stale = (await count()) === before ? stale + 1 : 0; }
      else if (fastLoad) for (let t = 0; t < 100 && served === before; t++) await page.waitForTimeout(100);
      else await page.waitForTimeout(800);
    }
    if (!stayBottom) await page.locator('section[aria-label="재고 목록"]').evaluate((e, at) => e.scrollTo(0, e.scrollHeight * at), scrollAt);
    if (fastLoad) await throttle();
    for (let i = 0; i < toggles; i++) {
      await page.waitForTimeout(toggleMs);
      await page.getByRole("group", { name: "재고 필터" }).getByRole("button", { name: i % 2 ? "전체" : "만료", exact: true }).click();
    }
    await page.waitForTimeout(idle);
    const cards = await count();
    await page.evaluate((s) => { const cards = [...document.querySelectorAll(`section[aria-label="재고 목록"] ${s.replace('section[aria-label="재고 목록"] ', "")}`)]; window.__chip.initialIds = `${cards.slice(0, 3).map((x) => x.getAttribute("href")).join(",")}|${cards[0]?.closest("ul")?.childElementCount ?? 0}`; }, cardSelector);
    const traceFile = dir ? path.join(dir, "trace.json") : profileAll ? path.join(out, `trace-${variant}.json`) : null;
    if (traceFile) await browser.startTracing(page, { path: traceFile, screenshots: Boolean(dir), categories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "disabled-by-default-devtools.screenshot", "blink.user_timing", "loading", "latencyInfo", "v8.execute", "disabled-by-default-v8.cpu_profiler"] });
    const apiBefore = await page.evaluate(() => performance.now());
    const reqs = new Map();
    const urls = [];
    cdp.on("Network.requestWillBeSent", (e) => { if (e.request.url.includes("/ingredients?")) { reqs.set(e.requestId, false); urls.push(e.request.url.replace(/^.*\/ingredients\?/, "")); } });
    cdp.on("Network.loadingFinished", (e) => { if (reqs.has(e.requestId)) reqs.set(e.requestId, true); });
    cdp.on("Network.loadingFailed", (e) => { if (reqs.has(e.requestId)) reqs.set(e.requestId, true); });
    if (rapid) { const row = await rapidClicks(page, cdp, dir, browser); return { ...row, cards, loaded: served, videoOffsetS: (row.clickWall - videoStart) / 1000 }; }
    if (action === "sort") await page.selectOption("#ingredient-sort", "CREATED_DESC");
    else if (action === "search") { await page.fill("#ingredient-search", "재료 1"); await page.press("#ingredient-search", "Enter"); }
    else await page.getByRole("group", { name: chipGroup }).getByRole("button", { name: chipLabel, exact: true }).click();
    await page.waitForFunction(() => window.__chip.list?.paint && window.__chip.chip?.paint && window.__chip.final?.paint, null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    for (let i = 0; i < 300 && [...reqs.values()].some((x) => !x); i++) await page.waitForTimeout(100);
    await page.waitForTimeout(500);
    if (traceFile) await browser.stopTracing();
    const row = await page.evaluate((apiBefore) => {
      const m = window.__chip;
      const after = (e) => e.start >= m.click - 5 && e.start < Math.max(m.list.paint, m.final.paint);
      return {
        sameCommit: m.chip.batch === m.list.batch,
        chipPaintMs: m.chip.paint - m.click,
        listCommitMs: m.list.commit - m.click,
        listPaintMs: m.list.paint - m.click,
        finalPaintMs: m.final.paint - m.click,
        chipLeadMs: m.list.commit - m.chip.commit,
        inpMs: Math.max(0, ...m.events.filter((e) => e.start >= m.click - 5 && e.start < m.click + 1000).map((e) => e.duration)),
        longTaskMs: m.longTasks.filter(after).reduce((a, e) => a + e.duration, 0),
        maxLongTaskMs: Math.max(0, ...m.longTasks.filter(after).map((e) => e.duration)),
        tbtMs: m.longTasks.filter(after).reduce((t, e) => t + Math.max(0, e.duration - 50), 0),
        longTaskCount: m.longTasks.filter(after).length,
        apiAfterClick: performance.getEntriesByType("resource").filter((e) => e.name.includes("/ingredients?") && e.startTime >= apiBefore).length,
        targetDoneMs: Math.min(...performance.getEntriesByType("resource").filter((e) => e.name.includes("/ingredients?") && e.name.includes("filter=EXPIRED") && e.startTime >= m.click - 5).map((e) => e.responseEnd - m.click)),
        allApiDoneMs: Math.max(0, ...performance.getEntriesByType("resource").filter((e) => e.name.includes("/ingredients?") && e.startTime >= m.click - 5).map((e) => e.responseEnd - m.click)),
        proto: [...new Set(performance.getEntriesByType("resource").filter((e) => e.name.includes("/ingredients?")).map((e) => e.nextHopProtocol))].join("+"),
        rscAfterClick: performance.getEntriesByType("resource").filter((e) => e.name.includes("_rsc=") && e.startTime >= m.click - 5).length,
        rscDoneMs: Math.max(0, ...performance.getEntriesByType("resource").filter((e) => e.name.includes("_rsc=") && e.startTime >= m.click - 5).map((e) => e.responseEnd - m.click)),
        skeleton: m.skeleton,
        clickWall: performance.timeOrigin + m.click,
      };
    }, apiBefore);
    const profile = profileAll && traceFile ? profileBreakdown(traceFile) : {};
    if (profileAll && !dir && !process.argv.includes("--keep-trace")) fs.rmSync(traceFile, { force: true });
    return { ...row, ...profile, apiRequestsCdp: reqs.size, apiUrls: urls, allUrls, cards, loaded: liveState ? cards : served, videoOffsetS: (row.clickWall - videoStart) / 1000 };
  } finally {
    if (liveState) { liveState = await context.storageState().catch(() => liveState); if (option("state", "")) fs.writeFileSync(option("state", ""), JSON.stringify(liveState)); }
    const video = page.video();
    await context.close();
    if (dir && video) fs.renameSync(await video.path(), path.join(dir, "screen.webm"));
  }
}

function profileBreakdown(file) {
  const ev = JSON.parse(fs.readFileSync(file, "utf8")).traceEvents;
  const click = ev.find((e) => e.name === "EventDispatch" && ["pointerdown", "change"].includes(e.args?.data?.type)) ?? ev.find((e) => e.name === "EventDispatch" && e.args?.data?.type === "keydown");
  const nodes = new Map(), samples = [], deltas = [];
  let ts = 0;
  for (const e of ev) {
    if (e.name === "Profile") ts = e.args.data.startTime;
    if (e.name === "ProfileChunk") { for (const n of e.args.data.cpuProfile?.nodes ?? []) nodes.set(n.id, n); samples.push(...(e.args.data.cpuProfile?.samples ?? [])); deltas.push(...(e.args.data.timeDeltas ?? [])); }
  }
  const has = (id, names) => { for (let n = nodes.get(id); n; n = nodes.get(n.parent)) if (names.includes(n.callFrame.functionName)) return true; return false; };
  const DELETE = ["commitDeletionEffectsOnFiber", "recursivelyTraverseDeletionEffects", "commitDeletionEffects"];
  const PASSIVE = ["commitPassiveUnmountEffectsInsideOfDeletedTree_begin", "commitPassiveUnmountEffectsInsideOfDeletedTree_complete", "commitPassiveUnmountInsideDeletedTreeOnFiber"];
  const RENDER = ["performUnitOfWork", "workLoopSync", "workLoopConcurrent", "workLoopConcurrentByScheduler", "renderRootSync", "renderRootConcurrent", "beginWork", "completeWork"];
  const DOM = ["removeChild", "insertBefore", "appendChild", "replaceChild", "setAttribute", "removeAttribute", "set textContent", "set nodeValue", "set className"];
  const MEASURE = ["measureElement", "_measureElement"];
  const r = { unmountMutationMs: 0, unmountPassiveMs: 0, removeChildMs: 0, domMs: 0, domInDeleteMs: 0, measureMs: 0, renderMs: 0, gcMs: 0, profiledMs: 0, browserMs: 0 };
  for (let i = 0; i < samples.length; i++) {
    ts += deltas[i];
    if (!click || ts < click.ts || ts > click.ts + 1500e3) continue;
    const dt = (deltas[i + 1] ?? 0) / 1000, id = samples[i], leaf = nodes.get(id)?.callFrame.functionName;
    if (leaf === "(idle)" || leaf === "(program)") continue;
    r.profiledMs += dt;
    if (leaf === "(garbage collector)") r.gcMs += dt;
    else if (has(id, MEASURE)) r.measureMs += dt;
    else if (DOM.includes(leaf)) { r.domMs += dt; if (has(id, DELETE)) { r.unmountMutationMs += dt; r.domInDeleteMs += dt; if (leaf === "removeChild") r.removeChildMs += dt; } }
    else if (has(id, DELETE)) r.unmountMutationMs += dt;
    else if (has(id, PASSIVE)) r.unmountPassiveMs += dt;
    else if (has(id, RENDER)) r.renderMs += dt;
  }
  r.unmountMs = r.unmountMutationMs + r.unmountPassiveMs;
  r.unmountCleanupMs = r.unmountMs - r.domInDeleteMs;
  if (click) {
    const main = ev.filter((e) => e.pid === click.pid && e.tid === click.tid && e.ph === "X" && e.ts >= click.ts && e.ts <= click.ts + 1500e3);
    const js = main.filter((e) => ["FunctionCall", "EventDispatch", "TimerFire", "FireAnimationFrame", "RunMicrotasks", "v8.callFunction", "EvaluateScript"].includes(e.name));
    const inJs = (e) => js.some((j) => e.ts >= j.ts && e.ts < j.ts + j.dur);
    r.browserMs = main.filter((e) => ["UpdateLayoutTree", "Layout", "PrePaint", "Paint", "Layerize"].includes(e.name) && !inJs(e)).reduce((t, e) => t + e.dur / 1000, 0);
  }
  r.otherJsMs = r.profiledMs - r.renderMs - r.domMs - r.unmountCleanupMs - r.measureMs - r.gcMs;
  r.mainTotalMs = r.profiledMs + r.browserMs;
  r.profileFound = Boolean(click) && [...nodes.values()].some((n) => RENDER.includes(n.callFrame.functionName));
  return r;
}

const expectedFirstId = (status) => String(items.findIndex((x) => x.status === status) + 1);
async function rapidClicks(page, cdp, dir, browser) {
  await page.evaluate((s) => { window.__rapid.last = document.querySelector(s)?.getAttribute("href")?.match(/ingredients\/(\d+)/)?.[1]; }, cardSelector);
  const chip = (label) => page.getByRole("group", { name: "재고 필터" }).getByRole("button", { name: label, exact: true });
  const hit = (label) => chip(label).evaluate((el) => {
    const r = el.getBoundingClientRect();
    for (let f = 0.5; f > 0; f -= 0.05) { const x = r.left + r.width * f, y = r.top + r.height / 2; if (el.contains(document.elementFromPoint(x, y))) return { x, y }; }
    return null;
  });
  await chip(chipLabel).evaluate((el) => el.scrollIntoView({ inline: "end", block: "nearest" }));
  await page.waitForTimeout(500);
  const [b1, b2] = [await hit(firstLabel), await hit(chipLabel)];
  if (!b1 || !b2) throw new Error("chip not hittable");
  const send = (type, b) => cdp.send("Input.dispatchMouseEvent", { type, x: b.x, y: b.y, button: "left", clickCount: 1 }).catch(() => null);
  const t0 = Date.now();
  const pending = [send("mousePressed", b1), send("mouseReleased", b1)];
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, rapid - (Date.now() - t0))));
  pending.push(send("mouseMoved", b2), send("mousePressed", b2), send("mouseReleased", b2));
  await Promise.all(pending);
  const finalId = expectedFirstId("EXPIRED");
  await page.waitForFunction(({ finalId, label }) => window.__rapid.chips[label]?.paint && window.__rapid.lists.find((x) => x.sig === finalId)?.paint, { finalId, label: chipLabel }, { timeout: 30000 });
  await page.waitForTimeout(1500);
  if (dir) await browser.stopTracing();
  return page.evaluate(({ finalId, interId, firstLabel, chipLabel }) => {
    const r = window.__rapid, m = window.__chip;
    const c1 = r.clicks.find((x) => x.label === firstLabel).t, c2 = r.clicks.find((x) => x.label === chipLabel).t;
    const fin = r.lists.find((x) => x.sig === finalId), inter = r.lists.find((x) => x.sig === interId);
    const inWindow = (e) => e.start >= c1 - 5 && e.start < fin.paint;
    const inp = (from, to) => Math.max(0, ...m.events.filter((e) => e.start >= from - 5 && e.start < to).map((e) => e.duration));
    return {
      gapMs: c2 - c1,
      interCommitted: Boolean(inter),
      interPaintMs: inter ? inter.paint - c1 : null,
      listChanges: r.lists.length,
      skeleton: r.lists.some((x) => x.sig === "loading"),
      chip1PaintMs: r.chips[firstLabel] ? r.chips[firstLabel].paint - c1 : null,
      chip2PaintMs: r.chips[chipLabel].paint - c2,
      finalPaintMs: fin.paint - c2,
      finalFromFirstMs: fin.paint - c1,
      inp1Ms: inp(c1, c2 - 5),
      inp2Ms: inp(c2, c2 + 1000),
      longTaskMs: m.longTasks.filter(inWindow).reduce((a, e) => a + e.duration, 0),
      maxLongTaskMs: Math.max(0, ...m.longTasks.filter(inWindow).map((e) => e.duration)),
      clickWall: performance.timeOrigin + c1,
    };
  }, { finalId, interId: expectedFirstId("EXPIRING_SOON"), firstLabel, chipLabel });
}

const metrics = rapid ? ["gapMs", "interPaintMs", "listChanges", "chip1PaintMs", "chip2PaintMs", "finalPaintMs", "finalFromFirstMs", "inp1Ms", "inp2Ms", "longTaskMs", "maxLongTaskMs", "cards", "loaded"] : ["chipPaintMs", "listCommitMs", "listPaintMs", "finalPaintMs", "chipLeadMs", "inpMs", "longTaskMs", "maxLongTaskMs", "tbtMs", "longTaskCount", "apiAfterClick", "apiRequestsCdp", "targetDoneMs", "allApiDoneMs", "rscAfterClick", "rscDoneMs", "cards", "loaded", ...(profileAll ? ["unmountMs", "unmountMutationMs", "unmountPassiveMs", "removeChildMs", "renderMs", "gcMs", "profiledMs", "domMs", "unmountCleanupMs", "measureMs", "browserMs", "otherJsMs", "mainTotalMs"] : [])];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const rows = [];
const recorded = {};
const log = (variant, run, row) => console.log(variant, run, row.error ?? `same=${row.sameCommit} inter=${row.interCommitted} ${metrics.map((k) => `${k}=${Number(row[k]).toFixed(0)}`).join(" ")}`);
try {
  if (Object.keys(live).length) {
    if (option("state", "")) liveState = JSON.parse(fs.readFileSync(option("state", ""), "utf8"));
    else { await startServer(variants[0]); liveState = await login(browser); await stopServer(); }
    let fails = 0;
    for (let b = 0, run = 0; run < runs; b++, run += block) {
      for (const variant of b % 2 ? [...variants].reverse() : variants) {
        await startServer(variant);
        await sample(browser, variant).catch(() => null);
        for (let i = 1; i <= Math.min(block, runs - run); i++) {
          const row = await sample(browser, variant).catch((error) => ({ error: error.message }));
          rows.push({ variant, run: run + i, ...row });
          log(variant, run + i, row);
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
  } else {
  for (const variant of variants) await sample(browser, variant).catch(() => null);
  for (let run = 1; run <= runs; run++) {
    for (const variant of run % 2 ? variants : [...variants].reverse()) {
      const row = await sample(browser, variant).catch((error) => ({ error: error.message }));
      rows.push({ variant, run, ...row });
      console.log(variant, run, row.error ?? `same=${row.sameCommit} inter=${row.interCommitted} ${metrics.map((k) => `${k}=${Number(row[k]).toFixed(0)}`).join(" ")}`);
    }
  }
  if (record) for (const variant of variants) {
    const dir = path.join(out, `record-${variant}`);
    fs.mkdirSync(dir, { recursive: true });
    recorded[variant] = await sample(browser, variant, dir).catch((error) => console.log("record 실패", variant, error.message));
  }
  }
} finally {
  await stopServer();
  await browser.close();
  backend.close();
  for (const p of proxies) p.close();
}

for (const [variant, row] of Object.entries(recorded)) {
  const dir = path.join(out, `record-${variant}`);
  const webm = path.join(dir, "screen.webm");
  if (!row || !fs.existsSync(webm)) continue;
  const start = String(Math.max(0, row.videoOffsetS - 1.5));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", start, "-i", webm, "-t", "4", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(dir, "screen.mp4")]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", start, "-i", webm, "-t", "4", "-vf", "fps=12,scale=390:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", path.join(dir, "screen.gif")]);
  fs.writeFileSync(path.join(dir, "row.json"), JSON.stringify(row, null, 2));
}

const summary = {};
for (const v of variants) {
  const ok = rows.filter((r) => r.variant === v && !r.error);
  summary[`${v}.sameCommit`] = `${ok.filter((r) => r.sameCommit).length}/${ok.length}`;
  summary[`${v}.interCommitted`] = `${ok.filter((r) => r.interCommitted).length}/${ok.length}`;
  summary[`${v}.skeleton`] = `${ok.filter((r) => r.skeleton).length}/${ok.length}`;
}
for (const k of metrics) {
  const pick = (v) => rows.filter((r) => r.variant === v && Number.isFinite(r[k])).map((r) => r[k]);
  const s = (v) => (v.length ? { n: v.length, p50: q(v, 0.5), p90: q(v, 0.9), p95: q(v, 0.95), p99: q(v, 0.99), min: Math.min(...v), max: Math.max(...v) } : null);
  summary[k] = Object.fromEntries(variants.map((v) => [v, s(pick(v))]));
  for (const v of variants.slice(1)) summary[k][`p_a_${v}`] = pick("a").length && pick(v).length ? mannWhitney(pick("a"), pick(v)) : null;
}
fs.writeFileSync(path.join(out, "raw.json"), JSON.stringify(rows, null, 2));
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(summary, null, 2));
const f = (v) => (v ? `${v.p50.toFixed(0)} p90 ${v.p90.toFixed(0)} p95 ${v.p95.toFixed(0)} p99 ${v.p99.toFixed(0)} [${v.min.toFixed(0)}-${v.max.toFixed(0)}]` : "-");
for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(16)} ${typeof v === "string" ? v : variants.map((x) => `${x} ${f(v[x])}`).join("  ") + variants.slice(1).map((x) => `  p(a,${x})=${v[`p_a_${x}`]?.toFixed(4) ?? "-"}`).join("")}`);
