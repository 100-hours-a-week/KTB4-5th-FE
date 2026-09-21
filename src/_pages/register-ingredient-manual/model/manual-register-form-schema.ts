import { z } from "zod";

import {
  INGREDIENT_STORAGE_TYPES,
  type IngredientWeightUnit,
} from "@/entities/ingredient";
import {
  ingredientNameSchema,
  ingredientQuantitySchema,
  ingredientWeightValueSchema,
  normalizeIngredientName,
} from "@/features/ingredient-form";
import { ingredientExpirationDateSchema } from "@/features/select-expiration-date";
import { INGREDIENT_REGISTER_BATCH_LIMIT } from "@/shared/config";

export const MANUAL_WEIGHT_UNITS = ["G", "ML"] as const;

export const EMPTY_DRAFTS_MESSAGE = "등록할 재료가 없어요";
export const BATCH_LIMIT_MESSAGE = "한 번에 20건까지 등록할 수 있어요";

const ingredientDraftSchema = z
  .object({
    name: ingredientNameSchema,
    storageType: z.enum(INGREDIENT_STORAGE_TYPES),
    quantity: ingredientQuantitySchema,
    weightValue: ingredientWeightValueSchema,
    weightUnit: z.enum(MANUAL_WEIGHT_UNITS),
    expirationDate: ingredientExpirationDateSchema,
  })
  // 무게를 비워 두면 단위도 고르지 않은 것이므로 NONE으로 보낸다.
  .transform((draft) => ({
    ...draft,
    weightUnit:
      draft.weightValue === null
        ? ("NONE" as const)
        : (draft.weightUnit as IngredientWeightUnit),
  }));

export const manualRegisterFormSchema = z.object({
  drafts: z
    .array(ingredientDraftSchema)
    .min(1, EMPTY_DRAFTS_MESSAGE)
    .max(INGREDIENT_REGISTER_BATCH_LIMIT, BATCH_LIMIT_MESSAGE),
});

export type ManualRegisterFormInput = z.input<typeof manualRegisterFormSchema>;
export type ManualRegisterFormValues = z.output<
  typeof manualRegisterFormSchema
>;
export type ManualIngredientDraft = ManualRegisterFormInput["drafts"][number];
export type ManualIngredientDraftValues =
  ManualRegisterFormValues["drafts"][number];

export function createEmptyDraft(): ManualIngredientDraft {
  return {
    name: "",
    storageType: "REFRIGERATED",
    quantity: "1",
    weightValue: "",
    weightUnit: "G",
    expirationDate: "",
  };
}

/**
 * 한 칸이라도 손댄 카드가 있는지 본다. 입력값이 하나도 없으면 뒤로가기에서
 * 확인 모달 없이 바로 이동한다
 */
export function hasAnyDraftInput(drafts: readonly ManualIngredientDraft[]) {
  const emptyDraft = createEmptyDraft();

  return drafts.some(
    (draft) =>
      normalizeIngredientName(draft.name) !== "" ||
      draft.storageType !== emptyDraft.storageType ||
      draft.quantity !== emptyDraft.quantity ||
      draft.weightValue !== "" ||
      draft.weightUnit !== emptyDraft.weightUnit ||
      draft.expirationDate !== "",
  );
}
