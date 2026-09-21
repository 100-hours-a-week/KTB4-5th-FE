import { z } from "zod";

import {
  INGREDIENT_STORAGE_TYPES,
  type IngredientWeightUnit,
} from "@/entities/ingredient";
import { normalizeIngredientName } from "@/features/ingredient-form";
import {
  getMaxExpirationDate,
  getTodayInSeoul,
} from "@/features/select-expiration-date";
import {
  INGREDIENT_QUANTITY_MAX,
  INGREDIENT_QUANTITY_MIN,
  INGREDIENT_WEIGHT_MAX,
  INGREDIENT_WEIGHT_MIN,
  TEXT_FIELD_MAX_LENGTH,
  TEXT_FIELD_MIN_LENGTH,
} from "@/shared/config";

export const EDIT_WEIGHT_UNITS = ["G", "ML"] as const;

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
      ctx.addIssue({ code: "custom", message: "100개까지 입력할 수 있어요" });
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

export const ingredientEditFormSchema = z
  .object({
    name: ingredientNameSchema,
    storageType: z.enum(INGREDIENT_STORAGE_TYPES),
    quantity: quantitySchema,
    weightValue: weightValueSchema,
    weightUnit: z.enum(EDIT_WEIGHT_UNITS),
    expirationDate: expirationDateSchema,
  })
  // 무게를 비워 두면 단위도 고르지 않은 것이므로 NONE으로 보낸다.
  .transform((values) => ({
    ...values,
    weightUnit:
      values.weightValue === null
        ? ("NONE" as const)
        : (values.weightUnit as IngredientWeightUnit),
  }));

export type IngredientEditFormInput = z.input<typeof ingredientEditFormSchema>;
export type IngredientEditFormValues = z.output<
  typeof ingredientEditFormSchema
>;

/**
 * 저장 버튼은 값이 실제로 달라졌을 때만 열린다. 처음 값과 한 칸씩 비교하며,
 * 이름은 저장 형태(앞뒤 공백 제거)로 맞춰 본다.
 */
export function hasEditChanges(
  initial: IngredientEditFormInput,
  current: IngredientEditFormInput,
) {
  if (
    normalizeIngredientName(current.name) !==
    normalizeIngredientName(initial.name)
  ) {
    return true;
  }

  if (
    current.storageType !== initial.storageType ||
    current.quantity !== initial.quantity ||
    current.expirationDate !== initial.expirationDate ||
    current.weightValue !== initial.weightValue
  ) {
    return true;
  }

  // 무게를 비운 상태에서는 단위를 바꿔도 저장값(NONE)이 그대로다.
  return (
    current.weightValue !== "" && current.weightUnit !== initial.weightUnit
  );
}
