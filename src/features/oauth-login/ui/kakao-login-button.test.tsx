// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { KakaoLoginButton } from "./kakao-login-button";

const { markOAuthLoginStarted, showAppToast, captureException, logInfo } =
  vi.hoisted(() => ({
    markOAuthLoginStarted: vi.fn(),
    showAppToast: vi.fn(),
    captureException: vi.fn(),
    logInfo: vi.fn(),
  }));

vi.mock("../model/oauth-return", () => ({ markOAuthLoginStarted }));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast }));
vi.mock("@sentry/nextjs", () => ({
  captureException,
  logger: { info: logInfo },
}));

const getRegistration = vi.fn();
const scheduleFrame = vi.fn();

beforeEach(() => {
  getRegistration.mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { serviceWorker: { getRegistration } });
  vi.stubGlobal("requestAnimationFrame", scheduleFrame);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

it("waits for preload disable and blocks 50 repeated login clicks", async () => {
  let finishDisable!: () => void;
  const disable = vi.fn().mockReturnValue(
    new Promise<void>((resolve) => {
      finishDisable = resolve;
    }),
  );
  getRegistration.mockResolvedValue({
    active: { state: "activated" },
    navigationPreload: { disable },
  });
  render(<KakaoLoginButton />);

  const button = screen.getByRole("button", { name: "카카오로 시작하기" });
  for (let attempt = 0; attempt < 50; attempt++) fireEvent.click(button);

  await waitFor(() => expect(disable).toHaveBeenCalledTimes(1));
  expect(button.hasAttribute("disabled")).toBe(true);
  expect(getRegistration).toHaveBeenCalledTimes(1);
  expect(markOAuthLoginStarted).not.toHaveBeenCalled();
  expect(scheduleFrame).not.toHaveBeenCalled();

  await act(async () => finishDisable());

  expect(markOAuthLoginStarted).toHaveBeenCalledTimes(1);
  expect(scheduleFrame).toHaveBeenCalledTimes(1);
});

it("does not start OAuth without a click", async () => {
  render(<KakaoLoginButton />);
  await act(async () => {});

  expect(
    screen
      .getByRole("button", { name: "카카오로 시작하기" })
      .hasAttribute("disabled"),
  ).toBe(false);
  expect(getRegistration).not.toHaveBeenCalled();
  expect(markOAuthLoginStarted).not.toHaveBeenCalled();
  expect(scheduleFrame).not.toHaveBeenCalled();
});

it.each(["lookup", "disable"])(
  "restores the button after five seconds of stalled %s and ignores its late completion",
  async (operation) => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    if (operation === "lookup") {
      getRegistration.mockReturnValueOnce(pending);
    } else {
      getRegistration.mockResolvedValueOnce({
        active: { state: "activated" },
        navigationPreload: { disable: () => pending },
      });
    }

    try {
      render(<KakaoLoginButton />);
      fireEvent.click(
        screen.getByRole("button", { name: "카카오로 시작하기" }),
      );
      await act(() => vi.advanceTimersByTimeAsync(4_999));

      expect(
        screen
          .getByRole("button", { name: "냉장고로 이동 중..." })
          .getAttribute("aria-busy"),
      ).toBe("true");
      expect(markOAuthLoginStarted).not.toHaveBeenCalled();
      expect(scheduleFrame).not.toHaveBeenCalled();
      expect(showAppToast).not.toHaveBeenCalled();

      await act(() => vi.advanceTimersByTimeAsync(1));
      const button = screen.getByRole("button", { name: "카카오로 시작하기" });
      expect(button.hasAttribute("disabled")).toBe(false);
      expect(button.hasAttribute("aria-busy")).toBe(false);
      expect(showAppToast).toHaveBeenCalledExactlyOnceWith({
        message: "잠시 후 다시 시도해 주세요",
        variant: "error",
      });
      expect(captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: "OAuth preparation failed" }),
        {
          tags: { operation: "oauth.prepare" },
          contexts: {
            oauth: {
              stage: operation,
              elapsed_ms: expect.any(Number),
              timed_out: true,
            },
          },
        },
      );
      expect(markOAuthLoginStarted).not.toHaveBeenCalled();
      expect(scheduleFrame).not.toHaveBeenCalled();

      await act(async () => fireEvent.click(button));
      expect(markOAuthLoginStarted).toHaveBeenCalledTimes(1);
      expect(scheduleFrame).toHaveBeenCalledTimes(1);

      await act(async () => finish());
      expect(markOAuthLoginStarted).toHaveBeenCalledTimes(1);
      expect(scheduleFrame).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  },
);

it("shares one five-second deadline across lookup and preload disable", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  const disable = vi.fn(() => new Promise<void>(() => {}));
  getRegistration.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        setTimeout(
          () => resolve({ active: {}, navigationPreload: { disable } }),
          3_000,
        );
      }),
  );
  render(<KakaoLoginButton />);
  fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));

  await act(() => vi.advanceTimersByTimeAsync(4_999));
  expect(disable).toHaveBeenCalledTimes(1);
  expect(
    screen
      .getByRole("button", { name: "냉장고로 이동 중..." })
      .hasAttribute("disabled"),
  ).toBe(true);
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(
    screen
      .getByRole("button", { name: "카카오로 시작하기" })
      .hasAttribute("disabled"),
  ).toBe(false);
  expect(scheduleFrame).not.toHaveBeenCalled();
});

it("handles a preparation rejection that arrives after the timeout", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  let reject!: (error: Error) => void;
  getRegistration.mockReturnValueOnce(
    new Promise((_, rejectPromise) => {
      reject = rejectPromise;
    }),
  );
  render(<KakaoLoginButton />);
  fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));
  await act(() => vi.advanceTimersByTimeAsync(5_000));
  await act(async () => reject(new Error("Late lookup failure")));

  expect(showAppToast).toHaveBeenCalledTimes(1);
  expect(captureException).toHaveBeenCalledTimes(1);
  expect(scheduleFrame).not.toHaveBeenCalled();
});

it.each([undefined, { active: { state: "activated" } }])(
  "continues when registration or preload is absent: %j",
  async (registration) => {
    getRegistration.mockResolvedValue(registration);
    render(<KakaoLoginButton />);

    fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));

    await waitFor(() => expect(scheduleFrame).toHaveBeenCalledTimes(1));
    expect(showAppToast).not.toHaveBeenCalled();
  },
);

it("continues login without calling disable when the first worker has no active worker", async () => {
  const disable = vi
    .fn()
    .mockRejectedValue(
      new DOMException("No active worker", "InvalidStateError"),
    );
  getRegistration.mockResolvedValue({
    active: null,
    installing: { state: "installing" },
    navigationPreload: { disable },
  });
  render(<KakaoLoginButton />);

  fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));

  await waitFor(() => expect(scheduleFrame).toHaveBeenCalledTimes(1));
  expect(disable).not.toHaveBeenCalled();
  expect(markOAuthLoginStarted).toHaveBeenCalledTimes(1);
  expect(showAppToast).not.toHaveBeenCalled();
});

it("continues when service workers are unsupported", async () => {
  vi.stubGlobal("navigator", {});
  render(<KakaoLoginButton />);

  fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));

  await waitFor(() => expect(scheduleFrame).toHaveBeenCalledTimes(1));
  expect(showAppToast).not.toHaveBeenCalled();
});

it("restores the login button when returning through the back-forward cache", async () => {
  render(<KakaoLoginButton />);
  fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));
  await waitFor(() => expect(scheduleFrame).toHaveBeenCalledTimes(1));

  fireEvent(window, new PageTransitionEvent("pageshow", { persisted: true }));
  const button = screen.getByRole("button", { name: "카카오로 시작하기" });
  expect(button.hasAttribute("disabled")).toBe(false);
  expect(logInfo).toHaveBeenCalledWith("oauth.pageshow", {
    persisted: true,
    pending: true,
  });
  fireEvent.click(button);
  await waitFor(() => expect(scheduleFrame).toHaveBeenCalledTimes(2));
});

it.each(["lookup", "disable"])(
  "stops navigation and allows retry after %s failure",
  async (failure) => {
    const error = new DOMException(
      "Service worker unavailable",
      "SecurityError",
    );
    if (failure === "lookup") {
      getRegistration.mockRejectedValueOnce(error);
    } else {
      getRegistration.mockResolvedValueOnce({
        active: { state: "activated" },
        navigationPreload: { disable: vi.fn().mockRejectedValue(error) },
      });
    }
    render(<KakaoLoginButton />);

    fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));

    await waitFor(() =>
      expect(showAppToast).toHaveBeenCalledWith({
        message: "잠시 후 다시 시도해 주세요",
        variant: "error",
      }),
    );
    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "OAuth preparation failed" }),
      {
        tags: { operation: "oauth.prepare" },
        contexts: {
          oauth: {
            stage: failure,
            elapsed_ms: expect.any(Number),
            timed_out: false,
          },
        },
      },
    );
    const button = screen.getByRole("button", { name: "카카오로 시작하기" });
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(markOAuthLoginStarted).not.toHaveBeenCalled();
    expect(scheduleFrame).not.toHaveBeenCalled();

    fireEvent.click(button);
    await waitFor(() => expect(scheduleFrame).toHaveBeenCalledTimes(1));
  },
);

it("records click, preparation and navigation without URL or storage values", async () => {
  render(<KakaoLoginButton />);
  fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));
  await waitFor(() => expect(scheduleFrame).toHaveBeenCalledTimes(1));

  const actualWindow = window;
  const assign = vi.fn();
  try {
    vi.stubGlobal("window", { location: { assign } });
    scheduleFrame.mock.calls[0][0]();
    scheduleFrame.mock.calls[1][0]();
  } finally {
    vi.stubGlobal("window", actualWindow);
  }

  expect(logInfo.mock.calls).toEqual([
    ["oauth.click", { trusted: false }],
    ["oauth.prepared", { elapsed_ms: expect.any(Number) }],
    ["oauth.navigate", { elapsed_ms: expect.any(Number) }],
  ]);
  expect(assign).toHaveBeenCalledExactlyOnceWith("/api/v1/auth/oauth/kakao");
});

it("does not report the original preparation error message", async () => {
  getRegistration.mockRejectedValueOnce(new Error("SECRET_COOKIE_TOKEN_URL"));
  render(<KakaoLoginButton />);
  fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));
  await waitFor(() => expect(captureException).toHaveBeenCalledTimes(1));

  expect(captureException.mock.calls[0][0].message).toBe(
    "OAuth preparation failed",
  );
  expect(JSON.stringify(captureException.mock.calls)).not.toContain(
    "SECRET_COOKIE_TOKEN_URL",
  );
  expect(JSON.stringify(logInfo.mock.calls)).not.toContain(
    "SECRET_COOKIE_TOKEN_URL",
  );
});

it("records foreground resume with the current pending state and removes listeners on unmount", async () => {
  const view = render(<KakaoLoginButton />);
  fireEvent(document, new Event("visibilitychange"));
  expect(logInfo).toHaveBeenLastCalledWith("oauth.resume", { pending: false });

  fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));
  await waitFor(() => expect(scheduleFrame).toHaveBeenCalledTimes(1));
  fireEvent(document, new Event("visibilitychange"));
  expect(logInfo).toHaveBeenLastCalledWith("oauth.resume", { pending: true });

  view.unmount();
  const calls = logInfo.mock.calls.length;
  fireEvent(document, new Event("visibilitychange"));
  fireEvent(window, new PageTransitionEvent("pageshow", { persisted: true }));
  expect(logInfo).toHaveBeenCalledTimes(calls);
});
