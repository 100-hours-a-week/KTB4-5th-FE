import { expect, it, vi } from "vitest";

import type { IngredientListPage } from "@/entities/ingredient";

vi.mock("@/features/select-expiration-date", () => ({
  addDaysToIsoDate: (date: string, days: number) =>
    new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000)
      .toISOString()
      .slice(0, 10),
}));

import { getRegisterCapacity } from "./register-capacity";

it("reconstructs existing expiration dates from the response base date", () => {
  const page: IngredientListPage = {
    baseDate: "2026-09-16",
    outdated: false,
    ingredientsNum: 1,
    filteredCount: 1,
    refrigeratorCapacity: 100,
    refrigeratorName: "우리집",
    nextCursor: null,
    ingredients: [
      {
        ingredientId: "1",
        name: "두부",
        category: "TOFU_BEAN",
        measureType: "COUNT",
        quantity: 1,
        weightValue: null,
        weightUnit: "NONE",
        storageType: "REFRIGERATED",
        status: "EXPIRED",
        daysUntilExpiration: -1,
      },
    ],
  };

  expect(getRegisterCapacity(page).existingStockKeys).toContain(
    "두부|REFRIGERATED|2026-09-15",
  );
});
