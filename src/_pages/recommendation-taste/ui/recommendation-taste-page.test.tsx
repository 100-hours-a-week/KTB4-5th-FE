// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { RecommendationTastePage } from "./recommendation-taste-page";

const state = vi.hoisted(() => ({ limit: 10, remaining: 5 }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/entities/refrigerator", () => ({
  useCurrentRefrigeratorId: () => "1",
}));
vi.mock("@/entities/ingredient", () => ({
  IngredientRefrigeratorRequiredState: () => null,
}));
vi.mock("@/features/answer-taste-survey", () => ({
  MAX_TASTE_TAGS: 12,
  useTodayTaste: () => [],
  TasteOptionGroups: () => null,
}));
vi.mock("@/features/prepare-recommendations", () => ({
  useInventoryEmpty: () => false,
  useRecommendations: () => ({
    data: { dailyGeneration: state, status: "READY" },
    job: {},
  }),
}));

afterEach(() => {
  cleanup();
  Object.assign(state, { limit: 10, remaining: 5 });
});

it("제한된 추천의 실제 남은 횟수는 표시한다", () => {
  render(<RecommendationTastePage />);
  expect(screen.getByText(/오늘 5번 더 받을 수 있어요/)).toBeTruthy();
});

it("서버의 무제한 표시값을 사용자 잔여 횟수로 노출하지 않는다", () => {
  Object.assign(state, { limit: 2_147_483_647, remaining: 2_147_483_647 });
  render(<RecommendationTastePage />);
  expect(screen.queryByText(/2147483647/)).toBeNull();
  expect(
    screen.getByRole("button", { name: "상관없어요" }).hasAttribute("disabled"),
  ).toBe(false);
});
