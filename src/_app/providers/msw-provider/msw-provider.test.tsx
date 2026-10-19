// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { MswProvider } from "./msw-provider";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/login" } }));

vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));
vi.mock("../../mocks/enabled", () => ({
  isMswEnabled: () => true,
  isMswActive: () => true,
}));
vi.mock("../../mocks/browser", () => ({
  worker: { start: () => new Promise(() => {}) },
}));
vi.mock("@/shared/ui/async-view-state", () => ({
  AsyncViewState: ({ title }: { title: string }) => <div>{title}</div>,
}));

afterEach(cleanup);

it.each([
  ["/login", true],
  ["/login/local", true],
  ["/me", false],
])("renders %s before MSW is ready: %s", (path, rendersPage) => {
  pathname.current = path;
  render(<MswProvider>page</MswProvider>);

  expect(screen.queryByText("page") !== null).toBe(rendersPage);
  expect(screen.queryByText("화면을 불러오는 중입니다") !== null).toBe(
    !rendersPage,
  );
});
