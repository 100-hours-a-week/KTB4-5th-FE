"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  createRecommendationJob,
  recommendationQueries,
} from "@/entities/recommendation";

export function useRecommendations(refrigeratorId: string | null | undefined) {
  const query = useQuery({
    ...recommendationQueries.list(refrigeratorId ?? ""),
    enabled: Boolean(refrigeratorId),
    refetchOnMount: "always",
  });
  const job = useMutation({
    mutationFn: (id: string) => createRecommendationJob(id),
  });
  const attempted = useRef<string | null>(null);
  const { mutate, reset } = job;

  useEffect(() => reset(), [refrigeratorId, reset]);

  useEffect(() => {
    if (
      !refrigeratorId ||
      !query.isFetchedAfterMount ||
      query.isError ||
      query.isFetching ||
      !query.data
    )
      return;
    const attempt = `${refrigeratorId}:${query.dataUpdatedAt}`;
    if (attempted.current === attempt) return;
    attempted.current = attempt;
    if (query.data.status === "STALE" || query.data.status === "EMPTY") {
      mutate(refrigeratorId);
    }
  }, [
    refrigeratorId,
    query.isFetchedAfterMount,
    query.isError,
    query.isFetching,
    query.data,
    query.dataUpdatedAt,
    mutate,
  ]);

  return { ...query, job };
}
