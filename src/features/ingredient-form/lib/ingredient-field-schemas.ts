import { z } from "zod";

import { normalizeIngredientName } from "./ingredient-name";
import {
  INGREDIENT_QUANTITY_MAX,
  INGREDIENT_QUANTITY_MIN,
  INGREDIENT_WEIGHT_MAX,
  INGREDIENT_WEIGHT_MIN,
  TEXT_FIELD_MAX_LENGTH,
  TEXT_FIELD_MIN_LENGTH,
} from "@/shared/config";

const NAME_PATTERN = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]+$/;

// SERVICE_COMMON_RULES 5.1의 우선순위: 비어 있음 > 형식 > 범위.
// 금칙어는 화면에서 검사하지 않고 서버 응답으로 처리한다.
export const ingredientNameSchema = z
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

export const ingredientQuantitySchema = z
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
export const ingredientWeightValueSchema = z
  .string()
  .superRefine((value, ctx) => {
    if (value === "") return;

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
