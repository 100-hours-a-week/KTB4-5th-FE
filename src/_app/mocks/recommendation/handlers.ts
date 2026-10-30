import { delay, http, HttpResponse, passthrough } from "msw";
import { z } from "zod";
import type { Recommendation } from "@/entities/recommendation";
import { getTodayInSeoul } from "@/shared/lib/seoul-date";
import { createMockRecipe, createMockRecipes } from "./fixtures";

export function mockProblem(status: number, code: string) {
  return HttpResponse.json(
    { type: "about:blank", title: "요청을 처리하지 못했습니다.", status, code },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}
export const mockSuccess = <T>(code: string, data: T, status = 200) =>
  HttpResponse.json({ code, message: "요청 성공", data }, { status });

type State = {
  recommendation: Recommendation;
  recipe: ReturnType<typeof createMockRecipe>;
  pending?: Pick<
    Recommendation,
    "recommendationId" | "generatedAt" | "recipes"
  >;
};

export function createRecommendationHandlers() {
  const states = new Map<string, State>();
  const records = new Map<string, { signature: string }>();
  const streams = new Set<ReadableStreamDefaultController<Uint8Array>>();
  function emit(event: string, data: unknown) {
    const chunk = new TextEncoder().encode(
      `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
    );
    streams.forEach((controller) => {
      try {
        controller.enqueue(chunk);
      } catch {
        streams.delete(controller);
      }
    });
  }
  function state(id: string, scenario = "READY") {
    const key = `${id}:${scenario}`;
    let value = states.get(key);
    if (!value) {
      const noHistory =
        scenario === "EMPTY" ||
        scenario === "GENERATING_EMPTY" ||
        scenario === "LIMIT_EMPTY";
      const status: Recommendation["status"] =
        scenario === "LIMIT_EMPTY"
          ? "LIMIT_REACHED"
          : scenario === "GENERATING_EMPTY"
            ? "GENERATING"
            : scenario === "STALE" ||
                scenario === "GENERATING" ||
                scenario === "EMPTY" ||
                scenario === "LIMIT_REACHED"
              ? scenario
              : "READY";
      value = {
        recommendation: {
          recommendationId: noHistory ? null : "rec_001",
          status,
          generatedAt: noHistory ? null : new Date().toISOString(),
          activeJobId: status === "GENERATING" ? "rjob_88" : null,
          dailyGeneration: {
            limit: 10,
            remaining: status === "LIMIT_REACHED" ? 0 : 3,
            resetAt: `${new Date(Date.parse(getTodayInSeoul()) + 86400000).toISOString().slice(0, 10)}T00:00:00+09:00`,
          },
          recipes:
            noHistory || scenario === "NO_RESULTS" ? [] : createMockRecipes(),
          generationTrigger: status === "GENERATING" ? "USER" : null,
          generationStatus: status === "GENERATING" ? "PROCESSING" : null,
          hasNewRecommendation: false,
        },
        recipe: createMockRecipe("51"),
      };
      if (scenario === "NO_STOCKS") {
        value.recipe.ingredients = value.recipe.ingredients.map(
          (ingredient) => ({ ...ingredient, stocks: [] }),
        );
      }
      states.set(key, value);
    }
    return value;
  }
  const root = "*/api/v1/refrigerators/:refrigeratorId";
  // 실제 로그인 쿠키는 HttpOnly라 읽을 수 없어 명시적 모의 시나리오에서만 검사한다.
  const auth = (cookies: Record<string, string>) =>
    cookies.recommendationMock && !cookies.accessToken
      ? mockProblem(401, "GLOBAL-401-001")
      : null;
  const csrf = (request: Request, cookies: Record<string, string>) =>
    !cookies["XSRF-TOKEN"] ||
    request.headers.get("X-XSRF-TOKEN") !== cookies["XSRF-TOKEN"]
      ? mockProblem(403, "COMMON-403-CSRF-001")
      : null;
  const injectedError = (value?: string) => {
    const status = Number(value);
    return [400, 401, 403, 404, 409, 429, 500].includes(status)
      ? mockProblem(
          status,
          status === 403 || status === 404
            ? `REFRIGERATOR-${status}-001`
            : status === 409 || status === 429
              ? `RECOMMEND-${status}-001`
              : `GLOBAL-${status}-001`,
        )
      : null;
  };
  return [
    http.get("*/api/v1/image-analyses", ({ cookies }) =>
      cookies.recommendationMock
        ? mockSuccess("IMAGE-200-001", { analyses: [] })
        : passthrough(),
    ),
    http.get("*/api/v1/auth/csrf", ({ cookies }) =>
      cookies.recommendationMock
        ? new HttpResponse(null, {
            status: 204,
            headers: {
              "Set-Cookie": "XSRF-TOKEN=mock-csrf; Path=/; SameSite=Lax",
            },
          })
        : passthrough(),
    ),
    http.get("*/api/v1/refrigerators/current", ({ cookies }) =>
      cookies.recommendationMock
        ? mockSuccess("REFRIGERATOR-200-001", [
            {
              refrigeratorId: cookies.recommendationMock === "403" ? 2 : 1,
              name: "추천 테스트 냉장고",
              capacity: 1500,
              expiredCount: 1,
            },
          ])
        : passthrough(),
    ),
    http.get(`${root}/notifications/unread-count`, ({ params, cookies }) =>
      cookies.recommendationMock
        ? mockSuccess("NOTIFICATION-200-001", {
            refrigeratorId: params.refrigeratorId,
            unreadCount: 0,
          })
        : passthrough(),
    ),
    http.get(`${root}/members`, ({ cookies }) =>
      cookies.recommendationMock
        ? mockSuccess("REFRIGERATOR-200-001", {
            currentUserId: "1",
            refrigeratorName: "추천 테스트 냉장고",
            memberNum: 2,
            memberMax: 4,
            members: [],
          })
        : passthrough(),
    ),
    http.get("*/api/v1/users/me", ({ cookies }) =>
      cookies.recommendationMock
        ? mockSuccess("USER-200-001", {
            userId: "1",
            nickname: "추천 테스트",
            email: null,
            profileImageUrl: null,
          })
        : passthrough(),
    ),
    http.get(
      "*/api/v2/refrigerators/:refrigeratorId/notifications/stream",
      ({ cookies }) =>
        cookies.recommendationMock
          ? new HttpResponse(
              new ReadableStream({
                start(controller) {
                  streams.add(controller);
                  controller.enqueue(new TextEncoder().encode(": mock\n\n"));
                },
              }),
              { headers: { "Content-Type": "text/event-stream" } },
            )
          : passthrough(),
    ),
    http.get(`${root}/ingredients`, ({ params, cookies }) => {
      if (!cookies.recommendationMock) return passthrough();
      const value = state(
        String(params.refrigeratorId),
        cookies.recommendationMock,
      );
      const ingredients = value.recipe.ingredients.flatMap((ingredient) =>
        ingredient.stocks.map((stock) => {
          const daysUntilExpiration = Math.round(
            (Date.parse(stock.expirationDate) - Date.parse(getTodayInSeoul())) /
              86400000,
          );
          return {
            ingredientId: stock.ingredientId,
            name: ingredient.name,
            category: "ETC",
            quantity: stock.unit === "EA" ? stock.ownedAmount : 1,
            weightValue: stock.unit === "EA" ? null : String(stock.ownedAmount),
            weightUnit: stock.unit === "EA" ? "NONE" : stock.unit,
            storageType: "REFRIGERATED",
            expirationDate: stock.expirationDate,
            status:
              daysUntilExpiration < 0
                ? "EXPIRED"
                : daysUntilExpiration <= 3
                  ? "EXPIRING"
                  : "NORMAL",
            daysUntilExpiration,
          };
        }),
      );
      return mockSuccess("INGREDIENT-200-001", {
        baseDate: getTodayInSeoul(),
        outdated: false,
        refrigeratorName: "추천 테스트 냉장고",
        ingredientsNum: ingredients.length,
        filteredCount: ingredients.length,
        refrigeratorCapacity: 1500,
        ingredients,
        nextCursor: null,
      });
    }),
    http.get(`${root}/recommendations`, async ({ params, cookies }) => {
      await delay(250);
      const error =
        auth(cookies) ??
        (String(params.refrigeratorId) === "2" &&
        cookies.recommendationMock === "403"
          ? null
          : injectedError(cookies.recommendationMock));
      if (error) return error;
      const value = state(
        String(params.refrigeratorId),
        cookies.recommendationMock,
      );
      return mockSuccess("RECOMMEND-200-001", value.recommendation);
    }),
    http.post(
      `${root}/recommendation-jobs`,
      async ({ request, params, cookies }) => {
        const error =
          auth(cookies) ??
          csrf(request, cookies) ??
          injectedError(cookies.jobMock);
        if (error) return error;
        const body = z
          .object({
            mode: z
              .enum(["INCLUDE_EXPIRED", "EXCLUDE_EXPIRED"])
              .default("EXCLUDE_EXPIRED"),
            preferenceTags: z
              .array(z.string().min(1).max(40))
              .max(12)
              .optional(),
            targetServings: z.number().int().min(1).max(12).optional(),
          })
          .safeParse(await request.json().catch(() => null));
        if (!body.success) return mockProblem(400, "GLOBAL-400-001");
        const { mode, preferenceTags, targetServings } = body.data;
        const value = state(
          String(params.refrigeratorId),
          cookies.recommendationMock,
        );
        const data = value.recommendation;
        if (
          data.status === "READY" &&
          mode === "INCLUDE_EXPIRED" &&
          !preferenceTags?.length &&
          targetServings === undefined
        )
          return mockSuccess("RECOMMEND-200-003", {
            jobId: null,
            status: "ALREADY_UP_TO_DATE",
            recommendationId: data.recommendationId,
            dailyGeneration: data.dailyGeneration,
          });
        if (data.status === "GENERATING")
          return mockProblem(409, "RECOMMEND-409-003");
        if (data.dailyGeneration.remaining === 0)
          return mockProblem(429, "RECOMMEND-429-001");
        data.dailyGeneration.remaining -= 1;
        const previousStatus = data.status;
        data.status = "GENERATING";
        data.activeJobId = "rjob_88";
        data.generationTrigger = "USER";
        data.generationStatus = "QUEUED";
        const refrigeratorId = String(params.refrigeratorId);
        setTimeout(() => {
          value.pending = {
            recommendationId: `rec_${Date.now()}`,
            generatedAt: new Date().toISOString(),
            recipes: createMockRecipes().reverse(),
          };
          value.recommendation = {
            ...value.recommendation,
            status: previousStatus,
            activeJobId: null,
            generationStatus: "COMPLETED",
            hasNewRecommendation: true,
          };
          emit("recommendation.finished", {
            refrigeratorId,
            recommendationId: value.pending.recommendationId,
          });
        }, 2_000);
        return mockSuccess(
          "RECOMMEND-202-001",
          {
            jobId: "rjob_88",
            status: "QUEUED",
            mode,
            pollAfterMs: 1000,
            dailyGeneration: data.dailyGeneration,
          },
          202,
        );
      },
    ),
    http.post(
      `${root}/recommendations/current`,
      async ({ request, params, cookies }) => {
        const error = auth(cookies) ?? csrf(request, cookies);
        if (error) return error;
        const value = state(
          String(params.refrigeratorId),
          cookies.recommendationMock,
        );
        if (!value.pending) return mockProblem(404, "RECOMMEND-404-001");
        value.recommendation = {
          ...value.recommendation,
          ...value.pending,
          status: "READY",
          hasNewRecommendation: false,
        };
        value.pending = undefined;
        return new HttpResponse(null, { status: 204 });
      },
    ),
    http.get(`${root}/recipes/:recipeId`, async ({ params, cookies }) => {
      await delay(200);
      const error = auth(cookies) ?? injectedError(cookies.detailMock);
      if (error) return error;
      const recipeId = String(params.recipeId);
      if (!createMockRecipes().some((recipe) => recipe.recipeId === recipeId))
        return mockProblem(404, "RECOMMEND-404-001");
      const value = state(
        String(params.refrigeratorId),
        cookies.recommendationMock,
      );
      return mockSuccess("RECOMMEND-200-002", {
        ...value.recipe,
        recipeId,
        name: createMockRecipe(recipeId).name,
      });
    }),
    http.post(
      `${root}/cooking-records`,
      async ({ request, params, cookies }) => {
        await delay(400);
        const error = auth(cookies) ?? csrf(request, cookies);
        if (error) return error;
        const key = request.headers.get("Idempotency-Key");
        if (!key || key.length > 64) return mockProblem(400, "GLOBAL-400-001");
        const parsed = z
          .object({
            recipeId: z.string().min(1),
            recommendationId: z.string().min(1),
          })
          .safeParse(await request.json().catch(() => null));
        if (!parsed.success) return mockProblem(400, "GLOBAL-400-001");
        const body = parsed.data;
        const signature = JSON.stringify([
          cookies.accessToken,
          params.refrigeratorId,
          body.recommendationId,
          body.recipeId,
        ]);
        const record = records.get(key);
        if (record)
          return record.signature === signature
            ? new HttpResponse(null, { status: 204 })
            : mockProblem(409, "RECOMMEND-409-001");
        const forcedError = injectedError(cookies.cookingMock);
        if (forcedError) return forcedError;
        const value = state(
          String(params.refrigeratorId),
          cookies.recommendationMock,
        );
        if (
          !body.recipeId ||
          !value.recommendation.recipes.some(
            (r) => r.recipeId === body.recipeId,
          ) ||
          body.recommendationId !== value.recommendation.recommendationId
        )
          return mockProblem(404, "RECOMMEND-404-001");
        const useIngredients: {
          ingredientId: string;
          useAmount: number;
          unit: string;
        }[] = [];
        for (const ingredient of value.recipe.ingredients) {
          if (ingredient.requiredAmount === null || ingredient.unit === null)
            continue;
          let remaining = ingredient.requiredAmount;
          // shortcut: 서버 차감 순서 미확정으로 만료일 오름차순을 모의한다, 서버 계약 확정 시 맞춘다.
          for (const stock of ingredient.stocks.toSorted((a, b) =>
            a.expirationDate.localeCompare(b.expirationDate),
          )) {
            if (
              stock.expirationDate < getTodayInSeoul() ||
              stock.unit !== ingredient.unit
            )
              continue;
            const useAmount = Math.min(stock.ownedAmount, remaining);
            stock.ownedAmount -= useAmount;
            remaining -= useAmount;
            if (useAmount > 0)
              useIngredients.push({
                ingredientId: stock.ingredientId,
                useAmount,
                unit: stock.unit,
              });
          }
          ingredient.stocks = ingredient.stocks.filter(
            (s) => s.ownedAmount > 0,
          );
        }
        records.set(key, { signature });
        value.recommendation.status = "STALE";
        if (cookies.cookingMock === "LOST_RESPONSE") {
          return HttpResponse.error();
        }
        return mockSuccess("RECOMMEND-200-004", {
          recipeId: body.recipeId,
          useIngredients,
        });
      },
    ),
  ];
}
