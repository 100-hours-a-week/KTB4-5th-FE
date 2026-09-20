"use client";

import { CalendarDaysOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useState } from "react";
import { useController } from "react-hook-form";

import { AppBottomSheet } from "@/shared/ui/app-bottom-sheet";

import { formatExpirationDate } from "../lib/expiration-date";
import type { ManualRegisterFormInput } from "../model/manual-register-form-schema";
import { ExpirationCalendarSheetContent } from "./expiration-calendar-sheet-content";
import { getFieldControlClassName } from "./field-styles";

type ExpirationDateFieldProps = {
  id: string;
  labelId: string;
  index: number;
  describedBy: string;
};

// 직접 타이핑을 막기 위해 입력칸을 두지 않고 캘린더로만 값을 받는다.
export function ExpirationDateField({
  id,
  labelId,
  index,
  describedBy,
}: ExpirationDateFieldProps) {
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController<ManualRegisterFormInput, `drafts.${number}.expirationDate`>(
    {
      name: `drafts.${index}.expirationDate`,
    },
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  function selectDate(isoDate: string) {
    onChange(isoDate);
    onBlur();
    setIsCalendarOpen(false);
  }

  return (
    <>
      <button
        id={id}
        ref={ref}
        type="button"
        onClick={() => setIsCalendarOpen(true)}
        aria-labelledby={`${labelId} ${id}-value`}
        aria-describedby={describedBy}
        className={`${getFieldControlClassName(Boolean(fieldState.error))} cursor-pointer justify-between`}
      >
        <span
          id={`${id}-value`}
          className={`min-w-0 flex-1 truncate font-app-mono text-[15px] font-bold ${value ? "text-app-ink" : "font-normal text-app-ink/30"}`}
        >
          {value ? formatExpirationDate(value) : "기한 선택"}
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

      <AppBottomSheet
        open={isCalendarOpen}
        onDismiss={() => setIsCalendarOpen(false)}
      >
        <ExpirationCalendarSheetContent
          value={value}
          onSelect={selectDate}
          onCancel={() => setIsCalendarOpen(false)}
        />
      </AppBottomSheet>
    </>
  );
}
