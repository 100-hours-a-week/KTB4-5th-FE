"use client";

import type { MypageOverview } from "@/entities/refrigerator";
import { UserAvatar } from "@/entities/user";

export function MyProfileCard({
  overview: data,
}: {
  overview: MypageOverview | undefined;
}) {
  return (
    <div className="flex items-center gap-[14px] rounded-[4px] bg-white p-5 shadow-app-sm">
      <UserAvatar src={data?.profileImageUrl ?? null} size={56} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-app-heading text-[17px] font-black text-app-ink">
          {data?.nickname ?? " "}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-app-ink/55">
          {data?.email ?? " "}
        </span>
      </span>
    </div>
  );
}
