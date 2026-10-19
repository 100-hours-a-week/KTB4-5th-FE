import { afterEach, expect, it, vi } from "vitest";

import { isMswEnabled } from "./enabled";

afterEach(() => vi.unstubAllEnvs());

it.each([
  ["development", undefined, "true", true],
  ["development", undefined, undefined, false],
  ["production", "dev", "true", true],
  ["production", "production", "true", false],
  ["development", "production", "true", false],
  ["production", undefined, "true", false],
])(
  "enables MSW only for opted-in local or dev builds",
  (nodeEnv, appEnv, msw, expected) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENVIRONMENT", appEnv);
    vi.stubEnv("NEXT_PUBLIC_MSW", msw);

    expect(isMswEnabled()).toBe(expected);
  },
);
