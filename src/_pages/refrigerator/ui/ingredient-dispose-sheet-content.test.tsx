// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

import type { Ingredient } from "@/entities/ingredient";

import { IngredientDisposeBottomSheetContent } from "./ingredient-dispose-sheet-content";

vi.mock("@/shared/ui/app-bottom-sheet", () => ({
  AppBottomSheetTitle: ({ children }: { children: ReactNode }) => (
    <h2>{children}</h2>
  ),
  AppBottomSheetDescription: ({ children }: { children: ReactNode }) => (
    <p>{children}</p>
  ),
}));

const INGREDIENTS: Ingredient[] = [
  {
    ingredientId: "12",
    name: "우유",
    category: "DAIRY",
    measureType: "COUNT",
    quantity: 1,
    weightValue: null,
    weightUnit: "NONE",
    storageType: "REFRIGERATED",
    status: "EXPIRED",
    daysUntilExpiration: -2,
  },
  {
    ingredientId: "305",
    name: "두부",
    category: "TOFU_BEAN",
    measureType: "COUNT",
    quantity: 2,
    weightValue: null,
    weightUnit: "NONE",
    storageType: "REFRIGERATED",
    status: "EXPIRED",
    daysUntilExpiration: -1,
  },
];

afterEach(cleanup);

it("passes only the checked ingredient ids to the confirmation step", () => {
  const onConfirm = vi.fn();

  render(
    <IngredientDisposeBottomSheetContent
      ingredients={INGREDIENTS}
      onCancel={vi.fn()}
      onConfirm={onConfirm}
    />,
  );

  fireEvent.click(screen.getByRole("checkbox", { name: /우유/ }));
  fireEvent.click(screen.getByRole("button", { name: "1종 폐기하기" }));

  expect(onConfirm).toHaveBeenCalledWith(["305"]);
});
