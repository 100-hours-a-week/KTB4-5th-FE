// @vitest-environment jsdom
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { RegisterCapacityBoundary } from "./register-capacity-boundary";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/entities/refrigerator", () => ({
  useCurrentRefrigeratorId: () => "fridge-1",
}));
vi.mock("@/entities/ingredient", () => ({
  DEFAULT_INGREDIENT_LIST_SORT: "EXPIRATION_ASC",
  ingredientQueries: {
    firstPage: () => ({ queryKey: ["capacity"], queryFn: get }),
  },
  IngredientRefrigeratorRequiredState: () => null,
}));
vi.mock("../model/register-capacity", () => ({
  getRegisterCapacity: () => ({}),
}));
vi.mock("@/shared/ui/async-view-state", () => ({
  AsyncViewState: ({ title }: { title: string }) => <div>{title}</div>,
  asyncViewActionClassName: "",
}));

let client: QueryClient;
afterEach(() => {
  cleanup();
  client.clear();
  focusManager.setFocused(undefined);
  onlineManager.setOnline(true);
  vi.clearAllMocks();
});

function openForm() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  get.mockResolvedValue({});
  render(
    <QueryClientProvider client={client}>
      <RegisterCapacityBoundary>
        {() => <input aria-label="재료명" defaultValue="" />}
      </RegisterCapacityBoundary>
    </QueryClientProvider>,
  );
}

it.each(["focus", "reconnect"])(
  "%s 후 자동 재조회 없이 입력값을 유지한다",
  async (event) => {
    openForm();
    const input = await screen.findByRole("textbox");
    fireEvent.change(input, { target: { value: "우유" } });
    await act(async () => {
      if (event === "focus") {
        focusManager.setFocused(false);
        focusManager.setFocused(true);
      } else {
        onlineManager.setOnline(false);
        onlineManager.setOnline(true);
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(get).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox")).toBe(input);
    expect((input as HTMLInputElement).value).toBe("우유");
  },
);

it("명시적 무효화에 따른 재조회가 실패해도 입력 폼을 유지한다", async () => {
  openForm();
  const input = await screen.findByRole("textbox");
  fireEvent.change(input, { target: { value: "우유" } });
  get.mockRejectedValue(new Error("offline"));
  await act(() => client.invalidateQueries({ queryKey: ["capacity"] }));
  expect(get).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("textbox")).toBe(input);
  expect((input as HTMLInputElement).value).toBe("우유");
});
