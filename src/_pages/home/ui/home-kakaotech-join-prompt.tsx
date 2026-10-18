"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { refrigeratorQueries } from "@/entities/refrigerator";
import {
  KakaotechJoinCard,
  useKakaotechJoinPrompt,
  dismissKakaotechJoinPrompt,
} from "@/features/share-refrigerator";
import { showAppToast } from "@/shared/ui/app-toast";

export function HomeKakaotechJoinPrompt({
  refrigeratorId,
}: {
  refrigeratorId: string;
}) {
  const pending = useKakaotechJoinPrompt(refrigeratorId);
  const [dismissed, setDismissed] = useState(false);
  const enabled =
    Boolean(process.env.NEXT_PUBLIC_KAKAOTECH_INVITE_CODE) &&
    pending &&
    !dismissed;
  const { data } = useQuery({
    ...refrigeratorQueries.members(refrigeratorId),
    enabled,
  });

  if (
    !enabled ||
    !data ||
    data.memberCount !== 1 ||
    !data.members.some(
      (member) =>
        member.userId === data.currentUserId && member.role === "owner",
    )
  )
    return null;

  return (
    <div className="px-5 pt-6">
      <KakaotechJoinCard
        onDismiss={() => {
          setDismissed(true);
          dismissKakaotechJoinPrompt(refrigeratorId);
          showAppToast({
            message: "마이페이지 냉장고 공유 기능에서 참여하실 수 있습니다.",
            variant: "success",
          });
        }}
      />
    </div>
  );
}
