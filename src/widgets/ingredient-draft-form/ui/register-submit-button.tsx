"use client";

import { useFormState, useWatch } from "react-hook-form";

import { FooterButton } from "@/shared/ui/footer-button";

import { summarizeDrafts } from "../model/draft-summary";
import type { IngredientDraftFormInput } from "../model/ingredient-draft-form-schema";
import type { RegisterCapacity } from "../model/register-capacity";

type RegisterSubmitButtonProps = {
  formId: string;
  capacity: RegisterCapacity;
  isSubmitting: boolean;
};

export function RegisterSubmitButton({
  formId,
  capacity,
  isSubmitting,
}: RegisterSubmitButtonProps) {
  const drafts = useWatch<IngredientDraftFormInput, "drafts">({
    name: "drafts",
  });
  const { isValid } = useFormState<IngredientDraftFormInput>();
  const summary = summarizeDrafts(drafts ?? [], capacity);

  return (
    <FooterButton
      type="submit"
      form={formId}
      aria-busy={isSubmitting}
      disabled={isSubmitting || !isValid || summary.overLimitCount > 0}
    >
      {isSubmitting ? "로딩 중" : "등록하기"}
    </FooterButton>
  );
}
