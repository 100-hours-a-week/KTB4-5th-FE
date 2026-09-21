"use client";

import { DayPicker } from "@daypicker/react";
import { ko } from "@daypicker/react/locale";

import { EXPIRATION_MAX_YEARS } from "@/shared/config";
import {
  AppBottomSheet,
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { FooterButton } from "@/shared/ui/footer-button";

import {
  fromIsoDate,
  getMaxExpirationDate,
  getTodayInSeoul,
  toIsoDate,
} from "../lib/expiration-date";

interface ExpirationDateSheetProps {
  open: boolean;
  value: string;
  onSelect: (isoDate: string) => void;
  onDismiss: () => void;
}

// DayPicker 기본 스타일시트 대신 앱 토큰으로 직접 그린다.
const calendarClassNames = {
  root: "relative w-full",
  months: "flex w-full flex-col",
  month: "w-full",
  month_caption: "flex h-11 items-center justify-center",
  caption_label:
    "font-app-heading text-[15px] font-black leading-none text-app-ink",
  nav: "absolute inset-x-0 top-0 flex h-11 items-center justify-between",
  button_previous:
    "grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-app-ink disabled:cursor-not-allowed disabled:text-app-ink/20",
  button_next:
    "grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-app-ink disabled:cursor-not-allowed disabled:text-app-ink/20",
  chevron: "size-4 fill-current",
  month_grid: "mt-1 w-full border-collapse",
  weekdays: "",
  weekday:
    "pb-2 text-center text-[11px] font-medium leading-none text-app-ink/45",
  weeks: "",
  week: "",
  day: "p-0.5 text-center align-middle",
  day_button:
    "mx-auto grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-transparent font-app-mono text-[14px] font-bold text-app-ink",
  today: "[&>button]:text-app-primary",
  selected: "[&>button]:bg-app-ink [&>button]:text-white",
  disabled: "[&>button]:cursor-not-allowed [&>button]:text-app-ink/20",
  outside: "invisible",
  hidden: "invisible",
};

export function ExpirationDateSheet({
  open,
  value,
  onSelect,
  onDismiss,
}: ExpirationDateSheetProps) {
  const today = getTodayInSeoul();
  const maxDate = getMaxExpirationDate(today);
  const selected = value === "" ? undefined : fromIsoDate(value);

  return (
    <AppBottomSheet open={open} onDismiss={onDismiss}>
      <AppBottomSheetTitle className="m-0 font-app-heading text-[19px] font-black leading-[1.35] tracking-normal">
        유통기한을 골라주세요
      </AppBottomSheetTitle>
      <AppBottomSheetDescription className="m-[6px_0_14px] font-app-body text-[13px] leading-[1.35] text-app-ink/50">
        오늘부터 {EXPIRATION_MAX_YEARS}년 이내에서 고를 수 있어요. 고른 날짜의
        끝까지 유효해요. 지난 날짜는 선택할 수 없어요.
      </AppBottomSheetDescription>

      <DayPicker
        mode="single"
        locale={ko}
        weekStartsOn={0}
        fixedWeeks
        showOutsideDays
        autoFocus
        selected={selected}
        defaultMonth={selected ?? fromIsoDate(today)}
        startMonth={fromIsoDate(today)}
        endMonth={fromIsoDate(maxDate)}
        disabled={[
          { before: fromIsoDate(today) },
          { after: fromIsoDate(maxDate) },
        ]}
        onSelect={(date) => {
          if (date) {
            onSelect(toIsoDate(date));
          }
        }}
        classNames={calendarClassNames}
      />

      <div className="mt-[18px] flex gap-[10px]">
        <FooterButton variant="secondary" onClick={onDismiss}>
          닫기
        </FooterButton>
      </div>
    </AppBottomSheet>
  );
}
