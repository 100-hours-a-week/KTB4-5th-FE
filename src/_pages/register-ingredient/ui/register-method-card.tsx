import { Lineicons, type LineiconsProps } from "@lineiconshq/react-lineicons";

import { AppLink } from "@/shared/ui/app-link";
import { NotePaper } from "@/shared/ui/note-paper";

type RegisterMethodCardProps = {
  href: string;
  icon: LineiconsProps["icon"];
  title: string;
  description: string;
  disabled?: boolean;
  onDisabledClick?: () => void;
};

const CARD_CLASS_NAME =
  "flex flex-col items-start rounded-[3px] p-5 no-underline";

export function RegisterMethodCard({
  href,
  icon,
  title,
  description,
  disabled = false,
  onDisabledClick,
}: RegisterMethodCardProps) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="grid size-12 flex-none place-items-center rounded-[8px] bg-app-warning/15 text-app-ink/65"
      >
        <Lineicons icon={icon} size={24} strokeWidth={1.8} focusable="false" />
      </span>
      <span className="mt-2.5 block min-w-0">
        <span className="block font-app-heading text-[18px] font-black leading-[26px] text-app-ink">
          {title}
        </span>
        <span className="mt-2.5 block min-h-10 break-keep text-[13.5px] leading-5 text-app-ink/55">
          {description}
        </span>
      </span>
    </>
  );

  if (disabled) {
    return (
      <NotePaper className="opacity-45">
        <button
          type="button"
          aria-disabled="true"
          onClick={onDisabledClick}
          className={`${CARD_CLASS_NAME} w-full cursor-not-allowed border-0 bg-transparent text-left`}
        >
          {content}
        </button>
      </NotePaper>
    );
  }

  return (
    <NotePaper>
      <AppLink href={href} className={`${CARD_CLASS_NAME} hover:bg-app-ink/4`}>
        {content}
      </AppLink>
    </NotePaper>
  );
}
