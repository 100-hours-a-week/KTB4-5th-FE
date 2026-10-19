// 재고 목록 캐시(#180) 성능 측정. 명령 하나로 빌드 → 서버 실행 → 측정 → 정리까지 한다.
//
//   PERF_LOGIN_ID=... PERF_LOGIN_PW=... pnpm perf <라벨> [회차=5]   고정 시나리오 측정
//   PERF_LOGIN_ID=... PERF_LOGIN_PW=... pnpm perf freshness          최신성 회귀 확인(재고 이름을 바꿨다가 되돌린다)
//   --no-build                                                       이미 빌드했으면 빌드를 건너뛴다
//   --network=slow4g                                                 Slow 4G로 측정한다(기본 fast4g)
//
// 측정 조건
// - 배포 빌드(next start, 3002) 앞에 로컬 프록시(3001)를 두고, 배포처럼 /api/v1 은 백엔드로 넘긴다.
// - 네트워크 감속은 프록시에서 건다. 서비스 워커를 거치는 요청은 브라우저 감속이 걸리지 않기 때문이다.
//   값은 Chrome DevTools 프리셋과 같다. Fast 4G: 지연 165ms, 하향 9Mbps / Slow 4G: 지연 562.5ms, 하향 1.44Mbps
// - 매 회차 새 브라우저 컨텍스트(시크릿과 같음, 확장 프로그램 없음), CPU 4배 감속.
// 결과: scripts/perf/out/<라벨>/results.json, 스크린샷
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import { Transform } from "node:stream";
import { chromium } from "playwright-core";

const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const [label = "before", runs = "5"] = args;
const skipBuild = process.argv.includes("--no-build");
const NETWORKS = {
  fast4g: { latencyMs: 165, downloadKbps: 9000 },
  slow4g: { latencyMs: 562.5, downloadKbps: 1474.56 },
};
const networkName =
  process.argv.find((arg) => arg.startsWith("--network="))?.split("=")[1] ??
  "fast4g";
const network = NETWORKS[networkName];
if (!network)
  throw new Error(`알 수 없는 네트워크: ${networkName} (fast4g, slow4g)`);

const BASE = "http://localhost:3001";
const BACKEND = new URL(process.env.BACKEND_ORIGIN ?? "http://localhost:8080");
const LATENCY_MS = network.latencyMs;
const BYTES_PER_MS = (network.downloadKbps * 1024) / 8 / 1000;
const LOADING = "재고를 불러오는 중입니다";
const OUT = new URL(`./out/${label}/`, import.meta.url).pathname;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const median = (values) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

// ─── 1. 서버: 배포 빌드 + 네트워크 감속 프록시 ─────────────────────────────────────

function startProxy() {
  const throttle = () =>
    new Transform({
      async transform(chunk, _encoding, callback) {
        await sleep(chunk.length / BYTES_PER_MS);
        callback(null, chunk);
      },
    });

  return http
    .createServer((req, res) => {
      const isApi = req.url.startsWith("/api/v1");
      const upstream = http.request(
        {
          host: isApi ? BACKEND.hostname : "127.0.0.1",
          port: isApi ? BACKEND.port : 3002,
          path: req.url,
          method: req.method,
          headers: req.headers,
        },
        async (upstreamRes) => {
          await sleep(LATENCY_MS);
          res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
          res.flushHeaders();
          upstreamRes.pipe(throttle()).pipe(res);
        },
      );
      upstream.on("error", () => {
        res.writeHead(502);
        res.end();
      });
      req.pipe(upstream);
    })
    .listen(3001);
}

async function startServers() {
  if (!skipBuild) {
    const build = spawnSync("pnpm", ["build"], { stdio: "inherit" });
    if (build.status !== 0) process.exit(build.status ?? 1);
  }
  const next = spawn("pnpm", ["exec", "next", "start", "-p", "3002"], {
    stdio: "ignore",
    detached: true,
  });
  const proxy = startProxy();
  const stop = () => {
    proxy.close();
    try {
      process.kill(-next.pid);
    } catch {}
  };

  for (let i = 0; i < 30; i++) {
    const ok = await fetch(`${BASE}/login`)
      .then((r) => r.ok)
      .catch(() => false);
    if (ok) return stop;
    await sleep(1000);
  }
  stop();
  throw new Error("서버가 30초 안에 뜨지 않았습니다");
}

// ─── 2. 공통: 로그인 ─────────────────────────────────────────────────────────

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page
    .getByPlaceholder("아이디를 입력해주세요")
    .fill(process.env.PERF_LOGIN_ID);
  await page
    .getByPlaceholder("비밀번호를 입력해주세요")
    .fill(process.env.PERF_LOGIN_PW);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 20000 });
}

// ─── 3. 고정 시나리오 측정 ───────────────────────────────────────────────────
// 홈 새로고침 → 냉장고 탭 → 홈 → 재고 등록 → 직접 쓰기 → 뒤로 → 다른 앱 갔다가 복귀

// 페이지 안에서 탭·로딩 문구 표시/해제·첫 카드 표시 시점을 기록한다.
const monitor = (loadingText) => {
  window.__m = [];
  const push = (event) =>
    window.__m.push({
      t: performance.now(),
      path: location.pathname,
      ...event,
    });
  let loading = false;
  let cards = false;
  let lastPath = "";
  const check = () => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      cards = false;
    }
    const main = document.querySelector("main");
    const isLoading = !!main && main.textContent.includes(loadingText);
    if (isLoading !== loading) {
      loading = isLoading;
      push({ type: isLoading ? "loading-on" : "loading-off" });
    }
    const hasCards = !!document.querySelector(
      'a[href^="/refrigerator/ingredients/"]',
    );
    if (hasCards && !cards) {
      cards = true;
      push({ type: "cards" });
    }
  };
  new MutationObserver(check).observe(document, {
    subtree: true,
    childList: true,
    characterData: true,
  });
  addEventListener("pointerdown", () => push({ type: "tap" }), true);
};

const isTracked = (request) => {
  const url = new URL(request.url());
  return (
    url.pathname.startsWith("/api/v1/") ||
    !!request.headers()["rsc"] ||
    url.searchParams.has("_rsc")
  );
};

async function measureOnce(browser, n) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.addInitScript(monitor, LOADING);
  const cdp = await context.newCDPSession(page);

  let step = "login";
  let inflight = 0;
  let lastChange = Date.now();
  const reqs = [];
  page.on("request", (request) => {
    if (!isTracked(request)) return;
    const url = new URL(request.url());
    inflight++;
    lastChange = Date.now();
    reqs.push({
      step,
      kind: url.pathname.startsWith("/api/v1/") ? "api" : "rsc",
      method: request.method(),
      path: url.pathname,
      cursor: url.searchParams.has("cursor"),
    });
  });
  const settle = (request) => {
    if (!isTracked(request)) return;
    inflight = Math.max(0, inflight - 1);
    lastChange = Date.now();
  };
  page.on("requestfinished", settle);
  page.on("requestfailed", settle);

  // 이 단계의 API 요청이 하나라도 나갈 때까지(최대 5초) 기다린 뒤, 요청이 1.5초간 없으면 끝난 것으로 본다.
  const quiet = async (idleMs = 1500) => {
    const start = Date.now();
    while (
      !reqs.some((r) => r.step === step && r.kind === "api") &&
      Date.now() - start < 5000
    ) {
      await page.waitForTimeout(100);
    }
    while (!(inflight === 0 && Date.now() - lastChange > idleMs)) {
      if (Date.now() - start > 30000)
        throw new Error(`quiet timeout at ${step}`);
      await page.waitForTimeout(100);
    }
  };

  // 로그인은 측정에서 뺀다.
  await login(page);
  await quiet();

  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  step = "1 홈 새로고침";
  await page.reload();
  await quiet();

  step = "2 냉장고 탭";
  await page.evaluate(() => (window.__m.length = 0));
  const loadingShot =
    n === 1
      ? page
          .waitForFunction(
            (text) =>
              location.pathname === "/refrigerator" &&
              document.querySelector("main")?.textContent.includes(text),
            LOADING,
            { timeout: 8000 },
          )
          .then(() =>
            page.screenshot({ path: `${OUT}run1-fridge-loading.png` }),
          )
          .catch(() => null)
      : null;
  await page.locator('nav a[href="/refrigerator"]').click();
  await page
    .locator('a[href^="/refrigerator/ingredients/"]')
    .first()
    .waitFor({ timeout: 30000 });
  await loadingShot;
  if (n === 1) await page.screenshot({ path: `${OUT}run1-fridge-cards.png` });
  await quiet();
  const marks = await page.evaluate(() => window.__m);
  // 냉장고 탭에 들어간 뒤 나간 첫 페이지 목록 요청. 카드가 이 응답보다 먼저 보였으면 캐시에서 그린 것이다.
  const tapAt = marks.find((m) => m.type === "tap")?.t ?? 0;
  const fridgeList = await page.evaluate(
    (after) =>
      performance
        .getEntriesByType("resource")
        .filter(
          (e) =>
            e.name.includes("/ingredients?") &&
            !e.name.includes("cursor=") &&
            e.startTime >= after,
        )
        .map((e) => ({
          startT: e.startTime,
          responseEndT: e.responseEnd,
          ttfb: Math.round(e.responseStart - e.requestStart),
        }))[0] ?? null,
    tapAt,
  );

  step = "3 홈";
  await page.locator('nav a[href="/"]').click();
  await quiet();

  step = "4 재고 등록";
  await page.locator('nav a[href="/refrigerator/register"]').click();
  await page.waitForURL(`${BASE}/refrigerator/register`);
  await quiet();

  step = "5 직접 쓰기";
  await page.locator('a[href="/refrigerator/register/manual"]').click();
  await page.waitForURL(`${BASE}/refrigerator/register/manual`);
  await quiet();

  step = "6 뒤로";
  await page.goBack();
  await quiet();

  // 실제 탭 전환 대신 visibilitychange를 직접 발생시켜 앱 복귀를 흉내 낸다.
  step = "7 다른 앱 → 복귀";
  const setVisibility = (state) =>
    page.evaluate((value) => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => value,
      });
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => value === "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
    }, state);
  await setVisibility("hidden");
  await page.waitForTimeout(5000);
  await setVisibility("visible");
  await quiet();

  await context.close();

  const tap = marks.find((m) => m.type === "tap");
  const cards = marks.find(
    (m) => m.type === "cards" && m.path === "/refrigerator",
  );
  const on = marks.find(
    (m) => m.type === "loading-on" && m.path === "/refrigerator",
  );
  const off = on && marks.find((m) => m.type === "loading-off" && m.t > on.t);
  return {
    run: n,
    tapToCardsMs: tap && cards ? Math.round(cards.t - tap.t) : null,
    loadingVisibleMs: on ? Math.round((off ?? cards).t - on.t) : 0,
    // 카드 표시가 목록 응답 도착보다 빠르면 캐시 히트. 양수 = 응답보다 몇 ms 먼저 그렸는지
    cacheHit: !!(cards && fridgeList && cards.t < fridgeList.responseEndT),
    cardsBeforeResponseMs:
      cards && fridgeList
        ? Math.round(fridgeList.responseEndT - cards.t)
        : null,
    fridgeListTtfbMs: fridgeList?.ttfb ?? null,
    reqs: reqs.filter((r) => r.step !== "login"),
  };
}

async function measure(browser) {
  const results = [];
  for (let i = 1; i <= Number(runs); i++) {
    const result = await measureOnce(browser, i);
    results.push(result);
    const apiCount = result.reqs.filter((r) => r.kind === "api").length;
    console.log(
      `run ${i}: 탭→목록 ${result.tapToCardsMs}ms, 로딩 화면 ${result.loadingVisibleMs}ms, ` +
        `캐시 ${result.cacheHit ? `히트(응답보다 ${result.cardsBeforeResponseMs}ms 먼저)` : `미스(응답 후 ${-result.cardsBeforeResponseMs}ms)`}, 목록 TTFB ${result.fridgeListTtfbMs}ms, API ${apiCount}회`,
    );
  }
  fs.writeFileSync(`${OUT}results.json`, JSON.stringify(results, null, 2));
  const summary = (key) => {
    const values = results.map((r) => r[key]);
    return `중앙값 ${median(values)}ms (최소 ${Math.min(...values)} ~ 최대 ${Math.max(...values)})`;
  };
  console.log(`탭→목록: ${summary("tapToCardsMs")}`);
  console.log(`로딩 화면: ${summary("loadingVisibleMs")}`);
  console.log(
    `캐시 히트: ${results.filter((r) => r.cacheHit).length}/${results.length}회`,
  );
}

// ─── 4. 최신성 회귀 확인 ─────────────────────────────────────────────────────
// 홈(첫 페이지 캐시) → 만료 필터 → 상세 → 이름 수정 → 뒤로 → 냉장고 탭(전체).
// 이때 전체 목록 캐시는 없고, 첫 페이지 캐시는 무효화된 이전 데이터다. 냉장고 탭에 이전 이름이 한 번이라도 보이면 회귀다.

async function freshness(browser) {
  const SUFFIX = " T";
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  // 냉장고 탭(전체)이 그린 카드 이름 목록을 바뀔 때마다 기록한다.
  await page.addInitScript(() => {
    window.__renders = [];
    new MutationObserver(() => {
      if (location.pathname !== "/refrigerator" || location.search) return;
      const names = [
        ...document.querySelectorAll('a[href^="/refrigerator/ingredients/"]'),
      ].map((a) => a.textContent);
      if (names.length && window.__renders.at(-1)?.join() !== names.join())
        window.__renders.push(names);
    }).observe(document, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  });

  const saveName = async (name) => {
    const input = page.getByLabel("재료 이름");
    await input.waitFor();
    await page.waitForTimeout(1000);
    await input.fill(name);
    await page.locator('button[type="submit"]:has-text("저장")').click();
    await page.waitForURL(/\/refrigerator\/ingredients\/[^/]+$/);
    await page.waitForTimeout(1500);
  };

  await login(page);
  await page.locator('a[href^="/refrigerator?filter="]').first().waitFor();
  await page.waitForTimeout(1500);

  let detailPath;
  let original;
  try {
    await page.locator('a[href^="/refrigerator?filter="]').first().click();
    const card = page.locator('a[href^="/refrigerator/ingredients/"]').first();
    await card.waitFor();
    await card.click();
    await page.waitForURL(/\/refrigerator\/ingredients\/[^/]+$/);
    detailPath = new URL(page.url()).pathname;
    await page.locator('a[href$="/edit"]').click();
    await page.getByLabel("재료 이름").waitFor();
    await page.waitForTimeout(1000);
    original = await page.getByLabel("재료 이름").inputValue();
    await saveName(original + SUFFIX);

    while (!/\/refrigerator\?filter=/.test(page.url())) {
      await page.goBack();
      await page.waitForTimeout(800);
    }
    await page.evaluate(() => (window.__renders = []));
    await page.locator('nav a[href="/refrigerator"]').click();
    await page
      .locator('a[href^="/refrigerator/ingredients/"]')
      .first()
      .waitFor();
    await page.waitForTimeout(2500);
    const renders = await page.evaluate(() => window.__renders);
    await page.screenshot({ path: `${OUT}freshness-after-edit.png` });

    const target = renders.map(
      (names) => names.find((name) => name.startsWith(original)) ?? null,
    );
    const staleShown = target.some(
      (name) => name !== null && !name.startsWith(original + SUFFIX),
    );
    console.log(
      staleShown
        ? "회귀: 이전 이름이 보였습니다"
        : "통과: 수정한 이름만 보였습니다",
    );
    console.log(
      JSON.stringify({
        original,
        renderCount: renders.length,
        everyRender: target,
      }),
    );
  } finally {
    if (detailPath && original) {
      await page.goto(`${BASE}${detailPath}/edit`);
      await page.getByLabel("재료 이름").waitFor();
      await page.waitForTimeout(1000);
      if ((await page.getByLabel("재료 이름").inputValue()) !== original)
        await saveName(original);
      console.log("원래 이름으로 되돌림:", original);
    }
    await context.close();
  }
}

// ─── 실행 ────────────────────────────────────────────────────────────────────

if (!process.env.PERF_LOGIN_ID || !process.env.PERF_LOGIN_PW) {
  console.error("PERF_LOGIN_ID, PERF_LOGIN_PW 환경 변수가 필요합니다");
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

console.log(
  `네트워크: ${networkName} (지연 ${network.latencyMs}ms, 하향 ${network.downloadKbps}kbps)`,
);
const stopServers = await startServers();
const browser = await chromium.launch({ channel: "chrome" });
try {
  await (label === "freshness" ? freshness(browser) : measure(browser));
} finally {
  await browser.close();
  stopServers();
}
