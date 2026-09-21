"use client";

import { ChevronDownOutlined, XmarkOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useId } from "react";
import { useFormState, useWatch } from "react-hook-form";

import {
  INGREDIENT_QUANTITY_UNIT,
  INGREDIENT_STORAGE_TYPE_LABELS,
} from "@/entities/ingredient";
import { IngredientFieldHelper } from "@/features/ingredient-form";
import { formatExpirationDate } from "@/features/select-expiration-date";
import { NotePaper } from "@/shared/ui/note-paper";

import type { ManualRegisterFormInput } from "../model/manual-register-form-schema";
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
};

const DRAFT_ERROR_FIELDS = [
  "name",
  "quantity",
  "weightValue",
  "expirationDate",
] as const;

const NAME_HINT = "한글·영문·숫자 2~10자";
const QUANTITY_HINT = "수량은 1~100개";
const WEIGHT_HINT = "무게는 선택";
const EXPIRATION_HINT = "기한은 4년 이내";

export function IngredientDraftCard({
  index,
  isExpanded,
  onToggle,
  onRemove,
}: IngredientDraftCardProps) {
  const draft = useWatch<ManualRegisterFormInput, `drafts.${number}`>({
    name: `drafts.${index}`,
  });
  const { errors } = useFormState<ManualRegisterFormInput>({
    name: `drafts.${index}`,
  });
  const idPrefix = useId();

  // 카드를 지우면 구독이 끊기기 전에 빈 값으로 한 번 더 그려질 수 있다.
  if (!draft) {
    return null;
  }

  const draftErrors = errors.drafts?.[index];
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
    draft.expirationDate
      ? formatExpirationDate(draft.expirationDate)
      : "기한 미정",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    // 접힘과 펼침이 같은 메모지를 쓰고 접힌 귀의 크기와 머리글 줄로만 상태를 구분한다.
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
            className={`min-w-0 flex-1 truncate font-app-body text-[14px] font-bold leading-tight ${
              errorMessage ? "text-app-primary" : "text-app-ink"
            }`}
          >
            {errorMessage && !isExpanded ? errorMessage : summary}
          </span>
        </button>

        {/* 펼침 표시는 맨 오른쪽에 두고, 눌림은 아래 헤더 버튼이 그대로 받는다. */}
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

        {/* 지우기는 펼침 표시(⌄) 왼쪽에 둔다. 접힌 귀가 있는 오른쪽 아래는 비워둔다. */}
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
                />
              </div>
            </div>
            {/* 2칸을 가로지르는 한 줄을 써서 좁은 칸에서 문구가 잘리지 않게 한다. */}
            <IngredientFieldHelper
              id={`${idPrefix}-quantity-help`}
              hint={QUANTITY_HINT}
              error={draftErrors?.quantity?.message}
            />

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
                />
                <IngredientFieldHelper
                  id={`${idPrefix}-weight-help`}
                  hint={WEIGHT_HINT}
                  error={draftErrors?.weightValue?.message}
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
        ) : null}
      </div>
    </NotePaper>
  );
}
