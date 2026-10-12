import type { ReactNode } from "react";

export type FilterChipTone = "ink" | "primary";

type FilterChipProps = {
  children: ReactNode;
  selected?: boolean;
  tone?: FilterChipTone;
  disabled?: boolean;
  onClick?: () => void;
  onPointerDown?: () => void;
  className?: string;
};

const selectedToneClasses = {
  ink: "bg-app-ink text-white",
  primary: "bg-app-primary text-white",
} satisfies Record<FilterChipTone, string>;

export function FilterChip({
  children,
  className = "",
  disabled = false,
  onClick,
  onPointerDown,
  selected = false,
  tone = "ink",
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={`inline-flex min-h-[var(--tap-min)] flex-none items-center bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <span
        className={`inline-flex items-center whitespace-nowrap rounded-[18px] px-4 py-2 text-[14px] leading-none transition-colors ${
          selected
            ? `font-bold ${selectedToneClasses[tone]}`
            : "border border-app-ink/20 font-normal text-app-ink/60"
        }`}
      >
        {children}
      </span>
    </button>
  );
}
