"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setCurrentRefrigeratorId } from "@/entities/refrigerator";

import { login } from "../api/login";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: ({ data }) => {
      queryClient.removeQueries();
      setCurrentRefrigeratorId(data.activeRefrigeratorIds[0] ?? null);
    },
  });
}
