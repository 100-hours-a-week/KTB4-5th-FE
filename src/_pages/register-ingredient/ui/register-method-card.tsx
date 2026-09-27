import { Lineicons, type LineiconsProps } from "@lineiconshq/react-lineicons";

import { AppLink } from "@/shared/ui/app-link";
import { NotePaper } from "@/shared/ui/note-paper";

type RegisterMethodCardProps = {
  href: string;
  icon: LineiconsProps["icon"];
  title: string;
  description: string;
  disabled?: boolean;
};

const CARD_CLASS_NAME =
  "flex items-center gap-3 rounded-[3px] px-4 py-3.5 no-underline";

export function RegisterMethodCard({
  href,
  icon,
  title,
  description,
  disabled = false,
}: RegisterMethodCardProps) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="grid size-10 flex-none place-items-center rounded-[8px] border-[1.5px] border-dashed border-app-ink/30 text-app-ink/65"
      >
        <Lineicons icon={icon} size={20} strokeWidth={1.8} focusable="false" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-app-heading text-[16px] font-black leading-tight text-app-ink">
          {title}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-tight text-app-ink/55">
          {description}
        </span>
      </span>
    </>
  );

  if (disabled) {
    return (
      <NotePaper className="opacity-45">
        <div aria-disabled="true" className={CARD_CLASS_NAME}>
          {content}
        </div>
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
