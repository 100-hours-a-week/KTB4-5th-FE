"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ingredientQueries } from "@/entities/ingredient";
import {
  refrigeratorQueries,
  setCurrentRefrigeratorId,
  useCurrentRefrigeratorId,
} from "@/entities/refrigerator";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { showAppToast } from "@/shared/ui/app-toast";

import { joinRefrigerator } from "../api/share-refrigerator";
import { dismissKakaotechJoinPrompt } from "./kakaotech-join-prompt";

export function useJoinRefrigerator({
  onError,
}: {
  onError: (error: unknown) => void;
}) {
  const router = useRouter();
  const currentRefrigeratorId = useCurrentRefrigeratorId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinRefrigerator,
    onSuccess: (refrigeratorId) => {
      if (currentRefrigeratorId) {
        dismissKakaotechJoinPrompt(currentRefrigeratorId);
      }
      queryClient.removeQueries({
        queryKey: ingredientQueries.byRefrigerator(refrigeratorId),
      });
      void queryClient.invalidateQueries({
        queryKey: refrigeratorQueries.all(),
        refetchType: "none",
      });
      setCurrentRefrigeratorId(refrigeratorId);
      if (window.location.pathname !== routes.home) {
        markAppNavigationIntent("replace", routes.home);
        router.replace(routes.home);
      }
      showAppToast({ message: "함께 쓰기 시작했어요", variant: "success" });
    },
    onError,
  });
}
