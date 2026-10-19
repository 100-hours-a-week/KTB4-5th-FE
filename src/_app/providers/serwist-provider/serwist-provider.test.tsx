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
  getRegistration.mockResolvedValue({ navigationPreload: { disable } });
  register.mockReturnValue(new Promise(() => {}));

  render(<SerwistProvider>login</SerwistProvider>);

  await waitFor(() => expect(disable).toHaveBeenCalledTimes(1));
  expect(register).toHaveBeenCalledTimes(1);
});

it("disables preload on a newly returned registration", async () => {
  const disable = vi.fn().mockResolvedValue(undefined);
  register.mockResolvedValue({ navigationPreload: { disable } });

  render(<SerwistProvider>login</SerwistProvider>);

  await waitFor(() => expect(disable).toHaveBeenCalledTimes(1));
  expect(captureException).not.toHaveBeenCalled();
});

it("supports registrations without navigation preload", async () => {
  getRegistration.mockResolvedValue({});
  register.mockResolvedValue({});

  render(<SerwistProvider>login</SerwistProvider>);

  await waitFor(() => expect(register).toHaveBeenCalledTimes(1));
  expect(captureException).not.toHaveBeenCalled();
});

it("records preload failures without preventing registration", async () => {
  const error = new DOMException("Preload blocked", "InvalidStateError");
  getRegistration.mockResolvedValue({
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
