import type { ReactNode } from "react";

import { AppLink } from "@/shared/ui/app-link";

type LinkCardProps = {
  href: string;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  trailingCaption?: ReactNode;
  className?: string;
};

export function LinkCard({
  className = "",
  description,
  href,
  title,
  trailing,
  trailingCaption,
}: LinkCardProps) {
  return (
    <AppLink
      href={href}
      className={`flex items-center gap-3.5 rounded-[4px] bg-white px-[18px] py-4 no-underline shadow-app-sm hover:bg-app-neutral-100 active:bg-app-neutral-200 ${className}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-app-heading text-[18px] font-black leading-tight text-app-ink">
          {title}
        </span>
        {description ? (
          <span className="mt-1 block truncate text-[13px] leading-tight text-app-ink/55">
            {description}
          </span>
        ) : null}
      </span>

      {trailing || trailingCaption ? (
        <span className="flex flex-none flex-col items-end gap-2">
          {trailing}
          {trailingCaption ? (
            <span className="text-[12px] leading-tight text-app-ink/55">
              {trailingCaption}
            </span>
          ) : null}
        </span>
      ) : null}
    </AppLink>
  );
}
