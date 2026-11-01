// @vitest-environment jsdom
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useRecommendations } from "./use-recommendations";

const mocks = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn() }));
vi.mock("@/entities/recommendation", () => ({
  recommendationQueries: {
    list: (id: string) => ({
      queryKey: ["recommendations", id],
      queryFn: () => mocks.get(id),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  },
  createRecommendationJob: (...args: unknown[]) => mocks.create(...args),
  switchToNewRecommendation: vi.fn(),
}));
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.clearAllMocks();
  mocks.create.mockResolvedValue({ jobId: "rjob_88", status: "QUEUED" });
});
afterEach(() => {
  cleanup();
  client.clear();
  focusManager.setFocused(undefined);
  onlineManager.setOnline(true);
});
function wrapper({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </StrictMode>
  );
}
it.each(["READY", "STALE", "GENERATING", "EMPTY", "LIMIT_REACHED"])(
  "%s never starts a job on entry and keeps the displayed response",
  async (status) => {
    const data = { status, recipes: [{ recipeId: "51" }] };
    mocks.get.mockResolvedValue(data);
    const hook = renderHook(() => useRecommendations("1"), { wrapper });
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
      onlineManager.setOnline(false);
      onlineManager.setOnline(true);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mocks.create).not.toHaveBeenCalled();
    if (status !== "GENERATING") expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(hook.result.current.data).toEqual(data);
  },
);
it("GETs again on entry, and isolates generation state by refrigerator", async () => {
  mocks.get.mockImplementation(async (id: string) => ({
    status: id === "1" ? "STALE" : "READY",
    recipes: [],
  }));
  const hook = renderHook(({ id }) => useRecommendations(id), {
    wrapper,
    initialProps: { id: "1" },
  });
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
  act(() => hook.result.current.regenerate());
  await waitFor(() => expect(hook.result.current.job.isSuccess).toBe(true));
  expect(mocks.get).toHaveBeenCalledTimes(2);
  hook.rerender({ id: "2" });
  await waitFor(() => expect(hook.result.current.data?.status).toBe("READY"));
  expect(hook.result.current.job.isIdle).toBe(true);
  hook.unmount();
  renderHook(() => useRecommendations("2"), { wrapper });
  await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(4));
  expect(mocks.create).toHaveBeenCalledTimes(1);
});
