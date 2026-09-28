import { afterEach, describe, expect, it, vi } from "vitest";

import { getSentryOptions } from "./sentry-options";

afterEach(() => vi.unstubAllEnvs());

describe("Sentry 환경 설정", () => {
  it("DSN이 없으면 오류 전송을 비활성화한다", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    expect(getSentryOptions().enabled).toBe(false);
  });

  it("운영 환경과 release를 보존하고 추적을 10%로 제한한다", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://public@example.com/1");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENVIRONMENT", "production");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_RELEASE", "commit-sha");
    expect(getSentryOptions()).toMatchObject({
      enabled: true,
      environment: "production",
      release: "commit-sha",
      tracesSampleRate: 0.1,
    });
  });

  it("개발 추적은 100%로 수집하고 사용자·요청 원문 수집은 끈다", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENVIRONMENT", "dev");
    expect(getSentryOptions()).toMatchObject({
      tracesSampleRate: 1,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
        stackFrameVariables: false,
      },
    });
  });

  it("공개 환경값이 비어 있으면 Node 환경을 사용한다", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENVIRONMENT", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(getSentryOptions()).toMatchObject({
      environment: "production",
      tracesSampleRate: 0.1,
    });
  });
});
