// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { refreshSession } from "@/shared/api";

import { CsrfBootstrapProvider } from "../csrf-bootstrap-provider";
import { SessionGate } from "./session-gate";

const { expireSession } = vi.hoisted(() => ({ expireSession: vi.fn() }));
vi.mock("@/_app/providers/session-expiry", () => ({ expireSession }));
vi.mock("next/image", () => ({ default: () => null }));

beforeEach(() => {
  vi.useFakeTimers();
  // Native AbortSignal.timeout does not use Vitest's clock.
  vi.spyOn(AbortSignal, "timeout").mockImplementation((milliseconds) => {
    const controller = new AbortController();
    setTimeout(
      () => controller.abort(new DOMException("Timed out", "TimeoutError")),
      milliseconds,
    );
    return controller.signal;
  });
  document.cookie = "XSRF-TOKEN=; Max-Age=0";
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function pendingFetch(_input: string, init: RequestInit) {
  const signal = init.signal!;
  return new Promise<Response>((_resolve, reject) => {
    signal.throwIfAborted();
    signal.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    });
  });
}

function renderGate(needsRenewal = true) {
  const client = new QueryClient();
  client.setQueryData(["existing-data"], "keep");
  render(
    <QueryClientProvider client={client}>
      <SessionGate needsRenewal={needsRenewal}>protected content</SessionGate>
    </QueryClientProvider>,
  );
  return client;
}

it.each([
  ["csrf", 5_000],
  ["token-renewals", 15_000],
] as const)(
  "shows a retryable error when %s times out",
  async (endpoint, timeout) => {
    if (endpoint === "token-renewals") document.cookie = "XSRF-TOKEN=test";
    const fetchMock = vi.fn(pendingFetch);
    vi.stubGlobal("fetch", fetchMock);
    const client = renderGate();

    await act(() => vi.advanceTimersByTimeAsync(timeout - 1));
    expect(screen.getByRole("status")).toBeTruthy();
    await act(() => vi.advanceTimersByTimeAsync(1));

    expect(screen.getByRole("alert").textContent).toContain(
      "로그인 상태를 확인하지 못했어요",
    );
    expect(screen.queryByText("protected content")).toBeNull();
    expect(expireSession).not.toHaveBeenCalled();
    expect(client.getQueryData(["existing-data"])).toBe("keep");
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/v1/auth/${endpoint}`);
    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(true);

    fetchMock.mockImplementation(async () => {
      document.cookie = "XSRF-TOKEN=retry-token";
      return new Response(null, { status: 204 });
    });
    await act(async () => {
      const button = screen.getByRole("button", { name: "다시 시도" });
      for (let i = 0; i < 10; i++) fireEvent.click(button);
    });

    expect(screen.getByText("protected content")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(endpoint === "csrf" ? 3 : 2);
  },
);

it("includes CSRF issuance time in the 15-second renewal deadline", async () => {
  const fetchMock = vi.fn((input: string, init: RequestInit) => {
    if (input.endsWith("/csrf")) {
      return new Promise<Response>((resolve) => {
        setTimeout(() => {
          document.cookie = "XSRF-TOKEN=issued";
          resolve(new Response(null, { status: 204 }));
        }, 4_000);
      });
    }
    return pendingFetch(input, init);
  });
  vi.stubGlobal("fetch", fetchMock);
  renderGate();

  await act(() => vi.advanceTimersByTimeAsync(14_999));
  expect(screen.getByRole("status")).toBeTruthy();
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(screen.getByRole("alert")).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it.each(["network", "503"])(
  "does not render protected content after a %s failure",
  async (failure) => {
    document.cookie = "XSRF-TOKEN=test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (failure === "network") throw new TypeError("Failed to fetch");
        return new Response(null, { status: 503 });
      }),
    );
    renderGate();
    await act(async () => {});

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByText("protected content")).toBeNull();
    expect(expireSession).not.toHaveBeenCalled();
  },
);

it("redirects only when renewal is rejected with 401", async () => {
  document.cookie = "XSRF-TOKEN=test";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 401 })),
  );
  renderGate();
  await act(async () => {});

  expect(expireSession).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("protected content")).toBeNull();
});

it("renders children immediately when renewal is unnecessary", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  renderGate(false);
  expect(screen.getByText("protected content")).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("blocks retries for 60 seconds after five failures", async () => {
  document.cookie = "XSRF-TOKEN=test";
  const fetchMock = vi.fn(async () => new Response(null, { status: 503 }));
  vi.stubGlobal("fetch", fetchMock);
  renderGate();
  await act(async () => {});
  for (let i = 0; i < 4; i++) {
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "다시 시도" })),
    );
  }
  expect(fetchMock).toHaveBeenCalledTimes(5);
  expect(
    screen
      .getByRole("button", { name: "60초 후 다시 시도" })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(screen.getByText("잠시 후 다시 시도해 주세요")).toBeTruthy();

  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(
    screen.getByRole("button", { name: "다시 시도" }).hasAttribute("disabled"),
  ).toBe(false);
});

it("handles a background CSRF timeout without an unhandled rejection", async () => {
  vi.stubGlobal("fetch", vi.fn(pendingFetch));
  render(<CsrfBootstrapProvider />);
  await act(() => vi.advanceTimersByTimeAsync(5_000));
  expect(expireSession).not.toHaveBeenCalled();
});

it("shares one renewal and releases it for a new attempt after timeout", async () => {
  document.cookie = "XSRF-TOKEN=test";
  const fetchMock = vi.fn(pendingFetch);
  vi.stubGlobal("fetch", fetchMock);
  const first = refreshSession();
  expect(refreshSession()).toBe(first);

  await vi.advanceTimersByTimeAsync(15_000);
  expect(await first).toBe("failed");
  expect(fetchMock).toHaveBeenCalledTimes(1);

  fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
  expect(await refreshSession()).toBe("renewed");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
