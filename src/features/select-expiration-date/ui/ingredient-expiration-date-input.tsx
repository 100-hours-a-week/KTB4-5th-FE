"use client";

import { CalendarDaysOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useState } from "react";
import type { Ref } from "react";

import { formatIsoDate } from "@/shared/lib/date";

import { ExpirationDateSheet } from "./expiration-date-sheet";

interface IngredientExpirationDateInputProps {
  id: string;
  labelId: string;
  value: string;
  describedBy: string;
  invalid: boolean;
  inputRef: Ref<HTMLButtonElement>;
  onValueChange: (value: string) => void;
  onBlur: () => void;
}

const CONTROL_BASE_CLASS_NAME =
  "flex h-10 w-full items-center gap-1.5 border-b-[1.5px] bg-transparent px-0.5 text-left";

function getControlClassName(invalid: boolean) {
  return `${CONTROL_BASE_CLASS_NAME} ${
    invalid
      ? "border-app-primary"
      : "border-app-ink/25 focus-within:border-app-ink"
  } cursor-pointer justify-between`;
}

export function IngredientExpirationDateInput({
  id,
  labelId,
  value,
  describedBy,
  invalid,
  inputRef,
  onValueChange,
  onBlur,
}: IngredientExpirationDateInputProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  function selectDate(isoDate: string) {
    onValueChange(isoDate);
    onBlur();
    setIsCalendarOpen(false);
  }

  return (
    <>
      <button
        id={id}
        ref={inputRef}
        type="button"
        onClick={() => setIsCalendarOpen(true)}
        aria-labelledby={`${labelId} ${id}-value`}
        aria-describedby={describedBy}
        className={getControlClassName(invalid)}
      >
        <span
          id={`${id}-value`}
          className={`min-w-0 flex-1 truncate font-app-mono text-[15px] font-bold ${value ? "text-app-ink" : "font-normal text-app-ink/30"}`}
        >
          {value ? formatIsoDate(value) : "기한 선택"}
        </span>
        <Lineicons
          icon={CalendarDaysOutlined}
          size={15}
          strokeWidth={2}
          aria-hidden="true"
          focusable="false"
          className="flex-none text-app-ink/45"
        />
      </button>

      <ExpirationDateSheet
        open={isCalendarOpen}
        value={value}
        onSelect={selectDate}
        onDismiss={() => setIsCalendarOpen(false)}
      />
    </>
  );
}
