"use client";

import { useId } from "react";
import { useFormState, useWatch } from "react-hook-form";

import { IngredientFieldHelper } from "@/features/ingredient-form";
import { NotePaper } from "@/shared/ui/note-paper";

import type { IngredientEditFormInput } from "../model/ingredient-edit-form-schema";
import { EditCreatedDateField } from "./edit-created-date-field";
import { EditExpirationDateField } from "./edit-expiration-date-field";
import { EditMeasureTypeField } from "./edit-measure-type-field";
import { EditNameField } from "./edit-name-field";
import { EditQuantityField } from "./edit-quantity-field";
import { EditStorageTypeField } from "./edit-storage-type-field";
import { EditWeightField } from "./edit-weight-field";
import { FIELD_LABEL_CLASS_NAME } from "./field-styles";

type IngredientEditCardProps = {
  createdDate: string;
  initialStorageType: IngredientEditFormInput["storageType"];
  measureType: IngredientEditFormInput["measureType"];
};

const NAME_HINT = "한글·영문·숫자 2~10자";
const QUANTITY_HINT = "1~100개 사이에서 수정할 수 있어요";
const WEIGHT_HINT = "1~20,000 사이에서 수정할 수 있어요";
const EXPIRATION_HINT = "기한은 4년 이내";
const FROZEN_STORAGE_WARNING =
  "변경 시 유통기간이 정확하지 않을 수 있습니다.";

/** 등록 화면의 메모지 카드를 한 건 전용으로 편 형태다. 항상 펼쳐져 있고 접지 않는다. */
export function IngredientEditCard({
  createdDate,
  initialStorageType,
  measureType,
}: IngredientEditCardProps) {
  const { errors } = useFormState<IngredientEditFormInput>();
  const storageType = useWatch<IngredientEditFormInput, "storageType">({
    name: "storageType",
  });
  const idPrefix = useId();
  const showFrozenStorageWarning =
    initialStorageType === "REFRIGERATED" && storageType === "FROZEN";

  return (
    <NotePaper foldSize={28}>
      <div className="px-5 pt-4 pb-7">
        <div>
          <div>
            <label
              htmlFor={`${idPrefix}-name`}
              className={FIELD_LABEL_CLASS_NAME}
            >
              재료 이름
            </label>
            <EditNameField
              id={`${idPrefix}-name`}
              describedBy={`${idPrefix}-name-help`}
            />
            <IngredientFieldHelper
              id={`${idPrefix}-name-help`}
              hint={NAME_HINT}
              error={errors.name?.message}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <EditStorageTypeField describedBy={`${idPrefix}-storage-help`} />
              <IngredientFieldHelper
                id={`${idPrefix}-storage-help`}
                hint={showFrozenStorageWarning ? FROZEN_STORAGE_WARNING : ""}
              />
            </div>
            <div className="min-w-0">
              {measureType === "COUNT" ? (
                <>
                  <label
                    htmlFor={`${idPrefix}-quantity`}
                    className={FIELD_LABEL_CLASS_NAME}
                  >
                    개수
                  </label>
                  <EditQuantityField
                    id={`${idPrefix}-quantity`}
                    describedBy={`${idPrefix}-amount-help`}
                  />
                </>
              ) : (
                <>
                  <label
                    htmlFor={`${idPrefix}-weight`}
                    className={FIELD_LABEL_CLASS_NAME}
                  >
                    무게·부피
                  </label>
                  <EditWeightField
                    id={`${idPrefix}-weight`}
                    describedBy={`${idPrefix}-amount-help`}
                  />
                </>
              )}
              <IngredientFieldHelper
                id={`${idPrefix}-amount-help`}
                hint={measureType === "COUNT" ? QUANTITY_HINT : WEIGHT_HINT}
                error={
                  measureType === "COUNT"
                    ? errors.quantity?.message
                    : errors.weightValue?.message
                }
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <EditMeasureTypeField
                id={`${idPrefix}-measure-type`}
                measureType={measureType}
              />
            </div>
            <div className="min-w-0">
              <span
                id={`${idPrefix}-expiration-label`}
                className={FIELD_LABEL_CLASS_NAME}
              >
                유통기한
              </span>
              <EditExpirationDateField
                id={`${idPrefix}-expiration`}
                labelId={`${idPrefix}-expiration-label`}
                describedBy={`${idPrefix}-expiration-help`}
              />
              <IngredientFieldHelper
                id={`${idPrefix}-expiration-help`}
                hint={EXPIRATION_HINT}
                error={errors.expirationDate?.message}
              />
            </div>
          </div>

          <div className="mt-3 border-t border-app-ink/15 pt-3.5">
            <EditCreatedDateField
              id={`${idPrefix}-created`}
              createdDate={createdDate}
            />
          </div>
        </div>
      </div>
    </NotePaper>
  );
}
