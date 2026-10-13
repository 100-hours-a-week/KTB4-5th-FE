import type { ReactNode } from "react";

import { AppLink } from "@/shared/ui/app-link";

type SettingsCardProps = {
  title: string;
  trailingText?: ReactNode;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
};

const rowClassName =
  "flex w-full items-center justify-between gap-3 bg-transparent px-4 py-4 text-left no-underline transition-colors hover:bg-app-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-app-primary active:bg-app-neutral-200 disabled:pointer-events-none disabled:opacity-50";

export function SettingsCard({
  title,
  trailingText,
  disabled = false,
  href,
  onClick,
}: SettingsCardProps) {
  const content = (
    <>
      <span className="min-w-0 text-[15px] font-bold text-app-ink">
        {title}
      </span>

      <span className="flex shrink-0 items-center gap-3">
        {trailingText ? (
          <span className="text-[13px] text-app-ink/55">{trailingText}</span>
        ) : null}
        <span
          aria-hidden="true"
          className="text-xl font-bold leading-none text-app-ink/35"
        >
          ›
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <AppLink href={href} className={rowClassName}>
        {content}
      </AppLink>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={rowClassName}
    >
      {content}
    </button>
  );
}
