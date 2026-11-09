import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

const option = (name, fallback) => process.argv.find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const variants = option("variants", "a,b,c,d,e").split(",");
const bases = Object.fromEntries(variants.map((v) => [v, `http://localhost:${3013 + "abcdef".indexOf(v)}`]));
const runs = Number(option("n", "10"));
const backendPort = Number(option("backend-port", "3020"));
const out = path.resolve(option("out", "scripts/perf/out/url-state-sync"));
fs.mkdirSync(out, { recursive: true });

const statuses = ["NORMAL", "NORMAL", "EXPIRING_SOON", "EXPIRED"];
const items = Array.from({ length: 200 }, (_, i) => ({ ingredientId: String(i + 1), name: `재료 ${i + 1}`, category: "VEGETABLE", quantity: 1, weightValue: null, weightUnit: "NONE", storageType: "REFRIGERATED", status: statuses[i % 4], daysUntilExpiration: 3 }));
const firstId = { ALL: "1", EXPIRING_SOON: "3", EXPIRED: "4" };
const envelope = (data) => JSON.stringify({ code: "PERF-200-001", message: "OK", data });
const backend = http.createServer((req, res) => {
  const url = new URL(req.url, "http://backend");
  let data = {};
  if (/\/refrigerators\/[^/]+\/ingredients$/.test(url.pathname)) {
    const filter = url.searchParams.get("filter");
    const matched = items.filter((x) => !filter || x.status === filter);
    const cursor = Number(url.searchParams.get("cursor") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 10);
    data = { baseDate: new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10), outdated: false, ingredientsNum: items.length, filteredCount: matched.length, refrigeratorCapacity: 1500, refrigeratorName: "성능 측정", ingredients: matched.slice(cursor, cursor + size), nextCursor: cursor + size < matched.length ? String(cursor + size) : null };
  } else if (url.pathname.endsWith("/refrigerators/current")) data = [{ refrigeratorId: 1, name: "성능 측정", capacity: 1500, expiredCount: 0 }];
  else if (url.pathname.endsWith("/notifications/unread-count")) data = { refrigeratorId: "1", unreadCount: 0 };
  setTimeout(() => { res.writeHead(200, { "content-type": "application/json" }); res.end(envelope(data)); }, 20);
});
await new Promise((resolve) => backend.listen(backendPort, resolve));

const chipSelector = '[role="group"][aria-label="재고 필터"] > button';
const cardSelector = 'section[aria-label="재고 목록"] a[href^="/refrigerator/ingredients/"]';
const label = { ALL: "전체", EXPIRING_SOON: "임박", EXPIRED: "만료" };

async function state(page) {
  return page.evaluate(({ chipSelector, cardSelector }) => ({
    url: location.search,
    chip: [...document.querySelectorAll(chipSelector)].find((x) => x.getAttribute("aria-pressed") === "true")?.textContent.trim() ?? null,
    first: document.querySelector(cardSelector)?.getAttribute("href")?.match(/ingredients\/(\d+)/)?.[1] ?? null,
  }), { chipSelector, cardSelector });
}
async function expectState(page, filter, ms = 8000) {
  const start = Date.now();
  let s;
  while (Date.now() - start < ms) {
    s = await state(page);
    if (s.chip === label[filter] && s.first === firstId[filter]) return { ok: true, ms: Date.now() - start };
    await page.waitForTimeout(50);
  }
  return { ok: false, got: s };
}
const clickChip = (page, filter) => page.getByRole("group", { name: "재고 필터" }).getByRole("button", { name: label[filter], exact: true }).click();

const scenarios = {
  directLoad: async (page, base) => {
    await page.goto(`${base}/refrigerator?filter=EXPIRED`, { waitUntil: "load" });
    return expectState(page, "EXPIRED");
  },
  externalNav: async (page, base) => {
    await page.goto(`${base}/refrigerator`, { waitUntil: "load" });
    await page.locator(cardSelector).first().waitFor();
    await clickChip(page, "EXPIRING_SOON");
    const first = await expectState(page, "EXPIRING_SOON");
    if (!first.ok) return { ...first, step: "chip" };
    await page.evaluate(() => window.next.router.push("/refrigerator?filter=EXPIRED"));
    const pushed = await expectState(page, "EXPIRED");
    if (!pushed.ok) return { ...pushed, step: "push" };
    await page.goBack();
    const back = await expectState(page, "EXPIRING_SOON");
    return back.ok ? back : { ...back, step: "back" };
  },
  detailBack: async (page, base) => {
    await page.goto(`${base}/refrigerator`, { waitUntil: "load" });
    await page.locator(cardSelector).first().waitFor();
    await clickChip(page, "EXPIRED");
    const first = await expectState(page, "EXPIRED");
    if (!first.ok) return { ...first, step: "chip" };
    await page.locator(cardSelector).first().click();
    await page.waitForURL(/\/refrigerator\/ingredients\//);
    await page.goBack();
    const back = await expectState(page, "EXPIRED");
    return back.ok ? back : { ...back, step: "back" };
  },
};

const browser = await chromium.launch({ channel: "chrome", headless: true });
const rows = [];
try {
  for (let run = 1; run <= runs; run++) {
    for (const variant of run % 2 ? variants : [...variants].reverse()) {
      for (const [name, scenario] of Object.entries(scenarios)) {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
        await context.addCookies([{ name: "accessToken", value: "local-perf-fixture", url: bases[variant] }, { name: "currentRefrigeratorId", value: "1", url: bases[variant] }]);
        const page = await context.newPage();
        const errors = [];
        page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
        page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
        const cdp = await context.newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        const row = await scenario(page, bases[variant]).catch((error) => ({ ok: false, error: error.message.slice(0, 200) }));
        rows.push({ variant, run, scenario: name, ...row, hydrationError: errors.some((e) => /hydrat/i.test(e)), errors });
        console.log(variant, run, name, row.ok ? `ok ${row.ms}ms` : `FAIL ${JSON.stringify(row)}`);
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  backend.close();
}

const summary = {};
for (const v of variants) for (const s of Object.keys(scenarios)) {
  const r = rows.filter((x) => x.variant === v && x.scenario === s);
  summary[`${v}.${s}`] = { pass: `${r.filter((x) => x.ok).length}/${r.length}`, hydrationError: r.filter((x) => x.hydrationError).length, fails: r.filter((x) => !x.ok).map((x) => x.step ?? x.error ?? x.got).slice(0, 3) };
}
fs.writeFileSync(path.join(out, "raw.json"), JSON.stringify(rows, null, 2));
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(summary, null, 2));
for (const [k, v] of Object.entries(summary)) console.log(k.padEnd(20), v.pass, `hydration=${v.hydrationError}`, v.fails.length ? JSON.stringify(v.fails) : "");
