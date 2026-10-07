"use client";

import { ChevronDownOutlined, XmarkOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useId, type ReactNode } from "react";
import { useFormState, useWatch } from "react-hook-form";

import {
  INGREDIENT_QUANTITY_UNIT,
  INGREDIENT_STORAGE_TYPE_LABELS,
  INGREDIENT_WEIGHT_UNIT_LABELS,
} from "@/entities/ingredient";
import { IngredientFieldHelper } from "@/features/ingredient-form";
import { formatIsoDate } from "@/shared/lib/date";
import { NotePaper } from "@/shared/ui/note-paper";

import type { IngredientDraftFormInput } from "../model/ingredient-draft-form-schema";
import { CategoryField } from "./category-field";
import { ExpirationDateField } from "./expiration-date-field";
import { FIELD_LABEL_CLASS_NAME } from "./field-styles";
import { IngredientNameField } from "./ingredient-name-field";
import { QuantityField } from "./quantity-field";
import { StorageTypeField } from "./storage-type-field";
import { WeightField } from "./weight-field";

type IngredientDraftCardProps = {
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  badge?: ReactNode;
};

const DRAFT_ERROR_FIELDS = [
  "name",
  "quantity",
  "weightValue",
  "expirationDate",
] as const;

const NAME_HINT = "한글·영문·숫자 1~10자";
const QUANTITY_HINT = "수량은 1~100개";
const WEIGHT_HINT = "무게는 선택 · 1~50,000 정수";
const QUANTITY_DISABLED_HINT = "무게를 비우면 수량 입력 가능";
const WEIGHT_DISABLED_HINT = "수량을 비우면 무게 입력 가능";
const EXPIRATION_HINT = "기한은 4년 이내";

export function IngredientDraftCard({
  index,
  isExpanded,
  onToggle,
  onRemove,
  badge,
}: IngredientDraftCardProps) {
  const draft = useWatch<IngredientDraftFormInput, `drafts.${number}`>({
    name: `drafts.${index}`,
  });
  const { errors } = useFormState<IngredientDraftFormInput>({
    name: `drafts.${index}`,
  });
  const idPrefix = useId();

  if (!draft) {
    return null;
  }

  const draftErrors = errors.drafts?.[index];
  const quantityDisabled = draft.weightValue !== "";
  const weightDisabled = draft.quantity !== "";
  const errorMessage = DRAFT_ERROR_FIELDS.map(
    (fieldName) => draftErrors?.[fieldName]?.message,
  ).find(Boolean);
  const bodyId = `${idPrefix}-body`;
  const summaryId = `${idPrefix}-summary`;

  const summary = [
    draft.name.trim() || "새 재료",
    INGREDIENT_STORAGE_TYPE_LABELS[draft.storageType],
    draft.quantity === ""
      ? null
      : `${draft.quantity}${INGREDIENT_QUANTITY_UNIT}`,
    draft.weightValue === ""
      ? null
      : `${draft.weightValue}${INGREDIENT_WEIGHT_UNIT_LABELS[draft.weightUnit]}`,
    draft.expirationDate ? formatIsoDate(draft.expirationDate) : "기한 미정",
  ]
    .filter(Boolean)
    .join("·");

  return (
    <NotePaper foldSize={isExpanded ? 28 : 20}>
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={bodyId}
          aria-describedby={summaryId}
          className="flex min-h-[var(--tap-min)] w-full cursor-pointer items-center gap-2 border-0 bg-transparent py-2.5 pr-20 pl-5 text-left"
        >
          <span className="flex-none font-app-mono text-[12px] font-bold text-app-ink/35">
            {index + 1}
          </span>
          <span
            id={summaryId}
            className={`min-w-0 flex-1 truncate font-app-body text-[12.5px] font-bold leading-tight ${
              errorMessage ? "text-app-primary" : "text-app-ink"
            }`}
          >
            {errorMessage && !isExpanded ? errorMessage : summary}
          </span>
          {badge}
        </button>

        <Lineicons
          icon={ChevronDownOutlined}
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          focusable="false"
          className={`pointer-events-none absolute top-[calc(var(--tap-min)/2)] right-[11px] -translate-y-1/2 text-app-ink/45 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />

        <button
          type="button"
          onClick={onRemove}
          aria-label={`${index + 1}번째 재료 지우기`}
          className="absolute top-0 right-9 grid size-[var(--tap-min)] cursor-pointer place-items-center border-0 bg-transparent text-app-ink/40 hover:text-app-primary"
        >
          <Lineicons
            icon={XmarkOutlined}
            size={15}
            strokeWidth={2}
            aria-hidden="true"
            focusable="false"
          />
        </button>

        {isExpanded ? (
          <div
            id={bodyId}
            className="border-t border-app-ink/15 px-5 pt-3.5 pb-7"
          >
            <div>
              <div>
                <label
                  htmlFor={`${idPrefix}-category`}
                  className={FIELD_LABEL_CLASS_NAME}
                >
                  카테고리
                </label>
                <CategoryField id={`${idPrefix}-category`} index={index} />
              </div>

              <div className="mt-3">
                <label
                  htmlFor={`${idPrefix}-name`}
                  className={FIELD_LABEL_CLASS_NAME}
                >
                  재료 이름
                </label>
                <IngredientNameField
                  id={`${idPrefix}-name`}
                  index={index}
                  describedBy={`${idPrefix}-name-help`}
                />
                <IngredientFieldHelper
                  id={`${idPrefix}-name-help`}
                  hint={NAME_HINT}
                  error={draftErrors?.name?.message}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <StorageTypeField index={index} />
                </div>
                <div className="min-w-0">
                  <label
                    htmlFor={`${idPrefix}-quantity`}
                    className={FIELD_LABEL_CLASS_NAME}
                  >
                    수량
                  </label>
                  <QuantityField
                    id={`${idPrefix}-quantity`}
                    index={index}
                    describedBy={`${idPrefix}-quantity-help`}
                    disabled={quantityDisabled}
                  />
                  <IngredientFieldHelper
                    id={`${idPrefix}-quantity-help`}
                    hint={
                      quantityDisabled ? QUANTITY_DISABLED_HINT : QUANTITY_HINT
                    }
                    error={
                      quantityDisabled
                        ? undefined
                        : draftErrors?.quantity?.message
                    }
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label
                    htmlFor={`${idPrefix}-weight`}
                    className={FIELD_LABEL_CLASS_NAME}
                  >
                    무게
                  </label>
                  <WeightField
                    id={`${idPrefix}-weight`}
                    index={index}
                    describedBy={`${idPrefix}-weight-help`}
                    disabled={weightDisabled}
                  />
                  <IngredientFieldHelper
                    id={`${idPrefix}-weight-help`}
                    hint={weightDisabled ? WEIGHT_DISABLED_HINT : WEIGHT_HINT}
                    error={
                      weightDisabled
                        ? undefined
                        : draftErrors?.weightValue?.message
                    }
                  />
                </div>
                <div className="min-w-0">
                  <span
                    id={`${idPrefix}-expiration-label`}
                    className={FIELD_LABEL_CLASS_NAME}
                  >
                    유통기한
                  </span>
                  <ExpirationDateField
                    id={`${idPrefix}-expiration`}
                    labelId={`${idPrefix}-expiration-label`}
                    index={index}
                    describedBy={`${idPrefix}-expiration-help`}
                  />
                  <IngredientFieldHelper
                    id={`${idPrefix}-expiration-help`}
                    hint={EXPIRATION_HINT}
                    error={draftErrors?.expirationDate?.message}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </NotePaper>
  );
}
