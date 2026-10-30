import { queryOptions } from "@tanstack/react-query";
import { requestJson, requestJsonOrNoContent } from "@/shared/api";
import {
  recommendationSchema,
  recommendationJobSchema,
  recipeDetailSchema,
  type RecommendationJobRequest,
} from "../model/recommendation";

const base = (refrigeratorId: string) =>
  `/refrigerators/${encodeURIComponent(refrigeratorId)}`;

export async function getRecommendations(
  refrigeratorId: string,
  signal?: AbortSignal,
) {
  const { data } = await requestJson<unknown>(
    `${base(refrigeratorId)}/recommendations`,
    { signal },
  );
  return recommendationSchema.parse(data);
}

export async function createRecommendationJob(
  refrigeratorId: string,
  body: RecommendationJobRequest = {},
) {
  const { data } = await requestJson<unknown>(
    `${base(refrigeratorId)}/recommendation-jobs`,
    { method: "POST", json: { mode: "INCLUDE_EXPIRED", ...body } },
  );
  return recommendationJobSchema.parse(data);
}

export async function switchToNewRecommendation(refrigeratorId: string) {
  await requestJsonOrNoContent<unknown>(
    `${base(refrigeratorId)}/recommendations/current`,
    { method: "POST" },
  );
}

export async function getRecipeDetail(
  refrigeratorId: string,
  recipeId: string,
  signal?: AbortSignal,
) {
  const { data } = await requestJson<unknown>(
    `${base(refrigeratorId)}/recipes/${encodeURIComponent(recipeId)}`,
    { signal },
  );
  return recipeDetailSchema.parse(data);
}

export async function applyRecipe(
  refrigeratorId: string,
  body: { recommendationId: string; recipeId: string },
  requestKey: string,
) {
  return requestJsonOrNoContent<{
    recipeId: string;
    useIngredients: { ingredientId: string; useAmount: number; unit: string }[];
  }>(`${base(refrigeratorId)}/cooking-records`, {
    method: "POST",
    json: body,
    headers: { "Idempotency-Key": requestKey },
  });
}

export const recommendationQueries = {
  list: (refrigeratorId: string) =>
    queryOptions({
      queryKey: ["refrigerators", refrigeratorId, "recommendations"] as const,
      queryFn: ({ signal }) => getRecommendations(refrigeratorId, signal),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  detail: (refrigeratorId: string, recipeId: string) =>
    queryOptions({
      queryKey: ["refrigerators", refrigeratorId, "recipes", recipeId] as const,
      queryFn: ({ signal }) =>
        getRecipeDetail(refrigeratorId, recipeId, signal),
    }),
};
