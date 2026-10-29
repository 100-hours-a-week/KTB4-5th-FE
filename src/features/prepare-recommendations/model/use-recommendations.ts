"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  createRecommendationJob,
  recommendationQueries,
} from "@/entities/recommendation";

export function useRecommendations(refrigeratorId: string | null | undefined) {
  const queryClient = useQueryClient();
  const job = useMutation({
    mutationFn: (id: string) => createRecommendationJob(id),
    onSuccess: (_, id) =>
      queryClient.invalidateQueries({
        queryKey: recommendationQueries.list(id).queryKey,
      }),
  });
  const query = useQuery({
    ...recommendationQueries.list(refrigeratorId ?? ""),
    enabled: Boolean(refrigeratorId),
    refetchOnMount: "always",
  });
  const { mutate, reset } = job;

  useEffect(() => reset(), [refrigeratorId, reset]);

  const regenerate = () => {
    if (refrigeratorId) mutate(refrigeratorId);
  };

  return { ...query, job, regenerate };
}
