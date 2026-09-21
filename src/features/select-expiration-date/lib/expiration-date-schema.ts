import { z } from "zod";

import { getMaxExpirationDate, getTodayInSeoul } from "./expiration-date";

export const ingredientExpirationDateSchema = z
  .string()
  .superRefine((value, ctx) => {
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
