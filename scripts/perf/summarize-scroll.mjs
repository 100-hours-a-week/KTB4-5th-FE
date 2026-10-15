// node scripts/perf/summarize-scroll.mjs
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const median = (values) => {
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? null;
};
const range = (values) => ({ median: median(values), min: Math.min(...values), max: Math.max(...values) });
if (process.argv.includes("--self-check")) {
  if (JSON.stringify(range([5, 1, 3, 4, 2])) !== '{"median":3,"min":1,"max":5}') throw new Error("range self-check failed");
  console.log("range self-check passed");
  process.exit(0);
}
if (process.argv.includes("--repeat")) {
  const label = process.argv.find((arg) => arg.startsWith("--label="))?.slice(8);
  if (!label || !/^[a-zA-Z0-9_-]+$/.test(label)) throw new Error("--label 값이 필요합니다.");
  const repeated = {};
  const categories = ["react", "query", "observer", "next", "derived", "other"];
  const classify = (name) => {
    if (/^(performWorkUntilDeadline|commitRoot|renderRoot|reconcileChildren|beginWork|completeWork|flushPassiveEffects)$/.test(name)) return "react";
    if (/^(onQueryUpdate|notifyManager|InfiniteQueryObserver|QueryObserver)$/.test(name)) return "query";
    if (/^onIntersect$/.test(name)) return "observer";
    if (/^(fetchServerResponse|createFromReadableStream)$/.test(name)) return "next";
    if (/^formatDaysUntilExpiration$/.test(name)) return "derived";
    return "other";
  };
  const workTotal = (x) => x.workMs.scripting + x.workMs.style + x.workMs.layout + x.workMs.paint;
  const perSec = (ms, x) => +(ms / (x.scrollDurationMs / 1000)).toFixed(1);
  const perPage = (ms, x) => +(ms / x.queryCache.pages).toFixed(1);
  const normalizedFields = {
    scrollSec: (x) => +(x.scrollDurationMs / 1000).toFixed(1),
    pages: (x) => x.queryCache.pages,
    workTotalMs: (x) => +workTotal(x).toFixed(1),
    occupancyPct: (x) => +(100 * workTotal(x) / x.scrollDurationMs).toFixed(1),
    ...Object.fromEntries(["scripting", "style", "layout", "paint"].flatMap((key) => [
      [`${key}PerSecMs`, (x) => perSec(x.workMs[key], x)],
      [`${key}PerPageMs`, (x) => perPage(x.workMs[key], x)],
    ])),
    workPerPageMs: (x) => perPage(workTotal(x), x),
  };
  const normalize = (runs) => Object.fromEntries(Object.entries(normalizedFields).map(([key, pick]) => [key, range(runs.map(pick))]));
  const table = [];
  for (const count of [100, 1000]) for (const speed of ["slow", "fast"]) {
    const dir = path.resolve(`scripts/perf/out/scroll-baseline/${count}-${speed}-${label}`);
    const resultFile = path.join(dir, "results.json");
    const runs = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile)) : [];
    if (runs.length !== 5) {
      const completedRuns = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => /^run-\d+\.json$/.test(name)).length : 0;
      const partialRuns = Array.from({ length: completedRuns }, (_, i) => JSON.parse(fs.readFileSync(path.join(dir, `run-${i + 1}.json`))));
      const partialNormalized = completedRuns ? normalize(partialRuns) : null;
      repeated[`${count}-${speed}`] = { status: "incomplete", completedRuns, requiredRuns: 5, summary: null, reason: `5회 중 ${completedRuns}회만 저장됨`, partialNormalized };
      if (partialNormalized) table.push({ condition: `${count}-${speed} (${completedRuns}/5)`, ...Object.fromEntries(Object.entries(partialNormalized).map(([key, value]) => [key, value.median])) });
      continue;
    }
    const fields = {
      dropped: (x) => x.compositorFrames.dropped, begun: (x) => x.compositorFrames.frames,
      droppedPct: (x) => x.compositorFrames.droppedPct, longestRafMs: (x) => x.frames.longestMs,
      scriptingMs: (x) => x.workMs.scripting, styleMs: (x) => x.workMs.style,
      layoutMs: (x) => x.workMs.layout, paintMs: (x) => x.workMs.paint,
      scrollDistancePx: (x) => x.scrollDistancePx, scrollDurationMs: (x) => x.scrollDurationMs,
      averageScrollPxPerSec: (x) => x.averageScrollPxPerSec,
    };
    const summary = Object.fromEntries(Object.entries(fields).map(([key, pick]) => [key, range(runs.map(pick))]));
    summary.normalized = normalize(runs);
    table.push({ condition: `${count}-${speed}`, ...Object.fromEntries(Object.entries(summary.normalized).map(([key, value]) => [key, value.median])) });
    const oldDir = path.resolve(`scripts/perf/out/scroll-baseline/${count}-${speed}`);
    const old = JSON.parse(fs.readFileSync(path.join(oldDir, "results.json")))[0];
    const oldTrace = JSON.parse(fs.readFileSync(path.join(oldDir, "performance-trace.json"))).traceEvents;
    const oldBegun = oldTrace.filter((event) => event.name === "BeginFrame" && event.args?.layerTreeId === 2).length;
    const oldDropped = oldTrace.filter((event) => event.name === "DroppedFrame" && event.args?.layerTreeId === 2).length;
    summary.baselineSingleRun = {
      dropped: oldDropped, begun: oldBegun, droppedPct: oldBegun ? +(100 * oldDropped / oldBegun).toFixed(1) : null,
      longestRafMs: old.frames.longestMs, scriptingMs: old.workMs.scripting,
      styleMs: old.workMs.style, layoutMs: old.workMs.layout, paintMs: old.workMs.paint,
    };
    if (speed === "fast") {
      const traceCallbacks = runs.map((run) => {
        const events = JSON.parse(fs.readFileSync(path.join(dir, `performance-trace-${run.run}.json`))).traceEvents;
        const callbacks = { observerMs: 0, nextLinkMs: 0, observerCalls: 0, nextLinkCalls: 0, rscPrefetches: 0 };
        for (const event of events) {
          if (event.name === "ResourceSendRequest" && event.args?.data?.url?.includes("?_rsc=")) callbacks.rscPrefetches++;
          if (event.name !== "FunctionCall") continue;
          // Verified in this build: root is the list trigger; rootMargin is Next Link's observer.
          const name = event.args?.data?.functionName;
          if (name === "IntersectionObserver.root") {
            callbacks.observerMs += event.dur / 1000;
            callbacks.observerCalls++;
          } else if (name === "IntersectionObserver.rootMargin") {
            callbacks.nextLinkMs += event.dur / 1000;
            callbacks.nextLinkCalls++;
          }
        }
        return callbacks;
      });
      summary.traceIdentified = Object.fromEntries(Object.keys(traceCallbacks[0]).map((key) => [key, range(traceCallbacks.map((item) => +item[key].toFixed(1)))]));
      summary.traceIdentifiedPctOfScripting = Object.fromEntries(["observerMs", "nextLinkMs"].map((key) => [key, range(traceCallbacks.map((item, i) => +(100 * item[key] / runs[i].workMs.scripting).toFixed(1)))]));
      const profiles = runs.map((run) => {
        const profile = JSON.parse(fs.readFileSync(path.join(dir, `cpu-profile-${run.run}.json`)));
        const names = new Map(profile.nodes.map((node) => [node.id, node.callFrame.functionName]));
        const sampleMs = Object.fromEntries(categories.map((key) => [key, 0]));
        const calls = new Map();
        for (let i = 0; i < profile.samples.length; i++) {
          const name = names.get(profile.samples[i]) ?? "(unknown)";
          if (["(idle)", "(program)"].includes(name)) continue;
          const ms = (profile.timeDeltas?.[i] ?? 0) / 1000;
          sampleMs[classify(name)] += ms;
          calls.set(name, (calls.get(name) ?? 0) + ms);
        }
        return { sampleMs, topCalls: [...calls].sort((a, b) => b[1] - a[1]).slice(0, 15) };
      });
      summary.cpuSamples = Object.fromEntries(categories.map((key) => [key, range(profiles.map((p) => +p.sampleMs[key].toFixed(1)))]));
      summary.cpuSampleTotal = range(profiles.map((p) => +Object.values(p.sampleMs).reduce((a, b) => a + b, 0).toFixed(1)));
      summary.cpuSamplePct = Object.fromEntries(categories.map((key) => [key, range(profiles.map((p) => {
        const total = Object.values(p.sampleMs).reduce((a, b) => a + b, 0);
        return total ? +(100 * p.sampleMs[key] / total).toFixed(1) : 0;
      }))]));
      for (const key of categories.filter((key) => key !== "other")) {
        if (profiles.every((p) => p.sampleMs[key] === 0)) {
          summary.cpuSamples[key] = null;
          summary.cpuSamplePct[key] = null;
        }
      }
      summary.scriptingBreakdownMethod = "trace FunctionCall에서 목록 IntersectionObserver와 Next Link observer 콜백만 직접 식별. CPU 샘플 함수명은 production 최소화로 식별 불가 시 null이며, 나머지는 기타에 포함. RSC 요청 횟수는 CPU 시간이 아님.";
      summary.topCalls = profiles.map((p) => p.topCalls);
    }
    repeated[`${count}-${speed}`] = summary;
  }
  const dest = path.resolve(`scripts/perf/out/scroll-baseline/repeat-${label}.json`);
  fs.writeFileSync(dest, JSON.stringify(repeated, null, 2));
  console.table(table);
  console.log(dest);
  process.exit(0);
}

const out = path.resolve("scripts/perf/out/scroll-baseline");
const rows = [];
for (const count of [100, 500, 1000]) for (const speed of ["slow", "fast"]) {
  const dir = path.join(out, `${count}-${speed}`);
  const result = JSON.parse(fs.readFileSync(path.join(dir, "results.json")))[0];
  const events = JSON.parse(fs.readFileSync(path.join(dir, "performance-trace.json"))).traceEvents;
  const begun = events.filter((event) => event.name === "BeginFrame" && event.args?.layerTreeId === 2).length;
  const dropped = events.filter((event) => event.name === "DroppedFrame" && event.args?.layerTreeId === 2).length;
  const prefetches = events.filter((event) => event.name === "ResourceSendRequest" && event.args?.data?.url?.includes("?_rsc=")).length;
  const delays = result.nextPages.map((page) => page.cardVisibleAfterResponseMs).sort((a, b) => a - b);
  rows.push({ count, speed, begun, dropped, droppedPct: +(100 * dropped / begun).toFixed(1), longestRafGapMs: result.frames.longestMs,
    longTasks: result.longTasks.count, loafs: result.loaf.count, scriptingMs: result.workMs.scripting, styleMs: result.workMs.style,
    layoutMs: result.workMs.layout, paintMs: result.workMs.paint, forcedReflowWarnings: result.forcedReflow,
    listRequests: result.requests.total, duplicateCursors: result.requests.duplicateCursors, rscPrefetchesDuringScroll: prefetches,
    cardDelayMedianMs: delays[Math.floor(delays.length / 2)], cardDelayMaxMs: delays.at(-1),
    queryPages: result.queryCache?.pages, queryBytes: result.queryCache?.estimatedJsonBytes,
    domNodes: result.domNodes, jsHeapMb: result.jsHeapMb, decodedImageUpperBoundMb: result.decodedImageUpperBoundMb, cls: result.cls });
}
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(rows, null, 2));
const grouped = [100, 500, 1000].map((count) => rows.filter((row) => row.count === count));
const bars = grouped.map((group) => `<div class="group"><strong>${group[0].count}건</strong><div class="bar" style="height:${group[0].droppedPct * 25 + 4}px"><span>${group[0].droppedPct}%</span></div><div class="bar fast" style="height:${group[1].droppedPct * 25 + 4}px"><span>${group[1].droppedPct}%</span></div></div>`).join("");
const biggest = rows.at(-1);
const totalWork = biggest.scriptingMs + biggest.styleMs + biggest.layoutMs + biggest.paintMs;
const work = [["Scripting", biggest.scriptingMs, "#cf5c43"], ["Style", biggest.styleMs, "#6d7fc2"], ["Layout", biggest.layoutMs, "#8e69b5"], ["Paint", biggest.paintMs, "#66a18c"]].map(([name, ms, color]) => `<div class="work"><span>${name}</span><div class="track"><div style="width:${ms / totalWork * 100}%;background:${color}"></div></div><b>${ms} ms</b></div>`).join("");
const table = rows.map((row) => `<tr><td>${row.count} / ${row.speed}</td><td>${row.dropped} / ${row.begun}</td><td>${row.listRequests} (+${row.rscPrefetchesDuringScroll} RSC)</td><td>${row.domNodes.toLocaleString()}</td><td>${row.jsHeapMb} MB</td></tr>`).join("");
const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:44px;background:#f5f3ef;color:#242424;font:17px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif}h1{font-size:34px;margin:0 0 8px}.sub{color:#666;margin:0 0 34px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.card{background:white;border-radius:18px;padding:28px;box-shadow:0 3px 16px #0000000d}h2{font-size:21px;margin:0 0 24px}.chart{height:235px;display:flex;align-items:end;justify-content:space-around;border-bottom:1px solid #ccc;padding:0 20px}.group{height:100%;display:flex;align-items:end;gap:12px;position:relative;padding-bottom:32px}.group strong{position:absolute;bottom:4px;width:100%;text-align:center}.bar{width:40px;background:#5b718e;border-radius:6px 6px 0 0;position:relative}.bar.fast{background:#c86048}.bar span{position:absolute;top:-25px;left:50%;transform:translateX(-50%);font-size:14px;font-weight:bold}.legend{font-size:14px;color:#666;margin-top:20px}.sw{display:inline-block;width:13px;height:13px;border-radius:3px;margin:0 6px 0 18px;background:#5b718e}.sw.fast{background:#c86048}.work{display:flex;align-items:center;gap:12px;margin:18px 0;font-size:15px}.work span{width:76px}.work b{width:85px;text-align:right}.track{flex:1;height:20px;background:#eee;border-radius:5px;overflow:hidden}.track div{height:100%}.table{grid-column:1/3}table{width:100%;border-collapse:collapse;font-size:16px}th,td{padding:13px;text-align:right;border-bottom:1px solid #eee}th:first-child,td:first-child{text-align:left}.note{font-size:14px;color:#666;margin:22px 0 0}</style><h1>목록 스크롤 개선 전 기준선</h1><p class="sub">Production 빌드 · 390×844 · CPU 4배 · Slow 4G · 동일한 10건/페이지 데이터</p><div class="grid"><section class="card"><h2>Chrome DroppedFrame 비율</h2><div class="chart">${bars}</div><p class="legend"><i class="sw"></i>느린 스크롤 <i class="sw fast"></i>빠른 스크롤</p></section><section class="card"><h2>1000건 빠른 스크롤 작업 시간</h2>${work}<p class="note">메인 스레드 작업 합계. Scripting 비중 ${(biggest.scriptingMs / totalWork * 100).toFixed(1)}%</p></section><section class="card table"><h2>목록 크기별 비용</h2><table><tr><th>건수 / 속도</th><th>드롭 / 시작 프레임</th><th>목록 요청 (+RSC prefetch)</th><th>DOM 노드</th><th>JS heap</th></tr>${table}</table><p class="note">RSC prefetch는 스크롤 트레이스 구간에서 관측한 상세 페이지 사전 요청입니다. 목록 API 요청과 별개입니다.</p></section></div>`;
fs.writeFileSync(path.join(out, "chart.html"), html);
const browser = await chromium.launch({ channel: "chrome" });
try { const page = await browser.newPage({ viewport: { width: 1280, height: 850 }, deviceScaleFactor: 2 }); await page.goto(`file://${path.join(out, "chart.html")}`); await page.screenshot({ path: path.join(out, "chart.png"), fullPage: true }); }
finally { await browser.close(); }
console.log(path.join(out, "summary.json"));
