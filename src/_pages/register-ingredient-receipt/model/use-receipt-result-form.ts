"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { showAppToast } from "@/shared/ui/app-toast";
import {
  ingredientDraftFormSchema,
  type IngredientDraftFormInput,
  type IngredientDraftFormValues,
  useDraftExpansion,
} from "@/widgets/ingredient-draft-form";

import {
  createMockRecognitionResult,
  getRecognitionStatus,
} from "./receipt-recognition";

export function useReceiptResultForm() {
  const [result] = useState(createMockRecognitionResult);
  const [hints, setHints] = useState(result.hints);
  const form = useForm<
    IngredientDraftFormInput,
    unknown,
    IngredientDraftFormValues
  >({
    resolver: zodResolver(ingredientDraftFormSchema),
    mode: "onChange",
    defaultValues: { drafts: result.drafts },
  });
  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "drafts",
  });
  const drafts = useWatch({ control: form.control, name: "drafts" }) ?? [];
  const { expandedIndex, toggle, shiftAfterRemove } = useDraftExpansion(
    Math.max(
      result.drafts.findIndex((draft) => draft.expirationDate === ""),
      0,
    ),
  );

  useEffect(() => {
    void form.trigger();

    const unsetCount = result.drafts.filter(
      (draft) => draft.expirationDate === "",
    ).length;

    if (unsetCount > 0) {
      showAppToast({
        message: `유통기한 ${unsetCount}건을 직접 입력해 주세요`,
        variant: "success",
      });
    }
  }, [form, result]);

  const statuses = drafts.map((draft, index) =>
    getRecognitionStatus(draft, hints[index] ?? null),
  );

  function removeDraft(index: number) {
    remove(index);
    setHints((current) => current.filter((_, i) => i !== index));
    shiftAfterRemove(index);
  }

  function submitDrafts() {
    // TODO: 등록 API 연결 전이라 막아 둔다.
    showAppToast({
      message: "영수증 등록은 아직 준비 중이에요",
      variant: "error",
    });
  }

  return {
    form,
    fields,
    statuses,
    hasUncertain: statuses.some((status) => status !== "RECOGNIZED"),
    photoCount: result.photoCount,
    expandedIndex,
    toggle,
    removeDraft,
    submit: form.handleSubmit(submitDrafts),
  };
}
