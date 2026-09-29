"use client";

import { Bug1Outlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useState } from "react";

import { BugReportSheet } from "./bug-report-sheet";

export function BugReportFloatingButton() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="버그 리포트 보내기"
        aria-haspopup="dialog"
        onClick={() => setIsSheetOpen(true)}
        className="fixed right-[max(16px,calc((100vw_-_var(--app-max-width))/2_+_16px))] bottom-[var(--floating-action-bottom-offset)] z-30 grid size-12 cursor-pointer place-items-center rounded-full border-0 bg-app-ink text-white shadow-app-md transition-colors hover:bg-app-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
      >
        <Lineicons
          icon={Bug1Outlined}
          size={22}
          strokeWidth={1.8}
          aria-hidden="true"
          focusable="false"
        />
      </button>
      <BugReportSheet
        open={isSheetOpen}
        onDismiss={() => setIsSheetOpen(false)}
      />
    </>
  );
}
