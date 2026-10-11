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
  useRegisterIngredients,
} from "@/widgets/ingredient-draft-form";

import {
  limitRecognitionResult,
  getRecognitionStatus,
  type ReceiptRecognitionResult,
} from "./receipt-recognition";

export function useReceiptResultForm(
  recognitionResult: ReceiptRecognitionResult,
) {
  const [result] = useState(() => limitRecognitionResult(recognitionResult));
  const [hints, setHints] = useState(result.hints);
  const [sources, setSources] = useState(result.sources);
  const { register, isRegistering, completedResult } = useRegisterIngredients();
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
    setSources((current) => current.filter((_, i) => i !== index));
    shiftAfterRemove(index);
  }

  function submitDrafts(values: IngredientDraftFormValues) {
    register(
      values.drafts.map((draft, index) => ({
        ...draft,
        registrationSource: sources[index],
      })),
    );
  }

  return {
    form,
    fields,
    statuses,
    hasUncertain: statuses.some((status) => status !== "RECOGNIZED"),
    photoCount: result.photoCount,
    isTruncated: result.isTruncated,
    expandedIndex,
    toggle,
    removeDraft,
    submit: form.handleSubmit(submitDrafts),
    isRegistering,
    completedResult,
  };
}
