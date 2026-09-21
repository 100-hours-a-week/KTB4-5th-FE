import { Locked2Outlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";

import {
  INGREDIENT_MEASURE_TYPE_LABELS,
  type IngredientMeasureType,
} from "@/entities/ingredient";

import {
  FIELD_CONTROL_READONLY_CLASS_NAME,
  FIELD_LABEL_CLASS_NAME,
} from "./field-styles";

type EditMeasureTypeFieldProps = {
  id: string;
  measureType: IngredientMeasureType;
};

/** 등록된 측정 타입은 바꾸지 않고 현재 타입과 정책만 읽기 전용으로 알린다. */
export function EditMeasureTypeField({
  id,
  measureType,
}: EditMeasureTypeFieldProps) {
  return (
    <div>
      <span id={`${id}-label`} className={FIELD_LABEL_CLASS_NAME}>
        측정 타입
      </span>
      <p
        id={id}
        aria-labelledby={`${id}-label`}
        aria-disabled="true"
        className={`m-0 ${FIELD_CONTROL_READONLY_CLASS_NAME}`}
      >
        <span className="min-w-0 flex-1 truncate font-app-body text-[15px] font-bold">
          {INGREDIENT_MEASURE_TYPE_LABELS[measureType]}
        </span>
        <Lineicons
          icon={Locked2Outlined}
          size={13}
          strokeWidth={2}
          aria-hidden="true"
          focusable="false"
          className="flex-none"
        />
      </p>
      <p className="m-0 mt-1 min-h-8 break-keep text-[12px] leading-4 text-app-ink/40">
        등록 후 측정 타입은 변경할 수 없어요
      </p>
    </div>
  );
}
