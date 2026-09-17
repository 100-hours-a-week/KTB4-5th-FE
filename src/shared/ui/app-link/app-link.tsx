"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { markAppNavigationIntent } from "@/shared/lib/navigation-history";

export type AppLinkProps = Omit<
  ComponentProps<typeof Link>,
  "href" | "onNavigate"
> & {
  href: string;
};

export function AppLink({ href, replace = false, ...props }: AppLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      replace={replace}
      onNavigate={() => {
        markAppNavigationIntent(replace ? "replace" : "push", href);
      }}
    />
  );
}
