// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { refrigeratorQueries } from "../api/refrigerator.queries";
import {
  clearCurrentRefrigeratorId,
  setCurrentRefrigeratorId,
  useCurrentRefrigeratorId,
} from "./current-refrigerator";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  document.cookie = "currentRefrigeratorId=; Path=/; Max-Age=0";
});

it("removes the legacy value when setting or clearing the refrigerator", () => {
  localStorage.setItem("dameokja.currentRefrigeratorId", "old");
  setCurrentRefrigeratorId("new");
  expect(document.cookie).toContain("currentRefrigeratorId=new");
  expect(localStorage.getItem("dameokja.currentRefrigeratorId")).toBeNull();

  localStorage.setItem("dameokja.currentRefrigeratorId", "old");
  clearCurrentRefrigeratorId();
  expect(document.cookie).not.toContain("currentRefrigeratorId=");
  expect(localStorage.getItem("dameokja.currentRefrigeratorId")).toBeNull();
});

it("recovers the refrigerator from the server cache when local storage is blocked", async () => {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException("Storage blocked", "SecurityError");
  });
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  });
  client.setQueryData(refrigeratorQueries.current().queryKey, [
    {
      refrigeratorId: "server-fridge",
      name: "개인 냉장고",
      capacity: 1500,
      expiredCount: 0,
    },
  ]);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(useCurrentRefrigeratorId, { wrapper });
  await waitFor(() => expect(result.current).toBe("server-fridge"));
  expect(document.cookie).toContain("currentRefrigeratorId=server-fridge");
});
