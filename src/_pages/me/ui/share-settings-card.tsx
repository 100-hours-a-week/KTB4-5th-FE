"use client";

import { useQuery } from "@tanstack/react-query";

import {
  refrigeratorQueries,
  useCurrentRefrigeratorId,
} from "@/entities/refrigerator";
import { routes } from "@/shared/routes";

import { SettingsCard } from "./settings-card";

export function ShareSettingsCard() {
  const refrigeratorId = useCurrentRefrigeratorId();
  const { data } = useQuery({
    ...refrigeratorQueries.members(refrigeratorId ?? ""),
    enabled: Boolean(refrigeratorId),
  });

  return (
    <SettingsCard
      title="냉장고 공유"
      href={routes.refrigeratorShare}
      trailingText={
        data
          ? data.memberCount <= 1
            ? "혼자 쓰는 중"
            : `${data.memberCount}명`
          : undefined
      }
    />
  );
}
