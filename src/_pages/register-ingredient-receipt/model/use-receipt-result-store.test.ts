// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { useReceiptResultStore } from "./use-receipt-result-store";

afterEach(() => {
  vi.restoreAllMocks();
  useReceiptResultStore.setState({ result: null, refrigeratorIds: {} });
  sessionStorage.clear();
});

it("새로고침 후 분석의 냉장고만 복원하고 인식한 재료는 저장하지 않는다", async () => {
  useReceiptResultStore.getState().rememberRefrigerator("job-1", "17");
  const saved = sessionStorage.getItem("dameokja.analysis-refrigerators")!;
  expect(JSON.parse(saved).state).toEqual({
    refrigeratorIds: { "job-1": "17" },
  });
  useReceiptResultStore.setState({ refrigeratorIds: {} });
  sessionStorage.setItem("dameokja.analysis-refrigerators", saved);
  await useReceiptResultStore.persist.rehydrate();
  expect(useReceiptResultStore.getState().refrigeratorIds).toEqual({
    "job-1": "17",
  });
  expect(useReceiptResultStore.getState().result).toBeNull();
});

it("브라우저 저장이 차단돼도 메모리에서 분석 냉장고를 확인한다", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(() =>
    useReceiptResultStore.getState().rememberRefrigerator("job-1", "17"),
  ).not.toThrow();
  expect(useReceiptResultStore.getState().refrigeratorIds["job-1"]).toBe("17");
});
