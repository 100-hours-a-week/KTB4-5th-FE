"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  registerIngredients,
  type RegisterBatchResult,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { showAppToast } from "@/shared/ui/app-toast";

import type { IngredientDraftValues } from "./ingredient-draft-form-schema";
import { createRegisterIngredientsMutationOptions } from "./register-ingredients-mutation";
import { toRegisterIngredientItems } from "./to-register-items";
import { useRegisterResultStore } from "./use-register-result-store";

export function useRegisterIngredients(mutationFn = registerIngredients) {
  const [completedResult, setCompletedResult] =
    useState<RegisterBatchResult | null>(null);
  const clearRegisterResult = useRegisterResultStore(
    (state) => state.clearResult,
  );
  const queryClient = useQueryClient();
  const refrigeratorId = useCurrentRefrigeratorId();
  const registerMutation = useMutation(
    createRegisterIngredientsMutationOptions({
      queryClient,
      mutationFn,
      onCompleted: setCompletedResult,
      onErrorMessage: (message) => {
        showAppToast({ message, variant: "error" });
      },
    }),
  );

  function register(drafts: readonly IngredientDraftValues[]) {
    if (registerMutation.isPending) {
      return;
    }

    if (!refrigeratorId) {
      showAppToast({ message: "재고 등록에 실패했어요.", variant: "error" });
      return;
    }

    clearRegisterResult();
    registerMutation.mutate({
      refrigeratorId,
      items: toRegisterIngredientItems(drafts),
    });
  }

  return {
    register,
    isRegistering: registerMutation.isPending,
    completedResult,
  };
}
