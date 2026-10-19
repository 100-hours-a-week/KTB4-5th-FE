// Real backend only: BACKEND_ORIGIN=http://localhost:8080 NEXT_PUBLIC_LIST_PERF=true pnpm build && pnpm start -p 3010
// PERF_LOGIN_ID=... PERF_LOGIN_PW=... node scripts/perf/list-scroll-live.mjs --base=http://localhost:3010 --login-base=http://localhost:3000 --runs=5 --label=prod-v2-5runs
// Or set PERF_STORAGE_STATE to an authenticated Playwright storageState JSON file for the target origin.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "playwright-core";

const base =
  process.argv.find((arg) => arg.startsWith("--base="))?.slice(7) ??
  "http://localhost:3010";
const runs = Number(
  process.argv.find((arg) => arg.startsWith("--runs="))?.slice(7) ?? 5,
);
const label = process.argv.find((arg) => arg.startsWith("--label="))?.slice(8);
const height = Number(
  process.argv.find((arg) => arg.startsWith("--height="))?.slice(9) ?? 500,
);
const loginBase =
  process.argv.find((arg) => arg.startsWith("--login-base="))?.slice(13) ??
  base;
if (!Number.isInteger(runs) || runs < 1)
  throw new Error("--runs는 양의 정수여야 합니다.");
if (!Number.isInteger(height) || height < 320)
  throw new Error("--height는 320 이상의 정수여야 합니다.");
if (label && !/^[a-zA-Z0-9-]+$/.test(label))
  throw new Error("--label은 영문·숫자·하이픈만 사용할 수 있습니다.");
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("로컬 서버에서만 실행할 수 있습니다.");
if (!["localhost", "127.0.0.1"].includes(new URL(loginBase).hostname))
  throw new Error("--login-base는 로컬 주소여야 합니다.");
if (
  !process.env.PERF_STORAGE_STATE &&
  (!process.env.PERF_LOGIN_ID || !process.env.PERF_LOGIN_PW)
) {
  throw new Error(
    "PERF_STORAGE_STATE 또는 PERF_LOGIN_ID/PERF_LOGIN_PW가 필요합니다.",
  );
}
const out = path.resolve("scripts/perf/out/list-scroll/live", label ?? "");
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fingerprint = (cursor) =>
  cursor === null
    ? null
    : createHash("sha256").update(cursor).digest("hex").slice(0, 12);
const browser = await chromium.launch();

async function storageState() {
  if (process.env.PERF_STORAGE_STATE) return process.env.PERF_STORAGE_STATE;
  const context = await browser.newContext({ serviceWorkers: "block" });
  try {
    const page = await context.newPage();
    const authResponses = [];
    let loginRequestHeaders = null;
    page.on("request", async (request) => {
      if (!new URL(request.url()).pathname.endsWith("/auth/sessions")) return;
      const headers = await request.allHeaders();
      loginRequestHeaders = {
        csrf: Boolean(headers["x-xsrf-token"]),
        cookie: Boolean(headers.cookie),
        csrfMatchesCookie:
          headers.cookie
            ?.split("; ")
            .find((part) => part.startsWith("XSRF-TOKEN="))
            ?.slice("XSRF-TOKEN=".length) === headers["x-xsrf-token"],
      };
    });
    page.on("response", async (response) => {
      const pathname = new URL(response.url()).pathname;
      if (!/\/api\/v1\/(auth\/(sessions|csrf)|users)$/.test(pathname)) return;
      let code = "";
      if (response.status() >= 400) {
        try {
          const problem = await response.json();
          code = problem.code ?? problem.title ?? "";
        } catch {}
      }
      authResponses.push(
        `${pathname}:${response.status()}:${response.headers()["content-type"] ?? ""}:${code}`,
      );
    });
    await page.goto(`${loginBase}/login`);
    await page
      .getByPlaceholder("아이디를 입력해주세요")
      .fill(process.env.PERF_LOGIN_ID);
    await page
      .getByPlaceholder("비밀번호를 입력해주세요")
      .fill(process.env.PERF_LOGIN_PW);
    await page.locator('button[type="submit"]').click();
    try {
      await page.waitForURL(`${loginBase}/`, { timeout: 20000 });
    } catch {
      const alerts = await page.getByRole("alert").allTextContents();
      const cookies = await context.cookies(loginBase);
      throw new Error(
        `로그인 후 이동 실패: URL=${page.url()}, API 상태=${authResponses.join(",") || "없음"}, 요청 헤더=${JSON.stringify(loginRequestHeaders)}, CSRF 쿠키=${cookies.some((cookie) => cookie.name === "XSRF-TOKEN")}, 화면 오류=${alerts.join(" | ") || "없음"}`,
      );
    }
    const state = await context.storageState();
    return {
      ...state,
      origins: state.origins.map((origin) => ({ ...origin, origin: base })),
    };
  } finally {
    await context.close();
  }
}

async function measure(state, type, run) {
  const context = await browser.newContext({
    storageState: state,
    viewport: { width: 390, height },
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const requests = [];
  const navigations = [];
  const pending = new Map();
  let phase = "initial";
  let lastRequestChangeAt = Date.now();
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame())
      navigations.push({
        phase,
        at: Date.now(),
        path: new URL(frame.url()).pathname,
      });
  });
  const listPattern =
    type === "ingredient"
      ? /\/api\/v1\/refrigerators\/[^/]+\/ingredients$/
      : /\/api\/v1\/refrigerators\/[^/]+\/notifications$/;
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!listPattern.test(url.pathname)) return;
    const entry = {
      phase,
      cursor: fingerprint(url.searchParams.get("cursor")),
      startedAt: Date.now(),
      endedAt: null,
      status: null,
      completed: false,
      transportFinished: false,
      failureReason: null,
      contentType: null,
      parseError: null,
      itemCount: null,
      nextCursor: null,
    };
    requests.push(entry);
    pending.set(request, entry);
    lastRequestChangeAt = Date.now();
  });
  page.on("response", async (response) => {
    const entry = pending.get(response.request());
    if (!entry) return;
    entry.status = response.status();
    entry.contentType = response.headers()["content-type"] ?? null;
    try {
      const data = (await response.json()).data;
      entry.itemCount =
        (type === "ingredient" ? data?.ingredients : data?.notifications)
          ?.length ?? null;
      entry.nextCursor = fingerprint(data?.nextCursor ?? null);
      entry.completed = true;
    } catch (error) {
      entry.parseError = String(error).slice(0, 160);
    }
    entry.endedAt = Date.now();
    lastRequestChangeAt = Date.now();
  });
  page.on("requestfailed", (request) => {
    const entry = pending.get(request);
    if (entry) {
      entry.status = "network-error";
      entry.completed = false;
      entry.failureReason = request.failure()?.errorText ?? null;
      entry.endedAt = Date.now();
      lastRequestChangeAt = Date.now();
    }
  });
  page.on("requestfinished", (request) => {
    const entry = pending.get(request);
    if (entry) {
      entry.transportFinished = true;
      entry.completed = entry.status === 200;
      lastRequestChangeAt = Date.now();
    }
  });
  const result = {
    type,
    run,
    requests,
    navigations,
    loadedAfterRestore: null,
    offlineSkipped: null,
    onlineAfterRestore: null,
    urlAfterRestore: null,
    urlAtEnd: null,
  };
  const capture = async () => {
    if (run !== 1) return;
    try {
      await page.screenshot({ path: path.join(out, `${type}-run${run}.png`) });
    } catch (error) {
      result.screenshotError = String(error).slice(0, 160);
    }
  };
  try {
    await page.goto(
      base + (type === "ingredient" ? "/refrigerator" : "/notifications"),
      { waitUntil: "domcontentloaded" },
    );
    await page.waitForFunction(
      () =>
        document.querySelector(
          'section[aria-label="재고 목록"], section[aria-label="알림 목록"]',
        ),
      null,
      { timeout: 20000 },
    );
    for (
      let i = 0;
      i < 25 &&
      !requests.some(
        (request) => request.status === 200 && request.itemCount !== null,
      );
      i++
    )
      await sleep(100);
    const first = requests.find(
      (request) =>
        request.cursor === null &&
        request.status === 200 &&
        request.itemCount !== null,
    );
    if (!first)
      throw new Error(
        `${type} 첫 페이지 실백엔드 응답이 없습니다. 인증과 BACKEND_ORIGIN을 확인하세요.`,
      );
    if (!first.nextCursor) {
      result.offlineSkipped =
        "첫 페이지에 다음 커서가 없어 Offline 추가 조회를 실행할 수 없음";
      await capture();
      return result;
    }
    if (run === 1) {
      await page
        .screenshot({ path: path.join(out, `${type}-initial.png`) })
        .catch((error) => {
          result.initialScreenshotError = String(error).slice(0, 160);
        });
    }
    phase = "offline";
    await context.setOffline(true);
    await page
      .locator(
        `section[aria-label="${type === "ingredient" ? "재고" : "알림"} 목록"]`,
      )
      .evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
    await sleep(500);
    phase = "restored";
    await context.setOffline(false);
    result.urlAfterRestore = page.url();
    result.onlineAfterRestore = await page
      .evaluate(() => navigator.onLine)
      .catch(() => null);
    for (
      let i = 0;
      i < 100 &&
      (Date.now() - lastRequestChangeAt < 1000 ||
        requests.some((request) => request.endedAt === null));
      i++
    )
      await sleep(100);
    result.loadedAfterRestore = await page
      .locator(
        `section[aria-label="${type === "ingredient" ? "재고" : "알림"} 목록"] li:has(a)`,
      )
      .count();
    result.urlAtEnd = page.url();
    await capture();
    return result;
  } catch (error) {
    result.error = String(error).slice(0, 180);
    result.urlAtEnd = page.url();
    return result;
  } finally {
    await context.close().catch(() => {});
  }
}

try {
  const state = await storageState();
  const results = [];
  for (const type of ["ingredient", "notification"]) {
    for (let run = 1; run <= runs; run++) {
      const result = await measure(state, type, run);
      results.push(result);
      fs.writeFileSync(
        path.join(out, "results.json"),
        JSON.stringify(results, null, 2),
      );
      console.log(
        JSON.stringify({
          type,
          run,
          firstRequests: result.requests.filter(
            (request) => request.phase === "initial" && request.cursor === null,
          ).length,
          restoredCursors: result.requests
            .filter((request) => request.phase === "restored")
            .map((request) => request.cursor),
          loadedAfterRestore: result.loadedAfterRestore,
          offlineSkipped: result.offlineSkipped,
        }),
      );
    }
  }
} finally {
  await browser.close();
}
