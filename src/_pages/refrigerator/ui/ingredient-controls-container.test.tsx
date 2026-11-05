// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { Suspense, useState, type ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

import {
  DEFAULT_INGREDIENT_LIST_QUERY,
  type IngredientListQuery,
} from "@/entities/ingredient";

import { IngredientControlsContainer } from "./ingredient-controls-container";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("@/shared/ui/chip-scroll-row", () => ({
  ChipScrollRow: ({
    children,
    ...props
  }: {
    children: ReactNode;
    "aria-label": string;
  }) => (
    <div role="group" {...props}>
      {children}
    </div>
  ),
}));
vi.mock("../model/use-ingredient-list-navigation", () => ({
  useIngredientListNavigation:
    (query: IngredientListQuery) => (patch: Partial<IngredientListQuery>) =>
      navigate(query, patch),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

function setup() {
  let released = false;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  function List({ query }: { query: IngredientListQuery }) {
    if (query.filter !== null && !released) throw pending;
    return <output data-testid="list-query">{JSON.stringify(query)}</output>;
  }
  function Harness() {
    const [query, setQuery] = useState(DEFAULT_INGREDIENT_LIST_QUERY);
    navigate.mockImplementation(
      (current: IngredientListQuery, patch: Partial<IngredientListQuery>) =>
        setQuery({ ...current, ...patch }),
    );
    return (
      <>
        <IngredientControlsContainer
          query={query}
          filteredCount={10}
          isLoading={false}
          onPrefetch={() => {}}
        />
        <Suspense fallback={<p>Loading list</p>}>
          <List query={query} />
        </Suspense>
        <button onClick={() => setQuery(DEFAULT_INGREDIENT_LIST_QUERY)}>
          Restore URL
        </button>
      </>
    );
  }
  render(<Harness />);
  return {
    filter: within(screen.getByRole("group", { name: "재고 필터" })),
    category: within(screen.getByRole("group", { name: "카테고리 필터" })),
    finish: async () => {
      await act(async () => {
        released = true;
        release();
      });
    },
    listQuery: () =>
      JSON.parse(screen.getByTestId("list-query").textContent ?? "null"),
  };
}

it("shows the selected chip before the pending list update commits", async () => {
  const ui = setup();
  fireEvent.click(ui.filter.getByRole("button", { name: "만료" }));

  expect(
    ui.filter
      .getByRole("button", { name: "만료" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(ui.listQuery()).toEqual(DEFAULT_INGREDIENT_LIST_QUERY);
  await act(async () => {});
  expect(
    ui.filter
      .getByRole("button", { name: "만료" })
      .getAttribute("aria-pressed"),
  ).toBe("true");

  await ui.finish();
  expect(ui.listQuery().filter).toBe("EXPIRED");
});

it("preserves rapid filter/category changes and follows a restored URL", async () => {
  const ui = setup();
  fireEvent.click(ui.filter.getByRole("button", { name: "만료" }));
  fireEvent.click(ui.category.getByRole("button", { name: "채소" }));
  expect(ui.listQuery()).toEqual(DEFAULT_INGREDIENT_LIST_QUERY);

  await ui.finish();
  expect(ui.listQuery()).toEqual({
    ...DEFAULT_INGREDIENT_LIST_QUERY,
    filter: "EXPIRED",
    category: "VEGETABLE",
  });

  fireEvent.click(screen.getByRole("button", { name: "Restore URL" }));
  expect(
    ui.filter
      .getByRole("button", { name: "전체" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(
    ui.category
      .getByRole("button", { name: "전체" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
});

it("keeps search input immediate and the existing 300ms debounce", () => {
  vi.useFakeTimers();
  const ui = setup();
  const input = screen.getByRole("searchbox", { name: "재료 검색" });
  fireEvent.change(input, { target: { value: "두부" } });
  expect((input as HTMLInputElement).value).toBe("두부");
  act(() => vi.advanceTimersByTime(299));
  expect(ui.listQuery().keyword).toBeNull();
  act(() => vi.advanceTimersByTime(1));
  expect(ui.listQuery().keyword).toBe("두부");
});
