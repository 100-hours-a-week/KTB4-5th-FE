"use client";

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type SyntheticEvent,
} from "react";

export type AppDialogDismissBehavior = "secondary-action" | "none";

export type AppDialogAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export type AppDialogProps = {
  open: boolean;
  title: string;
  description: string;
  secondaryAction: AppDialogAction;
  primaryAction: AppDialogAction;
  dismissBehavior?: AppDialogDismissBehavior;
};

let scrollLockCount = 0;
let previousRootOverflow = "";
let previousBodyOverflow = "";

function lockDocumentScroll() {
  if (scrollLockCount === 0) {
    previousRootOverflow = document.documentElement.style.overflow;
    previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  scrollLockCount += 1;

  return () => {
    scrollLockCount = Math.max(0, scrollLockCount - 1);

    if (scrollLockCount === 0) {
      document.documentElement.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
    }
  };
}

export function AppDialog({
  open,
  title,
  description,
  secondaryAction,
  primaryAction,
  dismissBehavior = "secondary-action",
}: AppDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const secondaryButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || !open) {
      return;
    }

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (!dialog.open) {
      dialog.showModal();
    }

    secondaryButtonRef.current?.focus();
    const unlockDocumentScroll = lockDocumentScroll();

    return () => {
      unlockDocumentScroll();

      if (dialog.open) {
        dialog.close();
      }

      returnFocusRef.current?.focus();
    };
  }, [open]);

  function runDismissAction() {
    if (dismissBehavior === "secondary-action" && !secondaryAction.disabled) {
      secondaryAction.onClick();
    }
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    runDismissAction();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const clickedOutsideDialog =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (clickedOutsideDialog) {
      runDismissAction();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(320px,calc(100%-32px))] max-w-none overflow-visible border-0 bg-transparent p-[11px_0_0] text-app-text backdrop:bg-[color-mix(in_srgb,var(--color-ink)_58%,transparent)]"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <span
        className="pointer-events-none absolute top-0 left-6 z-[1] h-5 w-[58px] bg-[color-mix(in_srgb,var(--color-highlight)_80%,transparent)]"
        aria-hidden="true"
      />
      <div className="relative max-h-[calc(100dvh_-_var(--safe-top)_-_var(--safe-bottom)_-_43px)] overflow-y-auto rounded-[4px] bg-white p-5 shadow-[0_4px_16px_color-mix(in_srgb,var(--color-ink)_16%,transparent)]">
        <h2
          id={titleId}
          className="m-[5px_0_0] font-app-heading text-[19px] font-black leading-[1.35] tracking-normal"
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          className="m-[5px_0_0] whitespace-pre-wrap font-app-body text-[13px] font-normal leading-[1.35] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)]"
        >
          {description}
        </p>
        <div className="mt-[18px] flex gap-[10px]">
          <button
            ref={secondaryButtonRef}
            type="button"
            className="inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[4px] border border-[color-mix(in_srgb,var(--color-ink)_18%,transparent)] bg-white py-[14px] text-center font-app-heading text-[13px] font-bold leading-[1.2] text-app-text enabled:hover:bg-app-neutral-100 enabled:active:bg-app-neutral-200 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={secondaryAction.disabled}
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </button>
          <button
            type="button"
            className="inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[4px] border border-app-primary bg-app-primary py-[14px] text-center font-app-heading text-[13px] font-black leading-[1.2] text-white enabled:hover:border-[color-mix(in_srgb,var(--color-primary)_88%,var(--color-ink))] enabled:hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,var(--color-ink))] enabled:active:border-[color-mix(in_srgb,var(--color-primary)_72%,var(--color-ink))] enabled:active:bg-[color-mix(in_srgb,var(--color-primary)_72%,var(--color-ink))] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={primaryAction.disabled}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </button>
        </div>
      </div>
    </dialog>
  );
}
