// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { IngredientEditPage } from "./ingredient-edit-page";
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: { ingredient: { status: "EXPIRED" } },
    isPending: false,
    isFetchedAfterMount: true,
  }),
}));
vi.mock("@/entities/refrigerator", () => ({
  useCurrentRefrigeratorId: () => "17",
}));
vi.mock("@/entities/ingredient", () => ({
  ingredientQueries: { detail: () => ({}) },
  useIngredientDateStale: () => false,
}));
vi.mock("./ingredient-edit-form", () => ({
  IngredientEditForm: () => <div>수정 입력 폼</div>,
}));
vi.mock("@/shared/ui/app-link", () => ({
  AppLink: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));
afterEach(cleanup);
it("만료 재고 URL에 직접 들어와도 수정 폼을 열지 않고 상세 복귀를 제공한다", () => {
  render(<IngredientEditPage ingredientId="320" />);
  expect(screen.getByText("만료된 재고는 수정할 수 없어요")).toBeTruthy();
  expect(screen.queryByText("수정 입력 폼")).toBeNull();
  expect(
    screen.getByRole("link", { name: "상세로 돌아가기" }).getAttribute("href"),
  ).toBe("/refrigerator/ingredients/320");
});
