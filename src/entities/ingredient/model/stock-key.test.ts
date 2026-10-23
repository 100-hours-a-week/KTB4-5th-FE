import { expect, it } from "vitest";
import { toStockKey } from "./stock-key";
it("개수, g, ml를 서로 다른 합산 대상으로 구분한다", () => {
  const keys = ["NONE", "G", "ML"] as const;
  expect(
    new Set(
      keys.map((unit) =>
        toStockKey("우유", "REFRIGERATED", "2026-12-31", unit),
      ),
    ).size,
  ).toBe(3);
  expect(
    toStockKey("우유".normalize("NFD"), "REFRIGERATED", "2026-12-31", "ML"),
  ).toBe(toStockKey("우유", "REFRIGERATED", "2026-12-31", "ML"));
});
