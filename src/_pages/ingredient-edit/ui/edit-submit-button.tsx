"use client";

import { useFormState } from "react-hook-form";

import { FooterButton } from "@/shared/ui/footer-button";

import {
  hasEditChanges,
  type IngredientEditFormInput,
} from "../model/ingredient-edit-form-schema";
import { useEditValues } from "../model/use-edit-values";

type EditSubmitButtonProps = {
  formId: string;
  initialValues: IngredientEditFormInput;
  isSubmitting: boolean;
};

/**
 * 저장은 값이 모두 유효하고 실제로 바뀐 것이 있을 때만 열린다. 값 구독을 버튼에
 * 가둬 한 칸을 칠 때마다 폼 전체가 다시 그려지지 않게 한다.
 */
export function EditSubmitButton({
  formId,
  initialValues,
  isSubmitting,
}: EditSubmitButtonProps) {
  const values = useEditValues();
  const { isValid } = useFormState<IngredientEditFormInput>();

  return (
    <FooterButton
      type="submit"
      form={formId}
      aria-busy={isSubmitting}
      disabled={
        isSubmitting || !isValid || !hasEditChanges(initialValues, values)
      }
    >
      {isSubmitting ? "로딩 중" : "저장"}
    </FooterButton>
  );
}
