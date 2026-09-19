import type { ComponentPropsWithRef } from "react";

type FooterButtonProps = Omit<ComponentPropsWithRef<"button">, "className"> & {
  variant?: "primary" | "secondary";
};

const variantClasses = {
  primary:
    "border-app-ink bg-app-ink font-black text-white enabled:hover:bg-app-neutral-800 enabled:active:bg-app-neutral-700",
  secondary:
    "border-[color-mix(in_srgb,var(--color-ink)_18%,transparent)] bg-white font-bold text-app-text enabled:hover:bg-app-neutral-100 enabled:active:bg-app-neutral-200",
} satisfies Record<NonNullable<FooterButtonProps["variant"]>, string>;

export function FooterButton({
  type = "button",
  variant = "primary",
  ...props
}: FooterButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[4px] border py-[14px] text-center font-app-heading text-[13px] leading-[1.2] disabled:cursor-not-allowed disabled:opacity-45 ${variantClasses[variant]}`}
    />
  );
}
