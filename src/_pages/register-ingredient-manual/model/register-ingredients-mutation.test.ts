import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api";

import { createRegisterIngredientsMutationOptions } from "./register-ingredients-mutation";

const VARIABLES = {
  refrigeratorId: "refrigerator-1",
  items: [
    {
      name: "우유",
      category: "OTHER" as const,
      storageType: "REFRIGERATED" as const,
      measureType: "COUNT" as const,
      quantity: 1,
      weightValue: null,
      weightUnit: "NONE" as const,
      expirationDate: "2026-09-25",
      registrationSource: "DIRECT" as const,
    },
  ],
};

const RESULT = {
  createdCount: 1,
  mergedCount: 0,
  ingredientsNum: 1,
  refrigeratorCapacity: 100,
  mergedItems: [],
};

describe("register ingredients mutation lifecycle", () => {
  it("invalidates the registered refrigerator and completes after success", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();
    const onCompleted = vi.fn();
    const onErrorMessage = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue(RESULT);
    const mutation = queryClient.getMutationCache().build(
      queryClient,
      createRegisterIngredientsMutationOptions({
        queryClient,
        onCompleted,
        onErrorMessage,
        mutationFn,
      }),
    );

    await expect(mutation.execute(VARIABLES)).resolves.toEqual(RESULT);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["refrigerators", "refrigerator-1", "ingredients"],
    });
    expect(onCompleted).toHaveBeenCalledWith(RESULT);
    expect(onErrorMessage).not.toHaveBeenCalled();
  });

  it("keeps submitted values and skips success effects after failure", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const onCompleted = vi.fn();
    const onErrorMessage = vi.fn();
    const error = new ApiError(409, {
      code: "INGREDIENT-409-001",
      title: "용량 초과",
      status: 409,
    });
    const mutationFn = vi.fn().mockRejectedValue(error);
    const submittedValues = structuredClone(VARIABLES);
    const mutation = queryClient.getMutationCache().build(
      queryClient,
      createRegisterIngredientsMutationOptions({
        queryClient,
        onCompleted,
        onErrorMessage,
        mutationFn,
      }),
    );

    await expect(mutation.execute(VARIABLES)).rejects.toBe(error);

    expect(VARIABLES).toEqual(submittedValues);
    expect(onErrorMessage).toHaveBeenCalledWith(
      "냉장고 용량 또는 재고 합산 한도를 확인해 주세요",
    );
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(onCompleted).not.toHaveBeenCalled();
  });
});
