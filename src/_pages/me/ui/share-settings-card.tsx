"use client";

import { routes } from "@/shared/routes";

import { SettingsCard } from "./settings-card";

export function ShareSettingsCard({
  memberNum,
}: {
  memberNum: number | undefined;
}) {
  return (
    <SettingsCard
      title="냉장고 공유"
      href={routes.refrigeratorShare}
      trailingText={
        memberNum === undefined
          ? undefined
          : memberNum <= 1
            ? "혼자 쓰는 중"
            : `${memberNum}명`
      }
    />
  );
}
