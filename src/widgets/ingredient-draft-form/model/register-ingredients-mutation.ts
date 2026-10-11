import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api";

import {
  invalidateIngredients,
  registerIngredients,
  type RegisterBatchResult,
} from "@/entities/ingredient";

import { getRegisterErrorMessage } from "./register-error-message";

type RegisterIngredientsMutationOptionsParams = {
  queryClient: QueryClient;
  onCompleted: (result: RegisterBatchResult) => void;
  onErrorMessage: (message: string) => void;
  mutationFn?: typeof registerIngredients;
};

export function createRegisterIngredientsMutationOptions({
  queryClient,
  onCompleted,
  onErrorMessage,
  mutationFn = registerIngredients,
}: RegisterIngredientsMutationOptionsParams) {
  return mutationOptions({
    meta: { monitoringOperation: "ingredient.register" },
    mutationFn,
    onSuccess: (result, { refrigeratorId }) => {
      void invalidateIngredients(queryClient, refrigeratorId);
      onCompleted(result);
    },
    onError: (error, { refrigeratorId }) => {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 409)
      ) {
        void invalidateIngredients(queryClient, refrigeratorId);
      }

      const message = getRegisterErrorMessage(error);

      if (message !== null) {
        onErrorMessage(message);
      }
    },
  });
}
