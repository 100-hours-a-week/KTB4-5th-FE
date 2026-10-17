"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteImageAnalysis } from "../api/delete-image-analysis";
import { imageAnalysisQueries } from "../api/image-analysis.queries";

export function useDeleteImageAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { monitoringOperation: "image.analysis.delete" },
    mutationFn: deleteImageAnalysis,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: imageAnalysisQueries.lists(),
      }),
  });
}
