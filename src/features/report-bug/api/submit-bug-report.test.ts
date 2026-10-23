import { afterEach, beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("document", { cookie: "XSRF-TOKEN=csrf" });
});
afterEach(() => vi.unstubAllGlobals());

it("만료된 세션은 공통 갱신 경로를 거쳐 리포트를 한 번 재시도한다", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(
      Response.json({ code: "REPORT-201-001", message: "OK", data: null }),
    );
  vi.stubGlobal("fetch", fetchMock);
  const { submitBugReport } = await import("./submit-bug-report");
  const fields = {
    reporterName: "테스터",
    category: "BUG" as const,
    description: "버그 제보",
  };
  await submitBugReport(fields);
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    "/bug-reports",
    "/api/v1/auth/token-renewals",
    "/bug-reports",
  ]);
  expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
    method: "POST",
    credentials: "include",
    body: JSON.stringify(fields),
  });
});

it("갱신 후에도 401이면 추가 재시도 없이 세션 만료로 처리한다", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(new Response(null, { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);
  const { submitBugReport } = await import("./submit-bug-report");
  await expect(
    submitBugReport({
      reporterName: "테스터",
      category: "BUG",
      description: "버그 제보",
    }),
  ).rejects.toMatchObject({ name: "SessionExpiredError" });
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
