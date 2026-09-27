import { z } from "zod";

import {
  INGREDIENT_STORAGE_TYPES,
  type IngredientWeightUnit,
  normalizeIngredientName,
} from "@/entities/ingredient";
import {
  ingredientNameSchema,
  ingredientQuantitySchema,
  ingredientWeightValueSchema,
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
    quantity: z
      .string()
      .superRefine((value, ctx) => {
        if (value === "") return;
        const result = ingredientQuantitySchema.safeParse(value);
        if (!result.success) {
          ctx.addIssue({
            code: "custom",
            message: result.error.issues[0]?.message ?? "수량을 확인해 주세요",
          });
        }
      })
      .transform((value) => (value === "" ? null : Number(value))),
    weightValue: ingredientWeightValueSchema,
    weightUnit: z.enum(MANUAL_WEIGHT_UNITS),
    expirationDate: ingredientExpirationDateSchema,
  })
  .superRefine((draft, ctx) => {
    if (draft.quantity === null && draft.weightValue === null) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "수량 또는 무게를 입력해주세요",
      });
    }
    if (draft.quantity !== null && draft.weightValue !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["weightValue"],
        message: "수량과 무게 중 하나만 입력해주세요",
      });
    }
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
    quantity: "",
    weightValue: "",
    weightUnit: "G",
    expirationDate: "",
  };
}

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
