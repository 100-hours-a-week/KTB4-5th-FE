"use client";

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type SyntheticEvent,
} from "react";

import { FooterButton } from "@/shared/ui/footer-button";

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
  secondaryAction?: AppDialogAction;
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
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const backdropPointerDownRef = useRef(false);
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

    (secondaryButtonRef.current ?? primaryButtonRef.current)?.focus();
    const unlockDocumentScroll = lockDocumentScroll();

    return () => {
      unlockDocumentScroll();

      if (dialog.open) {
        dialog.close();
      }

      returnFocusRef.current?.focus();
    };
  }, [open]);

  // 보조 행동이 없는 단일 버튼 모달에서는 주 행동이 닫기와 같은 의미를 갖는다.
  const dismissAction = secondaryAction ?? primaryAction;

  function runDismissAction() {
    if (dismissBehavior === "secondary-action" && !dismissAction.disabled) {
      dismissAction.onClick();
    }
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    runDismissAction();
  }

  function isPointerOutsideDialog(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) {
      return false;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    return (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    );
  }

  function handleBackdropPointerDown(event: MouseEvent<HTMLDialogElement>) {
    backdropPointerDownRef.current = isPointerOutsideDialog(event);
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const startedOnBackdrop = backdropPointerDownRef.current;

    backdropPointerDownRef.current = false;

    if (startedOnBackdrop && isPointerOutsideDialog(event)) {
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
      onPointerDown={handleBackdropPointerDown}
      onClick={handleBackdropClick}
    >
      <span
        className="pointer-events-none absolute top-0 left-1/2 z-[1] h-5 w-[58px] -translate-x-1/2 -rotate-3 bg-[color-mix(in_srgb,var(--color-highlight)_80%,transparent)]"
        aria-hidden="true"
      />
      <div className="relative max-h-[calc(100dvh_-_var(--safe-top)_-_var(--safe-bottom)_-_43px)] overflow-y-auto rounded-[4px] bg-white p-4 shadow-[0_4px_16px_color-mix(in_srgb,var(--color-ink)_16%,transparent)]">
        <h2
          id={titleId}
          className="m-[5px_0_0] font-app-heading text-[16px] font-black leading-[1.35] tracking-normal"
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          className="m-[5px_0_0] whitespace-pre-wrap font-app-body text-[12.5px] font-normal leading-[1.35] text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)]"
        >
          {description}
        </p>
        <div className="mt-4 flex gap-2">
          {secondaryAction ? (
            <FooterButton
              size="sm"
              ref={secondaryButtonRef}
              variant="secondary"
              disabled={secondaryAction.disabled}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </FooterButton>
          ) : null}
          <FooterButton
            size="sm"
            ref={primaryButtonRef}
            disabled={primaryAction.disabled}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </FooterButton>
        </div>
      </div>
    </dialog>
  );
}
