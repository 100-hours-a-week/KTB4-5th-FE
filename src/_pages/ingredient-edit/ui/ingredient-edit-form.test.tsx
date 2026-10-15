// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import type { IngredientEditTarget } from "../model/ingredient-edit-target";
import { IngredientEditForm } from "./ingredient-edit-form";

const refreshAction = vi.hoisted(() => ({
  current: null as null | (() => void),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/shared/ui/app-toast", () => ({
  showAppToast: vi.fn(),
  showPersistentAppToast: (options: { action: { onClick: () => void } }) => {
    refreshAction.current = options.action.onClick;
    return () => {
      refreshAction.current = null;
    };
  },
}));
vi.mock("@/features/select-expiration-date", async () => {
  const { z } = await import("zod");
  return { ingredientExpirationDateSchema: z.string() };
});
vi.mock("./ingredient-edit-card", async () => {
  const { useFormContext } = await import("react-hook-form");
  return {
    IngredientEditCard: () => {
      const form = useFormContext();
      return <input aria-label="재료명" {...form.register("name")} />;
    },
  };
});
vi.mock("./edit-leave-guard", () => ({ EditLeaveGuard: () => null }));
vi.mock("./edit-submit-button", () => ({ EditSubmitButton: () => null }));
vi.mock("./edit-summary-line", () => ({ EditSummaryLine: () => null }));
vi.mock("@/shared/ui/app-dialog", () => ({
  AppDialog: ({
    open,
    title,
    description,
    secondaryAction,
  }: {
    open: boolean;
    title: string;
    description: string;
    secondaryAction: { label: string; onClick: () => void };
  }) =>
    open ? (
      <div role="dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <button onClick={secondaryAction.onClick}>
          {secondaryAction.label}
        </button>
      </div>
    ) : null,
}));

const target: IngredientEditTarget = {
  ingredientId: "1",
  etag: '"etag"',
  createdDate: "2026-10-01",
  initialValues: {
    name: "두부",
    category: "TOFU_BEAN",
    measureType: "COUNT",
    storageType: "REFRIGERATED",
    quantity: "1",
    weightValue: "",
    weightUnit: "G",
    expirationDate: "2026-10-15",
  },
};

it("수정 중 갱신 토스트를 누르면 확인창을 띄우고 계속 수정할 수 있다", () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <IngredientEditForm
        target={target}
        refrigeratorId="fridge-1"
        isDateStale
      />
    </QueryClientProvider>,
  );

  const name = screen.getByRole("textbox", { name: "재료명" });
  fireEvent.change(name, { target: { value: "새 두부" } });
  act(() => refreshAction.current?.());

  expect(screen.getByRole("dialog").textContent).toContain(
    "수정을 그만둘까요?",
  );
  expect(screen.getByRole("dialog").textContent).toContain(
    "지금 나가면 바꾼 내용이 저장되지 않습니다",
  );
  fireEvent.click(screen.getByRole("button", { name: "계속 수정" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect((name as HTMLInputElement).value).toBe("새 두부");
});
