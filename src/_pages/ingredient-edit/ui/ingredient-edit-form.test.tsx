// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import {
  ingredientQueries,
  type IngredientDetailView,
  type UpdateIngredientResult,
} from "@/entities/ingredient";
import { writeAppNavigationDepth } from "@/shared/lib/navigation-history";

import type { IngredientEditTarget } from "../model/ingredient-edit-target";
import { IngredientEditForm } from "./ingredient-edit-form";

const refreshAction = vi.hoisted(() => ({
  current: null as null | (() => void),
}));
const { router, updateIngredient } = vi.hoisted(() => ({
  router: { back: vi.fn(), replace: vi.fn() },
  updateIngredient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));
vi.mock("@/entities/ingredient", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/ingredient")>()),
  updateIngredient,
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const detail: IngredientDetailView = {
  baseDate: "2026-10-01",
  etag: target.etag,
  ingredient: {
    ingredientId: target.ingredientId,
    name: "두부",
    category: "TOFU_BEAN",
    measureType: "COUNT",
    storageType: "REFRIGERATED",
    quantity: 1,
    weightValue: null,
    weightUnit: "NONE",
    expirationDate: "2026-10-15",
    createdDate: target.createdDate,
    status: "NORMAL",
    daysUntilExpiration: 14,
    ownerNickname: "등록자",
  },
};

it.each([0, 2])(
  "합산으로 원본이 사라지면 캐시를 제거하고 대상 상세로 교체한다 (depth=%i)",
  async (depth) => {
    writeAppNavigationDepth(depth);
    const client = new QueryClient();
    const oldKey = ingredientQueries.detail("fridge-1", "1").queryKey;
    const savedKey = ingredientQueries.detail("fridge-1", "2").queryKey;
    client.setQueryData(oldKey, detail);
    client.setQueryData(savedKey, {
      ...detail,
      ingredient: {
        ...detail.ingredient,
        ingredientId: "2",
        ownerNickname: "대상 등록자",
      },
    });
    const result: UpdateIngredientResult = {
      ingredient: {
        ...detail.ingredient,
        ingredientId: "2",
        name: "새 두부",
        quantity: 4,
      },
      etag: '"merged-etag"',
      mergedItems: [
        {
          ingredientId: 2,
          name: "새 두부",
          measureType: "COUNT",
          previousQuantity: 3,
          addedQuantity: 1,
          totalQuantity: 4,
          previousWeightValue: null,
          addedWeightValue: null,
          totalWeightValue: null,
          weightUnit: "NONE",
        },
      ],
    };
    updateIngredient.mockResolvedValue(result);
    const { container } = render(
      <QueryClientProvider client={client}>
        <IngredientEditForm
          target={target}
          refrigeratorId="fridge-1"
          isDateStale={false}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "재료명" }), {
      target: { value: "새 두부" },
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        "/refrigerator/ingredients/2",
      ),
    );
    expect(router.back).not.toHaveBeenCalled();
    expect(client.getQueryData(oldKey)).toBeUndefined();
    expect(client.getQueryState(savedKey)?.isInvalidated).toBe(true);
    expect(client.getQueryData(savedKey)?.ingredient.ownerNickname).toBe(
      "대상 등록자",
    );
    client.clear();
  },
);

it.each([0, 2])(
  "일반 수정은 기존 ID의 캐시를 갱신하고 원래 복귀 방식을 유지한다 (depth=%i)",
  async (depth) => {
    writeAppNavigationDepth(depth);
    const client = new QueryClient();
    const key = ingredientQueries.detail("fridge-1", "1").queryKey;
    client.setQueryData(key, detail);
    updateIngredient.mockResolvedValue({
      ingredient: { ...detail.ingredient, name: "새 두부" },
      mergedItems: [],
      etag: '"new-etag"',
    } satisfies UpdateIngredientResult);
    const { container } = render(
      <QueryClientProvider client={client}>
        <IngredientEditForm
          target={target}
          refrigeratorId="fridge-1"
          isDateStale={false}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "재료명" }), {
      target: { value: "새 두부" },
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(updateIngredient).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      depth > 0
        ? expect(router.back).toHaveBeenCalledTimes(1)
        : expect(router.replace).toHaveBeenCalledWith(
            "/refrigerator/ingredients/1",
          ),
    );
    expect(client.getQueryData(key)).toMatchObject({
      etag: '"new-etag"',
      ingredient: { ingredientId: "1", name: "새 두부" },
    });
    client.clear();
  },
);

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
