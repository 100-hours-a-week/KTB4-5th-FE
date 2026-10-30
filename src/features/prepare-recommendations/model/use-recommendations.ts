"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  createRecommendationJob,
  recommendationQueries,
  switchToNewRecommendation,
  type RecommendationJobRequest,
} from "@/entities/recommendation";

export function useRecommendations(refrigeratorId: string | null | undefined) {
  const queryClient = useQueryClient();
  const invalidate = (id: string) =>
    queryClient.invalidateQueries({
      queryKey: recommendationQueries.list(id).queryKey,
    });
  const job = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: RecommendationJobRequest;
    }) => createRecommendationJob(id, body),
    onSuccess: (_, { id }) => invalidate(id),
  });
  const switchJob = useMutation({
    mutationFn: switchToNewRecommendation,
    onSuccess: (_, id) => invalidate(id),
  });
  const query = useQuery({
    ...recommendationQueries.list(refrigeratorId ?? ""),
    enabled: Boolean(refrigeratorId),
    refetchOnMount: "always",
  });
  const { mutate, reset } = job;

  useEffect(() => reset(), [refrigeratorId, reset]);

  const regenerate = (
    body?: RecommendationJobRequest,
    options?: Parameters<typeof mutate>[1],
  ) => {
    if (refrigeratorId) mutate({ id: refrigeratorId, body }, options);
  };
  const switchToNew = () => {
    if (refrigeratorId) switchJob.mutate(refrigeratorId);
  };

  return { ...query, job, regenerate, switchJob, switchToNew };
}
