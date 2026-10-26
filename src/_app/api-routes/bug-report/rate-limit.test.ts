import { beforeEach, expect, it, vi } from "vitest";

beforeEach(() => vi.resetModules());

it("사용자별 10분 내 5회만 허용하고 만료된 요청은 제외한다", async () => {
  const { consumeBugReportQuota } = await import("./rate-limit");
  for (let i = 0; i < 5; i += 1)
    expect(consumeBugReportQuota("a", i)).toBe(true);
  expect(consumeBugReportQuota("a", 5)).toBe(false);
  expect(consumeBugReportQuota("b", 5)).toBe(true);
  expect(consumeBugReportQuota("a", 600_000)).toBe(true);
  expect(consumeBugReportQuota("a", 600_000)).toBe(false);
});

it("키 상한에서 기존 제한을 유지하고 만료 정리 후 새 사용자를 받는다", async () => {
  const { consumeBugReportQuota } = await import("./rate-limit");
  for (let i = 0; i < 10_000; i += 1)
    expect(consumeBugReportQuota(String(i), 0)).toBe(true);
  expect(consumeBugReportQuota("new-user", 1)).toBe(false);
  for (let i = 0; i < 4; i += 1)
    expect(consumeBugReportQuota("0", 1)).toBe(true);
  expect(consumeBugReportQuota("0", 2)).toBe(false);
  expect(consumeBugReportQuota("new-user", 600_001)).toBe(true);
});
