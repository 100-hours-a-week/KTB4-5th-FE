// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { useIngredientDateStale } from "./use-ingredient-date-stale";

afterEach(() => vi.useRealTimers());

it("outdated 응답과 KST 자정 경계를 갱신 필요 상태로 반영한다", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-14T14:59:59Z"));

  const { result, rerender } = renderHook(
    ({ outdated }) => useIngredientDateStale("2026-10-14", outdated),
    { initialProps: { outdated: false } },
  );
  expect(result.current).toBe(false);

  rerender({ outdated: true });
  expect(result.current).toBe(true);

  rerender({ outdated: false });
  act(() => vi.advanceTimersByTime(2_000));
  expect(result.current).toBe(true);
});
