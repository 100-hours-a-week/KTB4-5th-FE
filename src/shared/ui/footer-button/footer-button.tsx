import type { ComponentPropsWithRef } from "react";

type FooterButtonProps = Omit<ComponentPropsWithRef<"button">, "className"> & {
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
};

const variantClasses = {
  primary:
    "border-app-ink bg-app-ink font-black text-white enabled:hover:bg-app-neutral-800 enabled:active:bg-app-neutral-700",
  secondary:
    "border-[color-mix(in_srgb,var(--color-ink)_18%,transparent)] bg-white font-bold text-app-text enabled:hover:bg-app-neutral-100 enabled:active:bg-app-neutral-200",
} satisfies Record<NonNullable<FooterButtonProps["variant"]>, string>;

// md는 화면 하단 action, sm은 모달·바텀시트 안 action에 쓴다.
const sizeClasses = {
  sm: "border py-[13px] text-[13.5px]",
  md: "border-[1.5px] py-[15px] text-[14px]",
} satisfies Record<NonNullable<FooterButtonProps["size"]>, string>;

export function FooterButton({
  type = "button",
  variant = "primary",
  size = "md",
  ...props
}: FooterButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[4px] text-center font-app-heading leading-[1.2] disabled:cursor-not-allowed disabled:opacity-45 ${sizeClasses[size]} ${variantClasses[variant]}`}
    />
  );
}
