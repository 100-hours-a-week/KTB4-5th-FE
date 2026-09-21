"use client";

import {
  INGREDIENT_QUANTITY_UNIT,
  INGREDIENT_STORAGE_TYPE_LABELS,
} from "@/entities/ingredient";
import { formatExpirationDate } from "@/features/select-expiration-date";

import {
  hasEditChanges,
  type IngredientEditFormInput,
} from "../model/ingredient-edit-form-schema";
import { useEditValues } from "../model/use-edit-values";

type EditSummaryLineProps = {
  id: string;
  initialValues: IngredientEditFormInput;
};

function formatStock(values: IngredientEditFormInput) {
  return [
    values.name.trim() || "이름 없음",
    INGREDIENT_STORAGE_TYPE_LABELS[values.storageType],
    values.quantity === ""
      ? null
      : `${values.quantity}${INGREDIENT_QUANTITY_UNIT}`,
    values.expirationDate
      ? formatExpirationDate(values.expirationDate)
      : "기한 미정",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** 수정 전 값을 목록 위에 고정해 지금 무엇을 바꾸고 있는지 계속 보이게 한다. */
export function EditSummaryLine({ id, initialValues }: EditSummaryLineProps) {
  const values = useEditValues();
  const isChanged = hasEditChanges(initialValues, values);

  return (
    <p
      id={id}
      aria-live="polite"
      className="m-0 text-[11.5px] leading-tight text-app-ink/60"
    >
      수정 전 {formatStock(initialValues)}
      {" · "}
      {isChanged ? (
        <span className="font-bold text-app-ink">변경됨</span>
      ) : (
        <span className="text-app-ink/45">변경 없음</span>
      )}
    </p>
  );
}
