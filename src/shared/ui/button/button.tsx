import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ink" | "highlight";
  shape?: "pill" | "note";
  loading?: boolean;
};

const variantClasses = {
  ink: "bg-app-ink text-app-canvas enabled:hover:bg-app-neutral-800",
  highlight: "bg-app-warning text-app-ink enabled:hover:brightness-95",
} satisfies Record<NonNullable<ButtonProps["variant"]>, string>;

const shapeClasses = {
  pill: "min-h-12 rounded-full",
  note: "min-h-[52px] rounded-[4px]",
} satisfies Record<NonNullable<ButtonProps["shape"]>, string>;

export function Button({
  children,
  className = "",
  disabled,
  loading = false,
  shape = "pill",
  type = "button",
  variant = "ink",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 text-center font-app-heading text-base font-black transition-colors disabled:cursor-not-allowed disabled:bg-app-neutral-200 disabled:text-app-neutral-500 ${shapeClasses[shape]} ${variantClasses[variant]} ${className}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {children}
    </button>
  );
}
