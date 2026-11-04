// @vitest-environment jsdom

import { afterEach, beforeEach, expect, it, vi } from "vitest";

import {
  installBrowserBackGuard,
  registerAppBackGuard,
  runAppBackGuard,
} from "./app-back-guard";

let stop: () => void;
let unregister: (() => void) | undefined;
let nativeReplace: History["replaceState"];
let first: unknown;
let second: unknown;
let current: unknown;
const go = vi.fn();
const routerPop = vi.fn();
let proceed: () => void;
const guard = vi.fn((next: () => void) => {
  proceed = next;
  return true;
});

function pop(state: unknown) {
  nativeReplace.call(window.history, state, "");
  window.dispatchEvent(new PopStateEvent("popstate", { state }));
}

beforeEach(() => {
  nativeReplace = window.history.replaceState;
  nativeReplace.call(window.history, { __NA: true, tree: "keep" }, "", "/");
  vi.spyOn(window.history, "go").mockImplementation(go);
  stop = installBrowserBackGuard();
  first = window.history.state;
  window.history.pushState({ __NA: true }, "", "/detail");
  second = window.history.state;
  window.history.pushState({ __NA: true }, "", "/edit");
  current = window.history.state;
  window.addEventListener("popstate", routerPop);
});

afterEach(() => {
  unregister?.();
  unregister = undefined;
  stop();
  window.removeEventListener("popstate", routerPop);
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it("restores the form before showing confirmation and only leaves after approval", () => {
  unregister = registerAppBackGuard(guard);

  pop(second);
  expect(go).toHaveBeenLastCalledWith(1);
  expect(routerPop).not.toHaveBeenCalled();
  expect(guard).not.toHaveBeenCalled();

  pop(current);
  expect(guard).toHaveBeenCalledTimes(1);
  expect(routerPop).not.toHaveBeenCalled();
  proceed();
  expect(go).toHaveBeenLastCalledWith(-1);
  pop(second);
  expect(routerPop).toHaveBeenCalledTimes(1);
  expect(guard).toHaveBeenCalledTimes(1);
});

it("keeps guarding after cancellation, including multi-entry back navigation", () => {
  unregister = registerAppBackGuard(guard);
  pop(second);
  pop(current);
  // 계속 작성은 proceed를 실행하지 않는다.
  pop(first);
  expect(go).toHaveBeenLastCalledWith(2);
  pop(current);
  expect(guard).toHaveBeenCalledTimes(2);
  proceed();
  expect(go).toHaveBeenLastCalledWith(-2);
});

it("allows the header's confirmed back without asking again on popstate", () => {
  unregister = registerAppBackGuard(guard);
  const back = vi.fn();
  expect(runAppBackGuard(back)).toBe(true);
  proceed();
  expect(back).toHaveBeenCalledTimes(1);
  pop(second);
  expect(routerPop).toHaveBeenCalledTimes(1);
  expect(guard).toHaveBeenCalledTimes(1);
});

it("lets clean forms and a removed guard navigate normally", () => {
  unregister = registerAppBackGuard(guard);
  unregister();
  pop(second);
  expect(go).not.toHaveBeenCalled();
  expect(routerPop).toHaveBeenCalledTimes(1);
});

it("allows a guard to decline interception without a restore loop", () => {
  unregister = registerAppBackGuard(() => false);
  pop(second);
  pop(current);
  expect(go).toHaveBeenLastCalledWith(-1);
  pop(second);
  expect(routerPop).toHaveBeenCalledTimes(1);
  expect(go).toHaveBeenCalledTimes(2);
});

it("keeps the history index through replaceState and preserves Next.js state", () => {
  window.history.replaceState({ __NA: true, tree: "updated" }, "", "/edit?q=1");
  expect(window.history.state).toEqual({
    ...(current as object),
    tree: "updated",
  });
  unregister = registerAppBackGuard(guard);
  pop(second);
  expect(go).toHaveBeenLastCalledWith(1);
});

it("protects document departures only while a form is guarded", () => {
  const clean = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(clean);
  expect(clean.defaultPrevented).toBe(false);

  unregister = registerAppBackGuard(guard);
  const dirty = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(dirty);
  expect(dirty.defaultPrevented).toBe(true);
  unregister();
  const saved = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(saved);
  expect(saved.defaultPrevented).toBe(false);
});
