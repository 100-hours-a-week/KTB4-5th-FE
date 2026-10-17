import { requestJson } from "@/shared/api";

import type { MypageOverview } from "../model/mypage-overview";

type MypageOverviewDto = MypageOverview;

export async function getMypageOverview({
  refrigeratorId,
  signal,
}: {
  refrigeratorId: string;
  signal?: AbortSignal;
}): Promise<MypageOverview> {
  const { data } = await requestJson<MypageOverviewDto>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/mypage`,
    { signal },
  );

  return {
    ...data,
    email: data.email ?? null,
    profileImageUrl: data.profileImageUrl ?? null,
  };
}
