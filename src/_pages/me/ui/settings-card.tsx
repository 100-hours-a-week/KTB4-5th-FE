type SettingsCardProps = {
  title: string;
  description?: string;
  trailingText?: string;
  ariaLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export function SettingsCard({
  title,
  description,
  trailingText,
  ariaLabel = title,
  disabled = false,
  onClick,
}: SettingsCardProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-[4px] bg-white px-[18px] py-4 text-left shadow-app-sm transition-colors hover:bg-app-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-primary active:bg-app-neutral-200 disabled:pointer-events-none disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block text-[15.5px] font-bold text-app-ink">
          {title}
        </span>
        {description ? (
          <span className="mt-1 block text-sm text-app-ink/55">
            {description}
          </span>
        ) : null}
      </span>

      <span className="flex shrink-0 items-center gap-3">
        {trailingText ? (
          <span className="text-xs text-app-ink/35">{trailingText}</span>
        ) : null}
        <span
          aria-hidden="true"
          className="text-xl font-bold leading-none text-app-ink/35"
        >
          ›
        </span>
      </span>
    </button>
  );
}
