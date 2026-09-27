import { requestJsonOrNoContent } from "@/shared/api";

export type ExpireIngredientBody =
  | { quantity: number; weightValue?: never }
  | { quantity?: never; weightValue: string };

type ExpireIngredientResultDto = {
  removed: boolean;
};

export async function expireIngredient({
  ingredientId,
  etag,
  body,
}: {
  ingredientId: string;
  etag: string;
  body: ExpireIngredientBody;
}): Promise<{ removed: boolean }> {
  const response = await requestJsonOrNoContent<ExpireIngredientResultDto>(
    `/ingredients/${encodeURIComponent(ingredientId)}`,
    { method: "POST", headers: { "If-Match": etag }, json: body },
  );

  return { removed: response === null || response.data.removed === true };
}
