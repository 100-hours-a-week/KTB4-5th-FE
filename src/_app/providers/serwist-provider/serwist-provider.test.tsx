// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { SerwistProvider } from "./serwist-provider";

const { register, captureException, setContext } = vi.hoisted(() => ({
  register: vi.fn(),
  captureException: vi.fn(),
  setContext: vi.fn(),
}));

const getRegistration = vi.fn();

vi.mock("@serwist/turbopack/react", () => ({
  SerwistProvider: ({ children }: { children: ReactNode }) => children,
  useSerwist: () => ({ serwist: { register } }),
}));
vi.mock("@sentry/nextjs", () => ({
  withScope: (callback: (scope: { setContext: typeof setContext }) => void) =>
    callback({ setContext }),
  captureException,
}));
vi.mock("../../mocks/enabled", () => ({ isMswActive: () => false }));

beforeEach(() => {
  getRegistration.mockResolvedValue(undefined);
  register.mockResolvedValue(undefined);
  vi.stubGlobal("navigator", {
    userAgent: "test-browser",
    serviceWorker: { getRegistration },
  });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

it("disables preload on the existing registration while registration is pending", async () => {
  const disable = vi.fn().mockResolvedValue(undefined);
  getRegistration.mockResolvedValue({
    active: { state: "activated" },
    navigationPreload: { disable },
  });
  register.mockReturnValue(new Promise(() => {}));

  render(<SerwistProvider>login</SerwistProvider>);

  await waitFor(() => expect(disable).toHaveBeenCalledTimes(1));
  expect(register).toHaveBeenCalledTimes(1);
});

it("disables preload on a newly returned registration", async () => {
  const disable = vi.fn().mockResolvedValue(undefined);
  register.mockResolvedValue({
    active: { state: "activated" },
    navigationPreload: { disable },
  });

  render(<SerwistProvider>login</SerwistProvider>);

  await waitFor(() => expect(disable).toHaveBeenCalledTimes(1));
  expect(captureException).not.toHaveBeenCalled();
});

it("supports registrations without navigation preload", async () => {
  getRegistration.mockResolvedValue({ active: { state: "activated" } });
  register.mockResolvedValue({ active: { state: "activated" } });

  render(<SerwistProvider>login</SerwistProvider>);

  await waitFor(() => expect(register).toHaveBeenCalledTimes(1));
  expect(captureException).not.toHaveBeenCalled();
});

it("skips preload disable while the first worker is installing without an active worker", async () => {
  const disable = vi
    .fn()
    .mockRejectedValue(
      new DOMException("No active worker", "InvalidStateError"),
    );
  const registration = {
    active: null,
    installing: { state: "installing" },
    navigationPreload: { disable },
  };
  getRegistration.mockResolvedValue(registration);
  register.mockResolvedValue(registration);

  render(<SerwistProvider>login</SerwistProvider>);

  await waitFor(() => expect(getRegistration).toHaveResolvedWith(registration));
  expect(register).toHaveResolvedWith(registration);
  expect(disable).not.toHaveBeenCalled();
  expect(captureException).not.toHaveBeenCalled();
});

it("records preload failures without preventing registration", async () => {
  const error = new DOMException("Preload blocked", "InvalidStateError");
  getRegistration.mockResolvedValue({
    active: { state: "activated" },
    navigationPreload: { disable: vi.fn().mockRejectedValue(error) },
  });

  render(<SerwistProvider>login</SerwistProvider>);

  await waitFor(() => expect(captureException).toHaveBeenCalledWith(error));
  expect(register).toHaveBeenCalledTimes(1);
});

it("handles registration rejection and records its cause", async () => {
  const error = new DOMException("Registration blocked", "NotAllowedError");
  register.mockRejectedValueOnce(error);

  render(<SerwistProvider>login</SerwistProvider>);

  await waitFor(() => expect(captureException).toHaveBeenCalledWith(error));
  expect(setContext).toHaveBeenCalledWith("service_worker_registration", {
    swUrl: "/serwist/sw.js",
    errorName: "NotAllowedError",
    errorMessage: "Registration blocked",
    userAgent: navigator.userAgent,
  });
  expect(register).toHaveBeenCalledTimes(1);
});
