import type { ReactNode } from "react";

export type BadgeTone = "solid" | "muted" | "outline" | "primary" | "highlight";
export type BadgeSize = "sm" | "md";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
};

const toneClasses = {
  solid: "bg-app-ink text-white",
  muted: "bg-app-neutral-200 text-app-ink",
  outline:
    "border-[1.5px] border-app-neutral-300 bg-white text-app-neutral-700",
  primary: "bg-app-primary text-white",
  highlight: "bg-app-warning text-app-ink",
} satisfies Record<BadgeTone, string>;

const sizeClasses = {
  sm: "px-[9px] py-[3px] text-[11px] leading-[1.45]",
  md: "h-[30px] min-w-[51px] justify-center rounded-full px-[14px] text-[12px]",
} satisfies Record<BadgeSize, string>;

export function Badge({
  children,
  className = "",
  size = "sm",
  tone = "muted",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap font-bold ${sizeClasses[size]} ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
