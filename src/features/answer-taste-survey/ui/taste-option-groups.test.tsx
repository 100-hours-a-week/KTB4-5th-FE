// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { toRecommendationJobRequest } from "../model/taste-groups";
import { TasteOptionGroups } from "./taste-option-groups";

afterEach(cleanup);
function Survey({ initial = [] }: { initial?: string[] }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <TasteOptionGroups value={value} onChange={setValue} />
      <output data-testid="request">
        {JSON.stringify(toRecommendationJobRequest(value))}
      </output>
    </>
  );
}
it("keeps multiple meal purposes selected and sends them together, allowing individual deselection", () => {
  render(<Survey />);
  const group = within(screen.getByRole("group", { name: /식사 목적/ }));
  expect(group.getByText("여러 개 선택")).toBeDefined();
  fireEvent.click(group.getByRole("button", { name: "간식" }));
  fireEvent.click(group.getByRole("button", { name: "한끼" }));
  expect(
    group.getByRole("button", { name: "간식" }).getAttribute("aria-pressed"),
  ).toBe("true");
  expect(
    group.getByRole("button", { name: "한끼" }).getAttribute("aria-pressed"),
  ).toBe("true");
  expect(JSON.parse(screen.getByTestId("request").textContent!)).toEqual({
    preferenceTags: ["간식", "한끼"],
  });
  fireEvent.click(group.getByRole("button", { name: "간식" }));
  expect(JSON.parse(screen.getByTestId("request").textContent!)).toEqual({
    preferenceTags: ["한끼"],
  });
});
it("stops at 12 tags without blocking servings or replacing a single-choice tag", () => {
  render(
    <Survey
      initial={[
        "spicy",
        "mild",
        "savory",
        "sweet",
        "korean",
        "western",
        "chinese",
        "japanese",
        "easy",
        "snack",
        "dessert",
        "meal",
        "servings-1",
      ]}
    />,
  );
  expect(
    (
      screen.getByRole("button", {
        name: "간편한 식사",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "2인분" }));
  fireEvent.click(screen.getByRole("button", { name: "중간" }));
  const request = JSON.parse(screen.getByTestId("request").textContent!);
  expect(request.targetServings).toBe(2);
  expect(request.preferenceTags).toHaveLength(12);
  expect(request.preferenceTags).toContain("중간");
  expect(request.preferenceTags).not.toContain("쉬움");
  fireEvent.click(screen.getByRole("button", { name: "간식" }));
  expect(
    (
      screen.getByRole("button", {
        name: "간편한 식사",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
});
