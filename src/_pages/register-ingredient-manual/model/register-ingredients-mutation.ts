import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import {
  ingredientQueries,
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
    mutationFn,
    onSuccess: (result, { refrigeratorId }) => {
      void queryClient.invalidateQueries({
        queryKey: ingredientQueries.byRefrigerator(refrigeratorId),
      });
      onCompleted(result);
    },
    onError: (error) => {
      const message = getRegisterErrorMessage(error);

      if (message !== null) {
        onErrorMessage(message);
      }
    },
  });
}
