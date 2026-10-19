"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { rotateNotificationSessionScope } from "@/entities/notification";
import { setCurrentRefrigeratorId } from "@/entities/refrigerator";

import { completeOAuthSignup } from "../api/complete-oauth-signup";

export function useCompleteOAuthSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOAuthSignup,
    onSuccess: ({ data }) => {
      queryClient.removeQueries();
      rotateNotificationSessionScope();
      setCurrentRefrigeratorId(data.activeRefrigeratorIds[0] ?? null);
    },
  });
}
