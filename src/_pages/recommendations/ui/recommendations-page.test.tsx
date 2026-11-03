// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

import type { RecommendedRecipe } from "@/entities/recommendation";
import { consumeAppNavigationIntent } from "@/shared/lib/navigation-history";

import { RecommendationsPage } from "./recommendations-page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("@/entities/refrigerator", () => ({
  useCurrentRefrigeratorId: () => "1",
}));
vi.mock("@/entities/ingredient", () => ({
  IngredientRefrigeratorRequiredState: () => null,
}));
vi.mock("@/features/answer-taste-survey", () => ({
  useTodayTaste: () => [],
  toTasteLabels: () => [],
}));
vi.mock("@/features/prepare-recommendations", () => ({
  useRecommendations: () => ({
    data: {
      recommendationId: "rec-1",
      recipes,
      dailyGeneration: { remaining: 5 },
    },
    job: {},
    switchJob: {},
  }),
}));
vi.mock("@/shared/ui/app-link", () => ({
  AppLink: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("./recommended-recipe-card", () => ({
  RecommendedRecipeCard: ({ recipe }: { recipe: RecommendedRecipe }) => (
    <a href={`/recommendations/${recipe.recipeId}`}>{recipe.name}</a>
  ),
}));

const recipes: RecommendedRecipe[] = [
  {
    recipeId: "1",
    name: "임박 요리",
    imageUrl: null,
    cookingTimeMinutes: null,
    ingredientCounts: { total: 5, owned: 1, expiring: 3 },
  },
  {
    recipeId: "2",
    name: "보유 요리",
    imageUrl: null,
    cookingTimeMinutes: null,
    ingredientCounts: { total: 5, owned: 3, expiring: 1 },
  },
  {
    recipeId: "3",
    name: "부족 없는 요리",
    imageUrl: null,
    cookingTimeMinutes: null,
    ingredientCounts: { total: 2, owned: 2, expiring: 0 },
  },
];

afterEach(cleanup);

function order() {
  return within(screen.getByRole("region", { name: "추천 요리 목록" }))
    .getAllByRole("link")
    .map((link) => link.textContent);
}

it("restores the URL's sort and recipe order after leaving and remounting the list", () => {
  window.history.replaceState(null, "", "/recommendations?sort=SHORTAGE");
  const view = render(<RecommendationsPage />);
  expect(
    (screen.getByRole("combobox", { name: "정렬 기준" }) as HTMLSelectElement)
      .value,
  ).toBe("SHORTAGE");
  expect(order()).toEqual(["부족 없는 요리", "보유 요리", "임박 요리"]);
  view.unmount();
  render(<RecommendationsPage />);
  expect(
    (screen.getByRole("combobox", { name: "정렬 기준" }) as HTMLSelectElement)
      .value,
  ).toBe("SHORTAGE");
  expect(order()).toEqual(["부족 없는 요리", "보유 요리", "임박 요리"]);
});

it("replaces the URL when sorting, preserves other parameters, and removes the default sort", () => {
  window.history.replaceState(null, "", "/recommendations?msw=on");
  const historyLength = window.history.length;
  const view = render(<RecommendationsPage />);
  fireEvent.change(screen.getByRole("combobox", { name: "정렬 기준" }), {
    target: { value: "OWNED" },
  });
  expect(window.location.search).toBe("?msw=on&sort=OWNED");
  expect(consumeAppNavigationIntent(window.location.href)).toBe("replace");
  expect(window.history.length).toBe(historyLength);
  // Next.js는 replaceState 변경을 useSearchParams에 반영한다.
  view.rerender(<RecommendationsPage />);
  expect(order()).toEqual(["보유 요리", "부족 없는 요리", "임박 요리"]);
  fireEvent.change(screen.getByRole("combobox", { name: "정렬 기준" }), {
    target: { value: "EXPIRING" },
  });
  expect(window.location.search).toBe("?msw=on");
  view.rerender(<RecommendationsPage />);
  expect(order()).toEqual(["임박 요리", "보유 요리", "부족 없는 요리"]);
});

it.each(["", "?sort=UNKNOWN", "?sort="])(
  "uses the default order for an absent or invalid sort: %s",
  (query) => {
    window.history.replaceState(null, "", `/recommendations${query}`);
    render(<RecommendationsPage />);
    expect(
      (screen.getByRole("combobox", { name: "정렬 기준" }) as HTMLSelectElement)
        .value,
    ).toBe("EXPIRING");
    expect(order()).toEqual(["임박 요리", "보유 요리", "부족 없는 요리"]);
  },
);
