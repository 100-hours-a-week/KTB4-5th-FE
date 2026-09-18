import type { ReactNode } from "react";

export type ChipTone = "primary" | "highlight" | "neutral";

type ChipProps = {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
};

const toneClasses = {
  primary: "bg-app-primary text-white",
  highlight: "bg-app-warning text-app-ink",
  neutral: "bg-app-neutral-200 text-app-neutral-700",
} satisfies Record<ChipTone, string>;

export function Chip({
  children,
  className = "",
  tone = "neutral",
}: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap px-[9px] py-[3px] text-[11px] font-bold leading-[1.45] ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
