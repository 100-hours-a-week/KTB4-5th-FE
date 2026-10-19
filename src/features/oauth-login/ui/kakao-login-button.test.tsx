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

const { markOAuthLoginStarted, showAppToast } = vi.hoisted(() => ({
  markOAuthLoginStarted: vi.fn(),
  showAppToast: vi.fn(),
}));

vi.mock("../model/oauth-return", () => ({ markOAuthLoginStarted }));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast }));

const getRegistration = vi.fn();
const scheduleFrame = vi.fn();

beforeEach(() => {
  getRegistration.mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { serviceWorker: { getRegistration } });
  vi.stubGlobal("requestAnimationFrame", scheduleFrame);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

it("waits for preload disable before scheduling OAuth navigation and blocks repeated clicks", async () => {
  let finishDisable!: () => void;
  const disable = vi.fn().mockReturnValue(
    new Promise<void>((resolve) => {
      finishDisable = resolve;
    }),
  );
  getRegistration.mockResolvedValue({ navigationPreload: { disable } });
  render(<KakaoLoginButton />);

  const button = screen.getByRole("button", { name: "카카오로 시작하기" });
  fireEvent.click(button);
  fireEvent.click(button);

  await waitFor(() => expect(disable).toHaveBeenCalledTimes(1));
  expect(button.hasAttribute("disabled")).toBe(true);
  expect(getRegistration).toHaveBeenCalledTimes(1);
  expect(markOAuthLoginStarted).not.toHaveBeenCalled();
  expect(scheduleFrame).not.toHaveBeenCalled();

  await act(async () => finishDisable());

  expect(markOAuthLoginStarted).toHaveBeenCalledTimes(1);
  expect(scheduleFrame).toHaveBeenCalledTimes(1);
});

it.each([undefined, {}])(
  "continues when registration or preload is absent: %j",
  async (registration) => {
    getRegistration.mockResolvedValue(registration);
    render(<KakaoLoginButton />);

    fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));

    await waitFor(() => expect(scheduleFrame).toHaveBeenCalledTimes(1));
    expect(showAppToast).not.toHaveBeenCalled();
  },
);

it("continues when service workers are unsupported", async () => {
  vi.stubGlobal("navigator", {});
  render(<KakaoLoginButton />);

  fireEvent.click(screen.getByRole("button", { name: "카카오로 시작하기" }));

  await waitFor(() => expect(scheduleFrame).toHaveBeenCalledTimes(1));
  expect(showAppToast).not.toHaveBeenCalled();
});

it.each(["lookup", "disable"])(
  "stops navigation and allows retry after %s failure",
  async (failure) => {
    const error = new Error("Service worker unavailable");
    if (failure === "lookup") {
      getRegistration.mockRejectedValueOnce(error);
    } else {
      getRegistration.mockResolvedValueOnce({
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
    const button = screen.getByRole("button", { name: "카카오로 시작하기" });
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(markOAuthLoginStarted).not.toHaveBeenCalled();
    expect(scheduleFrame).not.toHaveBeenCalled();

    fireEvent.click(button);
    await waitFor(() => expect(scheduleFrame).toHaveBeenCalledTimes(1));
  },
);
