export function CheckMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-[22px] flex-none items-center justify-center rounded-[5px] border-2 border-app-neutral-400 bg-white text-transparent peer-checked:border-app-ink peer-checked:bg-app-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-app-ink"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5"
      >
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    </span>
  );
}
