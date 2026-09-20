import { z } from "zod";

import {
  INGREDIENT_STORAGE_TYPES,
  type IngredientWeightUnit,
} from "@/entities/ingredient";
import {
  INGREDIENT_QUANTITY_MAX,
  INGREDIENT_QUANTITY_MIN,
  INGREDIENT_REGISTER_BATCH_LIMIT,
  INGREDIENT_WEIGHT_MAX,
  INGREDIENT_WEIGHT_MIN,
  TEXT_FIELD_MAX_LENGTH,
  TEXT_FIELD_MIN_LENGTH,
} from "@/shared/config";

import { normalizeIngredientName } from "../lib/draft-input";
import { getMaxExpirationDate, getTodayInSeoul } from "../lib/expiration-date";

export const MANUAL_WEIGHT_UNITS = ["G", "ML"] as const;

export const EMPTY_DRAFTS_MESSAGE = "등록할 재료가 없어요";
export const BATCH_LIMIT_MESSAGE = "한 번에 20건까지 등록할 수 있어요";

const NAME_PATTERN = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]+$/;

// SERVICE_COMMON_RULES 5.1의 우선순위: 비어 있음 > 형식 > 범위.
// 금칙어는 화면에서 검사하지 않고 서버 응답으로 처리한다.
const ingredientNameSchema = z
  .string()
  .superRefine((value, ctx) => {
    const name = normalizeIngredientName(value);

    if (name === "") {
      ctx.addIssue({ code: "custom", message: "재료 이름을 입력해주세요" });
      return;
    }

    if (!NAME_PATTERN.test(name)) {
      ctx.addIssue({
        code: "custom",
        message: "한글, 영문, 숫자만 입력할 수 있어요",
      });
      return;
    }

    if (
      name.length < TEXT_FIELD_MIN_LENGTH ||
      name.length > TEXT_FIELD_MAX_LENGTH
    ) {
      ctx.addIssue({ code: "custom", message: "2~10자로 입력해주세요" });
    }
  })
  .transform(normalizeIngredientName);

const quantitySchema = z
  .string()
  .superRefine((value, ctx) => {
    if (value === "") {
      ctx.addIssue({ code: "custom", message: "수량을 입력해주세요" });
      return;
    }

    const quantity = Number(value);

    if (!Number.isInteger(quantity) || quantity < INGREDIENT_QUANTITY_MIN) {
      ctx.addIssue({ code: "custom", message: "수량을 입력해주세요" });
      return;
    }

    if (quantity > INGREDIENT_QUANTITY_MAX) {
      ctx.addIssue({
        code: "custom",
        message: "100개까지 입력할 수 있어요",
      });
    }
  })
  .transform(Number);

// 무게는 선택 입력이라 비어 있으면 통과시키고 null로 보낸다.
const weightValueSchema = z
  .string()
  .superRefine((value, ctx) => {
    if (value === "") {
      return;
    }

    const weight = Number(value);

    if (!Number.isInteger(weight) || weight < INGREDIENT_WEIGHT_MIN) {
      ctx.addIssue({ code: "custom", message: "1 이상 정수로 입력해주세요" });
      return;
    }

    if (weight > INGREDIENT_WEIGHT_MAX) {
      ctx.addIssue({ code: "custom", message: "20,000 이하로 입력해주세요" });
    }
  })
  .transform((value) => (value === "" ? null : Number(value)));

const expirationDateSchema = z.string().superRefine((value, ctx) => {
  if (value === "") {
    ctx.addIssue({ code: "custom", message: "유통기한을 선택해주세요" });
    return;
  }

  if (value < getTodayInSeoul()) {
    ctx.addIssue({ code: "custom", message: "지난 날짜는 선택할 수 없어요" });
    return;
  }

  if (value > getMaxExpirationDate()) {
    ctx.addIssue({ code: "custom", message: "4년 이내로 선택해주세요" });
  }
});

const ingredientDraftSchema = z
  .object({
    name: ingredientNameSchema,
    storageType: z.enum(INGREDIENT_STORAGE_TYPES),
    quantity: quantitySchema,
    weightValue: weightValueSchema,
    weightUnit: z.enum(MANUAL_WEIGHT_UNITS),
    expirationDate: expirationDateSchema,
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
