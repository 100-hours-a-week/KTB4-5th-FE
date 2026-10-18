// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ImageAnalysisListItem } from "@/entities/image";

import { AnalysisTaskBanner } from "./analysis-task-banner";

const state = vi.hoisted(() => ({
  data: { analyses: [] as ImageAnalysisListItem[] },
  pathname: "/",
  refetch: vi.fn(),
  registered: {} as Record<string, string[]>,
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: state.data, refetch: state.refetch }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@lineiconshq/free-icons", () => ({ XmarkOutlined: {} }));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));
vi.mock("@/entities/image", () => ({
  useDeleteImageAnalysis: () => ({ mutate: vi.fn(), isPending: false }),
  imageAnalysisQueries: { list: () => ({}) },
  useRegisteredAnalyses: (
    select: (s: { idsBySession: Record<string, string[]> }) => unknown,
  ) => select({ idsBySession: state.registered }),
}));
vi.mock("@/entities/notification", () => ({
  useNotificationSessionScope: () => "session",
}));
vi.mock("@/shared/ui/app-link", () => ({
  AppLink: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("./analysis-banner", () => ({
  AnalysisBanner: (props: object) => <output>{JSON.stringify(props)}</output>,
}));

const job: ImageAnalysisListItem = {
  analysisId: "job-1",
  status: "PROCESSING",
  submittedAt: "2026-10-16T10:00:00Z",
  expiresAt: null,
  pollAfterMs: 1000,
  totalImageCount: 3,
  completedImageCount: 1,
  failedImageCount: 1,
  images: [],
  error: null,
};
beforeEach(() => {
  state.data = { analyses: [] };
  state.pathname = "/";
  state.registered = {};
  state.refetch.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("conditionally renders real progress, counting failed images as processed, and links to the matching result", () => {
  const { rerender, container } = render(<AnalysisTaskBanner />);
  expect(container.textContent).toBe("");
  state.data = { analyses: [job] };
  rerender(<AnalysisTaskBanner />);
  expect(screen.getByRole("link").getAttribute("href")).toBe(
    "/refrigerator/register/receipt/result?analysisId=job-1",
  );
  expect(JSON.parse(screen.getByRole("status").textContent ?? "{}")).toEqual({
    status: "processing",
    processedCount: 2,
    totalCount: 3,
    closable: false,
  });
  state.registered = { session: ["job-1"] };
  rerender(<AnalysisTaskBanner />);
  expect(container.textContent).toBe("");
});

it.each([
  { status: "COMPLETED", bannerStatus: "completed" },
  { status: "PARTIALLY_COMPLETED", bannerStatus: "partial" },
  { status: "FAILED", bannerStatus: "failed" },
] as const)(
  "renders the $status state and suppresses the duplicate banner on result pages",
  ({ status, bannerStatus }) => {
    state.data = { analyses: [{ ...job, status }] };
    const { rerender, container } = render(<AnalysisTaskBanner />);
    expect(
      JSON.parse(screen.getByRole("status").textContent ?? "{}").status,
    ).toBe(bannerStatus);
    state.pathname = "/refrigerator/register/receipt/result";
    rerender(<AnalysisTaskBanner />);
    expect(container.textContent).toBe("");
  },
);

it("removes the banner at expiry even if no expiry SSE arrives", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-16T12:00:00Z"));
  state.data = {
    analyses: [
      { ...job, status: "COMPLETED", expiresAt: "2026-10-16T12:00:01Z" },
    ],
  };
  const { container } = render(<AnalysisTaskBanner />);
  expect(screen.getByRole("link")).toBeTruthy();
  act(() => vi.advanceTimersByTime(1000));
  expect(container.textContent).toBe("");
  expect(state.refetch).toHaveBeenCalledTimes(1);
});
