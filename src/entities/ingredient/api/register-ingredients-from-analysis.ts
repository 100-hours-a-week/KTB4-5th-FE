import { requestJson } from "@/shared/api";

import type {
  RegisterBatchResult,
  RegisterIngredientItem,
} from "./register-ingredients";

export type AnalysisIngredientItem = Omit<
  RegisterIngredientItem,
  "weightValue" | "weightUnit" | "expirationDate"
> & {
  itemId: string;
  weight: { value: number; unit: "G" | "ML" } | null;
  expiration: string;
};

export type RegisterIngredientsFromAnalysisBody = {
  analysisId: string;
  results: { imageObjectKey: string; items: AnalysisIngredientItem[] }[];
};

export async function registerIngredientsFromAnalysis({
  refrigeratorId,
  body,
}: {
  refrigeratorId: string;
  body: RegisterIngredientsFromAnalysisBody;
}): Promise<RegisterBatchResult> {
  const { data } = await requestJson<RegisterBatchResult>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/ingredients/from-analysis`,
    { method: "POST", json: body },
  );
  return data;
}
