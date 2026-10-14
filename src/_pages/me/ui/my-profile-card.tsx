"use client";

import { useQuery } from "@tanstack/react-query";

import { UserAvatar, userQueries } from "@/entities/user";
import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";

export function MyProfileCard() {
  const { data } = useQuery(userQueries.me());

  return (
    <AppLink
      href={routes.myProfile}
      aria-label="개인 설정으로 이동"
      className="flex items-center gap-[14px] rounded-[4px] bg-white p-5 no-underline shadow-app-sm hover:bg-app-neutral-100 active:bg-app-neutral-200"
    >
      <UserAvatar src={data?.profileImageUrl ?? null} size={56} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-app-heading text-[17px] font-black text-app-ink">
          {data?.nickname ?? " "}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-app-ink/55">
          {data?.email ?? " "}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="text-xl font-bold leading-none text-app-ink/35"
      >
        ›
      </span>
    </AppLink>
  );
}
