"use client";

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type SyntheticEvent,
} from "react";

import styles from "./app-dialog.module.css";

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
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <span className={styles.tape} aria-hidden="true" />
      <div className={styles.paper}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
        <div className={styles.actions}>
          <button
            ref={secondaryButtonRef}
            type="button"
            className={`${styles.action} ${styles.secondaryAction}`}
            disabled={secondaryAction.disabled}
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </button>
          <button
            type="button"
            className={`${styles.action} ${styles.primaryAction}`}
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
