// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { SerwistProvider } from "./serwist-provider";

const { register, captureException, setContext } = vi.hoisted(() => ({
  register: vi.fn(),
  captureException: vi.fn(),
  setContext: vi.fn(),
}));

vi.mock("@serwist/turbopack/react", () => ({
  SerwistProvider: ({ children }: { children: ReactNode }) => children,
  useSerwist: () => ({ serwist: { register } }),
}));
vi.mock("@sentry/nextjs", () => ({
  withScope: (callback: (scope: { setContext: typeof setContext }) => void) =>
    callback({ setContext }),
  captureException,
}));
vi.mock("../../mocks/enabled", () => ({ isMswEnabled: () => false }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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
