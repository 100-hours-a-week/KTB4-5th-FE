import { expect, it } from "vitest";
import { summarizeDrafts } from "./draft-summary";
const capacity = {
  stockTypeCount: 1,
  stockTypeLimit: 1500,
  remainingSlots: 1499,
  isLimitReached: false,
  isEstimate: false,
  existingStockKeys: ["우유|REFRIGERATED|2026-12-31|NONE"],
};
it("기존 개수 재고와 같은 이름의 부피 재고를 합산 안내하지 않는다", () => {
  const draft = {
    name: "우유",
    storageType: "REFRIGERATED" as const,
    expirationDate: "2026-12-31",
    weightValue: "500",
    weightUnit: "ML" as const,
  };
  expect(summarizeDrafts([draft], capacity)).toMatchObject({
    newStockTypeCount: 1,
    mergingNames: [],
  });
  expect(
    summarizeDrafts([{ ...draft, weightValue: "" }], capacity),
  ).toMatchObject({ newStockTypeCount: 0, mergingNames: ["우유"] });
});
