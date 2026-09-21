"use client";

import { useId } from "react";
import { useFormState } from "react-hook-form";

import {
  IngredientFieldHelper,
  IngredientFormFields,
} from "@/features/ingredient-form";
import { NotePaper } from "@/shared/ui/note-paper";

import type { IngredientEditFormInput } from "../model/ingredient-edit-form-schema";
import { EditCreatedDateField } from "./edit-created-date-field";
import { EditExpirationDateField } from "./edit-expiration-date-field";
import { EditNameField } from "./edit-name-field";
import { EditQuantityField } from "./edit-quantity-field";
import { EditStorageTypeField } from "./edit-storage-type-field";
import { EditWeightField } from "./edit-weight-field";
import { FIELD_LABEL_CLASS_NAME } from "./field-styles";

type IngredientEditCardProps = {
  createdDate: string;
};

const NAME_HINT = "한글·영문·숫자 2~10자";
const QUANTITY_HINT = "수량은 1~100개";
const WEIGHT_HINT = "무게는 선택";
const EXPIRATION_HINT = "기한은 4년 이내";

/** 등록 화면의 메모지 카드를 한 건 전용으로 편 형태다. 항상 펼쳐져 있고 접지 않는다. */
export function IngredientEditCard({ createdDate }: IngredientEditCardProps) {
  const { errors } = useFormState<IngredientEditFormInput>();
  const idPrefix = useId();

  return (
    <NotePaper foldSize={28}>
      <div className="px-5 pt-4 pb-7">
        <IngredientFormFields
          nameField={
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
          }
          storageField={<EditStorageTypeField />}
          quantityField={
            <div>
              <label
                htmlFor={`${idPrefix}-quantity`}
                className={FIELD_LABEL_CLASS_NAME}
              >
                수량
              </label>
              <EditQuantityField
                id={`${idPrefix}-quantity`}
                describedBy={`${idPrefix}-quantity-help`}
              />
            </div>
          }
          quantityHelper={
            <IngredientFieldHelper
              id={`${idPrefix}-quantity-help`}
              hint={QUANTITY_HINT}
              error={errors.quantity?.message}
            />
          }
          weightField={
            <div>
              <label
                htmlFor={`${idPrefix}-weight`}
                className={FIELD_LABEL_CLASS_NAME}
              >
                무게
              </label>
              <EditWeightField
                id={`${idPrefix}-weight`}
                describedBy={`${idPrefix}-weight-help`}
              />
            </div>
          }
          weightHelper={
            <IngredientFieldHelper
              id={`${idPrefix}-weight-help`}
              hint={WEIGHT_HINT}
              error={errors.weightValue?.message}
            />
          }
          expirationField={
            <div>
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
            </div>
          }
          expirationHelper={
            <IngredientFieldHelper
              id={`${idPrefix}-expiration-help`}
              hint={EXPIRATION_HINT}
              error={errors.expirationDate?.message}
            />
          }
          // 수정할 수 없는 값은 입력칸 아래에 따로 모아 조작 대상과 구분한다.
          footer={
            <EditCreatedDateField
              id={`${idPrefix}-created`}
              createdDate={createdDate}
            />
          }
        />
      </div>
    </NotePaper>
  );
}
