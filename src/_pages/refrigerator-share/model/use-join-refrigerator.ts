"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  refrigeratorQueries,
  setCurrentRefrigeratorId,
} from "@/entities/refrigerator";
import { joinRefrigerator } from "@/features/share-refrigerator";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { showAppToast } from "@/shared/ui/app-toast";

export function useJoinRefrigerator({
  onError,
}: {
  onError: (error: unknown) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinRefrigerator,
    onSuccess: async (refrigeratorId) => {
      await queryClient.invalidateQueries({
        queryKey: refrigeratorQueries.all(),
      });
      setCurrentRefrigeratorId(refrigeratorId);
      markAppNavigationIntent("replace", routes.home);
      router.replace(routes.home);
      showAppToast({ message: "함께 쓰기 시작했어요", variant: "success" });
    },
    onError,
  });
}
