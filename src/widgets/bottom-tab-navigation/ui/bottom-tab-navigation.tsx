"use client";

import {
  ServiceBell1Outlined,
  BoxClosedOutlined,
  Home2Outlined,
  PlusOutlined,
  User4Outlined,
} from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";
import { AppLink } from "@/shared/ui/app-link";

function isActiveRoute(pathname: string, href: string) {
  if (href === routes.home) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

const TAB_ITEM_CLASS_NAME =
  "flex min-h-[var(--tabbar-h)] w-full min-w-0 flex-col items-center justify-center gap-[3px] border-t-[3px] border-transparent bg-transparent px-[2px] pt-[7px] pb-[6px] text-center text-[11px] font-bold leading-none text-app-neutral-600 no-underline transition-colors duration-[140ms] ease-linear hover:text-app-text aria-[current=page]:border-t-app-primary aria-[current=page]:text-app-primary";

export function BottomTabNavigation() {
  const pathname = usePathname();
  const [isRecommendationNoticeOpen, setIsRecommendationNoticeOpen] =
    useState(false);

  return (
    <nav
      data-app-bottom-navigation
      className="relative z-20 flex-none border-t-[var(--rule)] border-app-divider bg-white pr-[var(--safe-right)] pb-[var(--safe-bottom)] pl-[var(--safe-left)]"
      aria-label="주요 메뉴"
    >
      <ul className="grid min-h-[var(--tabbar-h)] grid-cols-5 items-end">
        <li>
          <AppLink
            className="flex min-h-[var(--tabbar-h)] min-w-0 flex-col items-center justify-center gap-[3px] border-t-[3px] border-transparent px-[2px] pt-[7px] pb-[6px] text-center text-[11px] font-bold leading-none text-app-neutral-600 no-underline transition-colors duration-[140ms] ease-linear hover:text-app-text aria-[current=page]:border-t-app-primary aria-[current=page]:text-app-primary"
            href={routes.home}
            aria-current={
              isActiveRoute(pathname, routes.home) ? "page" : undefined
            }
          >
            <Lineicons
              icon={Home2Outlined}
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            />
            <span>홈</span>
          </AppLink>
        </li>
        <li>
          <AppLink
            className="flex min-h-[var(--tabbar-h)] min-w-0 flex-col items-center justify-center gap-[3px] border-t-[3px] border-transparent px-[2px] pt-[7px] pb-[6px] text-center text-[11px] font-bold leading-none text-app-neutral-600 no-underline transition-colors duration-[140ms] ease-linear hover:text-app-text aria-[current=page]:border-t-app-primary aria-[current=page]:text-app-primary"
            href={routes.refrigerator}
            aria-current={
              isActiveRoute(pathname, routes.refrigerator) ? "page" : undefined
            }
          >
            <Lineicons
              icon={BoxClosedOutlined}
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            />
            <span>냉장고</span>
          </AppLink>
        </li>
        <li className="self-stretch">
          <AppLink
            className="group relative flex min-h-[var(--tabbar-h)] min-w-0 flex-col items-center justify-center gap-[3px] px-[2px] pt-[7px] pb-[6px] text-center text-[11px] font-bold leading-none text-app-text no-underline transition-colors duration-[140ms] ease-linear"
            href={routes.registerIngredient}
          >
            <span
              className="-mt-6 grid size-12 place-items-center rounded-app-md border-[var(--rule)] border-app-ink bg-app-primary text-white shadow-app-md transition-colors duration-[140ms] ease-linear group-hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,var(--color-ink))] group-active:translate-y-px"
              aria-hidden="true"
            >
              <Lineicons
                icon={PlusOutlined}
                size={26}
                strokeWidth={2}
                focusable="false"
              />
            </span>
            <span>등록</span>
          </AppLink>
        </li>
        <li>
          <button
            type="button"
            className={TAB_ITEM_CLASS_NAME}
            onClick={() => setIsRecommendationNoticeOpen(true)}
          >
            <Lineicons
              icon={ServiceBell1Outlined}
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            />
            <span>추천</span>
          </button>
        </li>
        <li>
          <AppLink
            className="flex min-h-[var(--tabbar-h)] min-w-0 flex-col items-center justify-center gap-[3px] border-t-[3px] border-transparent px-[2px] pt-[7px] pb-[6px] text-center text-[11px] font-bold leading-none text-app-neutral-600 no-underline transition-colors duration-[140ms] ease-linear hover:text-app-text aria-[current=page]:border-t-app-primary aria-[current=page]:text-app-primary"
            href={routes.me}
            aria-current={
              isActiveRoute(pathname, routes.me) ? "page" : undefined
            }
          >
            <Lineicons
              icon={User4Outlined}
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            />
            <span>마이</span>
          </AppLink>
        </li>
      </ul>

      <AppDialog
        open={isRecommendationNoticeOpen}
        title="추천은 다음 버전에서 만나요."
        description="지금 가진 재료로 만들 수 있는 요리를 준비하고 있어요. 먼저 냉장고와 알림을 써 보세요!"
        primaryAction={{
          label: "알겠어요",
          onClick: () => setIsRecommendationNoticeOpen(false),
        }}
      />
    </nav>
  );
}
