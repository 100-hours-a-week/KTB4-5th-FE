// node scripts/perf/summarize-p95.mjs <결과폴더> [<결과폴더> ...]
// scroll-baseline.mjs 결과 폴더들을 "중앙값 / p95" 표로 비교한다. 판단은 p95 기준.
// 드롭 프레임은 trace에서 녹화 시작 0.5초를 뺀 스크롤 구간만 센다 (녹화 시작 부작용 제외).
import fs from "node:fs";
import path from "node:path";

const WARMUP_US = 500_000;
const sorted = (a) => a.filter((x) => x != null).sort((x, y) => x - y);
const q = (a, p) => a[Math.floor((a.length - 1) * p)] ?? 0;
const mp = (a) => (a = sorted(a), `${q(a, 0.5)} / ${q(a, 0.95)}`);

const scrollDrops = (dir, run) => {
  const file = path.join(dir, `performance-trace-${run.run}.json`);
  if (!fs.existsSync(file)) return null;
  const events = JSON.parse(fs.readFileSync(file)).traceEvents;
  const ours = (name) => events.filter((e) => e.name === name && e.args?.layerTreeId === 2).map((e) => e.ts);
  const t0 = Math.min(...ours("BeginFrame"));
  return ours("DroppedFrame").filter((ts) => ts - t0 >= WARMUP_US).length;
};

const rows = {};
for (const dir of process.argv.slice(2)) {
  const runs = JSON.parse(fs.readFileSync(path.join(dir, "results.json")));
  const pages = runs.flatMap((r) => r.nextPages);
  const waits = pages.map((p) => p.waitAtBottomMs).filter((x) => x != null);
  rows[path.basename(dir)] = {
    회차: runs.length,
    "드롭프레임(스크롤 구간)": mp(runs.map((r) => scrollDrops(dir, r))),
    "프레임간격 p95(ms)": mp(runs.map((r) => r.frames.p95Ms)),
    "대기 페이지별(ms)": mp(waits),
    "대기 회차별 최대(ms)": mp(runs.map((r) => Math.max(0, ...r.nextPages.map((p) => p.waitAtBottomMs ?? 0)))),
    "바닥 도달": `${waits.length}/${pages.length} (${((waits.length / pages.length) * 100).toFixed(1)}%)`,
  };
  if (runs.length < 20) console.warn(`${path.basename(dir)}: ${runs.length}회차 — p95는 20회 이상부터 근거로 쓰세요`);
}
console.log("값 = 중앙값 / p95 (판단은 p95 기준)");
console.table(rows);
