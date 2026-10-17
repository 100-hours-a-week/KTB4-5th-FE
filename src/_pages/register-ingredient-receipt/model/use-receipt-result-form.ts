"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  imageAnalysisQueries,
  useRegisteredAnalyses,
  type ImageAnalysisList,
} from "@/entities/image";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { useNotificationSessionScope } from "@/entities/notification";
import { registerIngredientsFromAnalysis } from "@/entities/ingredient";
import { showAppToast } from "@/shared/ui/app-toast";
import {
  ingredientDraftFormSchema,
  type IngredientDraftFormInput,
  type IngredientDraftFormValues,
  useDraftExpansion,
  useRegisterIngredients,
} from "@/widgets/ingredient-draft-form";

import { toAnalysisRegistrationBody } from "./to-analysis-registration-body";

import {
  limitRecognitionResult,
  getRecognitionStatus,
  type ReceiptRecognitionResult,
} from "./receipt-recognition";

export function useReceiptResultForm(
  recognitionResult: ReceiptRecognitionResult,
) {
  const queryClient = useQueryClient();
  const userScope = useNotificationSessionScope();
  const markRegistered = useRegisteredAnalyses((state) => state.markRegistered);
  const [result] = useState(() => limitRecognitionResult(recognitionResult));
  const [hints, setHints] = useState(result.hints);
  const [expirationNotes, setExpirationNotes] = useState(
    result.expirationNotes,
  );
  const [origins, setOrigins] = useState(result.origins);
  const { register, isRegistering, completedResult } = useRegisterIngredients(
    async ({ refrigeratorId, items }) => {
      const registered = await registerIngredientsFromAnalysis({
        refrigeratorId,
        body: toAnalysisRegistrationBody(result.analysisId, origins, items),
      });
      if (userScope) markRegistered(userScope, result.analysisId);
      queryClient.setQueriesData<ImageAnalysisList>(
        { queryKey: imageAnalysisQueries.lists() },
        (current) =>
          current && {
            analyses: current.analyses.filter(
              (analysis) => analysis.analysisId !== result.analysisId,
            ),
          },
      );
      void queryClient.invalidateQueries({
        queryKey: imageAnalysisQueries.lists(),
      });
      return registered;
    },
  );
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
    setOrigins((current) => current.filter((_, i) => i !== index));
    setHints((current) => current.filter((_, i) => i !== index));
    setExpirationNotes((current) => current.filter((_, i) => i !== index));
    shiftAfterRemove(index);
  }

  function submitDrafts(values: IngredientDraftFormValues) {
    register(values.drafts);
  }

  return {
    form,
    fields,
    statuses,
    expirationNotes,
    hasUncertain: statuses.some((status) => status !== "RECOGNIZED"),
    hasUnsetExpiration: drafts.some((draft) => draft.expirationDate === ""),
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
