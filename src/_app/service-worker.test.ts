import type { SerwistOptions } from "serwist";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  config: undefined as SerwistOptions | undefined,
}));
vi.mock("serwist", () => ({
  Serwist: class {
    constructor(config: SerwistOptions) {
      state.config = config;
    }
    addEventListeners() {}
  },
  NetworkOnly: class {
    constructor(readonly options: unknown) {}
  },
  disableNavigationPreload: vi.fn(),
}));
vi.mock("@serwist/turbopack/worker", () => ({
  defaultCache: [{ matcher: "static-assets", handler: {} }],
}));

type WorkerListener = (event: {
  waitUntil: (task: Promise<unknown>) => void;
}) => void;
const listeners = new Map<string, WorkerListener>();

beforeEach(async () => {
  vi.resetModules();
  listeners.clear();
  vi.stubGlobal("self", {
    __SW_MANIFEST: [],
    addEventListener: (type: string, listener: WorkerListener) =>
      listeners.set(type, listener),
  });
  await import("../../app/sw");
});
afterEach(() => vi.unstubAllGlobals());

it.each([
  ["/api/v1/users/me", "cors", {}],
  ["/api/v1/refrigerators/1/ingredients", "cors", {}],
  ["/api/v2/refrigerators/1/notifications/stream", "cors", {}],
  ["/refrigerators/1/expired-ingredients", "cors", {}],
  ["/me/profile", "navigate", {}],
  ["/refrigerator", "cors", { RSC: "1" }],
  ["/_next/data/build/me.json", "cors", {}],
] as const)("bypasses runtime caches for %s", (path, mode, headers) => {
  const rule = state.config!.runtimeCaching![0];
  expect(typeof rule.matcher).toBe("function");
  if (typeof rule.matcher !== "function") throw new Error("Missing matcher");
  expect(
    rule.matcher({
      sameOrigin: true,
      url: new URL(path, "https://dameokja.test"),
      request: { mode, headers: new Headers(headers) } as Request,
      event: {} as ExtendableEvent,
    }),
  ).toBe(true);
  expect(rule.handler).toMatchObject({
    options: { fetchOptions: { cache: "no-store" } },
  });
});

it("keeps static runtime caching and the offline fallback", () => {
  const rule = state.config!.runtimeCaching![0];
  if (typeof rule.matcher !== "function") throw new Error("Missing matcher");
  expect(
    rule.matcher({
      sameOrigin: true,
      url: new URL("https://dameokja.test/_next/static/app.js"),
      request: new Request("https://dameokja.test/_next/static/app.js"),
      event: {} as ExtendableEvent,
    }),
  ).toBe(false);
  expect(state.config!.runtimeCaching![1].matcher).toBe("static-assets");
  expect(state.config!.fallbacks?.entries[0].url).toBe("/~offline");
});

it("removes legacy API and page caches on activation without deleting static assets", async () => {
  const stored = new Set([
    "apis",
    "pages",
    "pages-rsc",
    "pages-rsc-prefetch",
    "next-data",
    "others",
    "static-image-assets",
    "serwist-precache",
  ]);
  vi.stubGlobal("caches", {
    delete: vi.fn(async (name: string) => stored.delete(name)),
  });
  let cleanup!: Promise<unknown>;
  listeners.get("activate")!({
    waitUntil: (task) => {
      cleanup = task;
    },
  });
  await cleanup;
  expect([...stored]).toEqual(["static-image-assets", "serwist-precache"]);
});
