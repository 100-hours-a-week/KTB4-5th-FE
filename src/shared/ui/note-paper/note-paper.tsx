import type { CSSProperties, ReactNode } from "react";

type NotePaperProps = {
  children: ReactNode;
  foldSize?: number;
  className?: string;
};

export function NotePaper({
  children,
  foldSize = 30,
  className = "",
}: NotePaperProps) {
  return (
    <div
      style={{ "--note-fold": `${foldSize}px` } as CSSProperties}
      className={`drop-shadow-[0_2px_5px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] ${className}`}
    >
      <div className="relative rounded-[3px] bg-app-paper [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_var(--note-fold)),calc(100%_-_var(--note-fold))_100%,0_100%)]">
        {children}

        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 size-[var(--note-fold)] rounded-bl-[10px] bg-[image:var(--color-paper-fold)] shadow-[-2px_-2px_5px_rgb(26_26_30_/_12%)] [clip-path:polygon(0_0,100%_0,0_100%)]"
        />
      </div>
    </div>
  );
}
