// @vitest-environment jsdom

import { afterEach, expect, it, vi } from "vitest";

import {
  consumeOAuthLoginStarted,
  markOAuthLoginStarted,
} from "./oauth-return";

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
  document.cookie = "currentRefrigeratorId=; Path=/; Max-Age=0";
});

it("starts OAuth and clears the refrigerator cookie when local storage access is denied", () => {
  document.cookie = "currentRefrigeratorId=old-fridge; Path=/";
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException("Storage blocked", "SecurityError");
  });

  expect(() => markOAuthLoginStarted()).not.toThrow();
  expect(document.cookie).not.toContain("currentRefrigeratorId=");
  expect(consumeOAuthLoginStarted()).toBe(true);
});

it("does not block OAuth when session storage cannot be written", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Storage blocked", "SecurityError");
  });

  expect(() => markOAuthLoginStarted()).not.toThrow();
});
