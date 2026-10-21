// @vitest-environment jsdom

import { webcrypto } from "node:crypto";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { routes } from "@/shared/routes";
import { getTodayInSeoul } from "@/shared/lib/seoul-date";
import { toHomeSummary } from "@/_pages/home/model/home-summary";
import { useReceiptAnalysis } from "@/_pages/register-ingredient-receipt/model/use-receipt-analysis";
import { useReceiptResultForm } from "@/_pages/register-ingredient-receipt/model/use-receipt-result-form";
import { useReceiptResultStore } from "@/_pages/register-ingredient-receipt/model/use-receipt-result-store";
import { getIngredientCapacity } from "@/entities/ingredient/model/ingredient-capacity";
import { getIngredientList } from "@/entities/ingredient/api/get-ingredient-list";
import { ingredientQueries } from "@/entities/ingredient/api/ingredient.queries";
import { imageAnalysisQueries, useRegisteredAnalyses } from "@/entities/image";
import { analysisFixture } from "@/entities/image/api/image-analysis.test-fixtures";
import {
  getCurrentRefrigerators,
  refrigeratorQueries,
} from "@/entities/refrigerator";
import { getVapidPublicKey } from "@/features/manage-push-notifications/api/push-subscription";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@lineiconshq/free-icons", () => ({ CalendarDaysOutlined: {} }));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));
vi.mock("@/entities/notification", () => ({
  useNotificationSessionScope: () => "session",
}));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast: vi.fn() }));

const today = getTodayInSeoul();
let client: QueryClient;
const fetchMock = vi.fn();
function ok(data: unknown) {
  return Response.json({ code: "TEST-200-001", message: "성공", data });
}
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  document.cookie = "XSRF-TOKEN=csrf; path=/";
  document.cookie = "currentRefrigeratorId=17; path=/";
  useReceiptResultStore.setState({ result: null });
  useRegisteredAnalyses.setState({ idsBySession: {} });
  fetchMock.mockReset();
  router.push.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});

it("VAPID 공개키와 마이페이지·홈의 최신 응답 및 1,500종 경계를 사용한다", async () => {
  const overview = {
    userId: "1",
    nickname: "나",
    email: null,
    profileImageUrl: null,
    refrigeratorId: "17",
    refrigeratorName: "카테부",
    ingredientsNum: 1500,
    expiredIngredientsNum: 3,
    memberNum: 150,
    notificationPreferences: [],
  };
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith("/vapid-public-key"))
      return ok({ vapidPublicKey: "public-key" });
    if (url.endsWith("/current"))
      return ok([
        { refrigeratorId: 17, name: "카테부", capacity: 1500, expiredCount: 3 },
      ]);
    if (url.endsWith("/mypage")) return ok(overview);
    if (url.includes("/ingredients?"))
      return ok({
        baseDate: "2026-10-17",
        outdated: false,
        ingredientsNum: 1500,
        filteredCount: 1500,
        refrigeratorCapacity: 1500,
        refrigeratorName: "카테부",
        ingredients: [],
        nextCursor: null,
      });
    throw new Error(`Unexpected request: ${url}`);
  });
  expect(await getVapidPublicKey()).toBe("public-key");
  expect(fetchMock.mock.calls[0][0]).toBe(
    "/api/v1/push-subscriptions/vapid-public-key",
  );
  expect(await getCurrentRefrigerators()).toEqual([
    { refrigeratorId: "17", name: "카테부", capacity: 1500, expiredCount: 3 },
  ]);
  expect(await client.fetchQuery(refrigeratorQueries.mypage("17"))).toEqual(
    overview,
  );
  const page = await getIngredientList({
    refrigeratorId: "17",
    query: {
      filter: null,
      category: null,
      sort: "EXPIRATION_ASC",
      keyword: null,
    },
  });
  expect(toHomeSummary(page)).toMatchObject({
    stockTypeCount: 1500,
    stockTypeLimit: 1500,
  });
  expect(getIngredientCapacity(page)).toMatchObject({
    remainingSlots: 0,
    isLimitReached: true,
  });
  expect(
    getIngredientCapacity({ ...page, ingredientsNum: 1499 }),
  ).toMatchObject({ remainingSlots: 1, isLimitReached: false });
});

it("영수증 업로드 → AI 인식 → 누락 유통기한 수정 → 등록 → 홈·마이페이지 캐시 갱신을 연결한다", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const job = {
    ...analysisFixture,
    status: "COMPLETED" as const,
    results: [analysisFixture.results[0]],
  };
  const registered = {
    createdCount: 1,
    mergedCount: 0,
    ingredientsNum: 1500,
    refrigeratorCapacity: 1500,
    mergedItems: [],
  };
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/presigned-url"))
      return ok({
        objectKey: "receipt.jpg",
        uploadUrl: "https://storage.example/receipt.jpg",
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
      });
    if (url.startsWith("https://storage.example/"))
      return new Response(null, { status: 200 });
    if (url === "/api/v1/image-analyses" && init?.method !== "POST")
      return ok({ analyses: [] });
    if (url === "/api/v1/image-analyses")
      return ok({
        analysisId: job.analysisId,
        status: "QUEUED",
        pollAfterMs: 1000,
      });
    if (url === `/api/v1/image-analyses/${job.analysisId}`) return ok(job);
    if (url.endsWith("/ingredients/from-analysis")) return ok(registered);
    throw new Error(`Unexpected request: ${url}`);
  });
  const listKey = imageAnalysisQueries.list("session").queryKey;
  const ingredientKey = [...ingredientQueries.byRefrigerator("17"), "test"];
  const mypageKey = refrigeratorQueries.mypage("17").queryKey;
  client.setQueryData(listKey, { analyses: [job] });
  client.setQueryData(ingredientKey, {});
  client.setQueryData([...mypageKey], {});
  const analysis = renderHook(() => useReceiptAnalysis(), { wrapper });
  const file = new File(["receipt"], "receipt.jpg", { type: "image/jpeg" });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new TextEncoder().encode("receipt").buffer,
  });
  act(() => analysis.result.current.analyze([file]));
  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith(
      routes.imageAnalysisResult(job.analysisId),
    ),
  );
  const recognition = useReceiptResultStore.getState().result!;
  expect(recognition.drafts[0].expirationDate).toBe("");
  analysis.unmount();
  const form = renderHook(() => useReceiptResultForm(recognition), { wrapper });
  await act(async () => {
    form.result.current.form.setValue("drafts.0.expirationDate", today);
    await form.result.current.submit();
  });
  await waitFor(() =>
    expect(form.result.current.completedResult).toEqual(registered),
  );
  const [, request] = fetchMock.mock.calls.find(([url]) =>
    url.endsWith("/ingredients/from-analysis"),
  )!;
  expect(new Headers(request.headers).get("X-XSRF-TOKEN")).toBe("csrf");
  expect(JSON.parse(request.body)).toEqual({
    analysisId: job.analysisId,
    images: [
      {
        imageObjectKey: "receipt.jpg",
        items: [
          {
            itemId: "item_001",
            name: "우유",
            category: "DAIRY",
            storageType: "REFRIGERATED",
            measureType: "WEIGHT",
            quantity: null,
            weight: { value: 1000, unit: "ML" },
            expiration: today,
          },
        ],
      },
    ],
  });
  expect(client.getQueryState(ingredientKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(mypageKey)?.isInvalidated).toBe(true);
  expect(useRegisteredAnalyses.getState().idsBySession.session).toEqual([
    job.analysisId,
  ]);
});
