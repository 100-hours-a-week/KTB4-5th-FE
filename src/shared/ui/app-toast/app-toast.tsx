"use client";

import { toast } from "sonner";

export type AppToastAction = {
  label: string;
  onClick: () => void;
};

export type AppToastOptions = {
  message: string;
  variant: "success" | "error";
  dedupeKey?: string;
  action?: AppToastAction;
};

type ActiveToast = {
  id: string | number;
  key: string;
  duration: number;
};

let activeToast: ActiveToast | null = null;

export function AppToast({ message, variant, action }: AppToastOptions) {
  const isSuccess = variant === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex w-full items-center justify-between gap-app-3 rounded-[4px] px-app-4 py-[14px] font-app-body shadow-[0_3px_10px_color-mix(in_srgb,var(--color-ink)_25%,transparent)] [transform:rotate(-0.4deg)] ${
        isSuccess
          ? "bg-app-ink text-app-canvas"
          : "bg-app-primary text-app-canvas"
      }`}
    >
      <span className="line-clamp-2 min-w-0 flex-1 break-words text-[13.5px] font-normal leading-[1.4]">
        {message}
      </span>
      {action ? (
        <button
          type="button"
          className={`-my-[12px] inline-flex min-h-[var(--tap-min)] max-w-[40%] flex-none cursor-pointer items-center justify-center text-[13px] font-bold leading-[1.4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${
            isSuccess ? "text-app-warning" : "text-app-canvas"
          }`}
          onClick={action.onClick}
        >
          <span className="pointer-events-none truncate">{action.label}</span>
        </button>
      ) : null}
    </div>
  );
}

export function showAppToast({
  message,
  variant,
  dedupeKey,
  action,
}: AppToastOptions) {
  const key = dedupeKey ?? `${variant}:${message}`;
  const currentToast = activeToast;
  const isRepeat =
    currentToast !== null &&
    currentToast.key === key &&
    toast.getToasts().some((item) => item.id === currentToast.id);

  if (currentToast && !isRepeat) {
    toast.dismiss(currentToast.id);
  }

  const duration = isRepeat && currentToast.duration === 3000 ? 3001 : 3000;

  const id = toast.custom(
    (toastId) => (
      <AppToast
        message={message}
        variant={variant}
        action={
          action
            ? {
                label: action.label,
                onClick: () => {
                  toast.dismiss(toastId);
                  action.onClick();
                },
              }
            : undefined
        }
      />
    ),
    {
      ...(isRepeat ? { id: currentToast.id } : {}),
      duration,
      onDismiss: (dismissedToast) => {
        if (activeToast?.id === dismissedToast.id) activeToast = null;
      },
      onAutoClose: (closedToast) => {
        if (activeToast?.id === closedToast.id) activeToast = null;
      },
    },
  );

  activeToast = { id, key, duration };
}
