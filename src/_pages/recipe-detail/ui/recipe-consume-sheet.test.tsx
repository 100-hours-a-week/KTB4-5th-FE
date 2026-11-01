// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { RecipeConsumeSheet } from "./recipe-consume-sheet";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
afterEach(cleanup);
const props = {
  open: true,
  recipeName: "두부김치",
  rows: [],
  status: "idle" as const,
  onConfirm: vi.fn(),
  onDismiss: vi.fn(),
};
it("confirms record-only cooking in a dialog before submitting", () => {
  const confirm = vi.fn();
  render(<RecipeConsumeSheet {...props} onConfirm={confirm} />);
  expect(screen.getByRole("dialog").textContent).toContain(
    "요리 기록만 저장돼요",
  );
  expect(confirm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "기록 저장" }));
  expect(confirm).toHaveBeenCalledTimes(1);
});
it("locks both actions and dismissal while saving the record", () => {
  const dismiss = vi.fn();
  render(
    <RecipeConsumeSheet {...props} status="pending" onDismiss={dismiss} />,
  );
  expect(
    (screen.getByRole("button", { name: "저장 중…" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    (screen.getByRole("button", { name: "취소" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { cancelable: true }),
  );
  expect(dismiss).not.toHaveBeenCalled();
});
it("keeps retry feedback in the record-only dialog", () => {
  render(
    <RecipeConsumeSheet
      {...props}
      status="error"
      errorMessage="요청 정보가 충돌했어요."
    />,
  );
  expect(screen.getByRole("alert").textContent).toBe("요청 정보가 충돌했어요.");
  expect(screen.getByRole("button", { name: "다시 시도" })).toBeDefined();
});

it("keeps the deduction preview in a bottom sheet when stock will be consumed", () => {
  render(
    <RecipeConsumeSheet
      {...props}
      rows={[
        {
          ingredientId: "1",
          name: "두부",
          amountText: "2개",
          before: 3,
          after: 1,
          unitLabel: "개",
        },
      ]}
    />,
  );
  expect(screen.getByRole("dialog").tagName).toBe("DIV");
  expect(
    screen.getByRole("heading", { name: "이 재료를 차감할까요?" }),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "차감하기" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "기록 저장" })).toBeNull();
});
