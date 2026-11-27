import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { FooterButton } from "@/shared/ui/footer-button";

import {
  AppBottomSheet,
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "./app-bottom-sheet";

const titleClassName =
  "m-0 font-app-heading text-[16px] font-black leading-[1.35] tracking-normal";
const descriptionClassName =
  "m-[4px_0_12px] font-app-body text-[12.5px] leading-[1.35] text-app-ink/50";

const expiredIngredients = [
  "우유",
  "계란",
  "두부",
  "대파",
  "양배추",
  "닭가슴살",
  "요거트",
  "식빵",
  "버섯",
  "오이",
  "토마토",
  "햄",
  "치즈",
  "콩나물",
];

function SheetHeader() {
  return (
    <>
      <AppBottomSheetTitle className={titleClassName}>
        정리할 재료를 확인해 주세요
      </AppBottomSheetTitle>
      <AppBottomSheetDescription className={descriptionClassName}>
        폐기한 재료는 되돌릴 수 없어요
      </AppBottomSheetDescription>
    </>
  );
}

function SheetActions({ disabled = false }: { disabled?: boolean }) {
  return (
    <div className="mt-4 flex gap-2">
      <FooterButton size="sm" variant="secondary" disabled={disabled}>
        취소
      </FooterButton>
      <FooterButton size="sm" disabled={disabled}>
        3종 폐기하기
      </FooterButton>
    </div>
  );
}

const meta = {
  title: "shared/ui/AppBottomSheet",
  component: AppBottomSheet,
  args: {
    open: true,
    onDismiss: fn(),
    children: (
      <>
        <SheetHeader />
        <SheetActions />
      </>
    ),
  },
} satisfies Meta<typeof AppBottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongContent: Story = {
  args: {
    children: (
      <>
        <SheetHeader />
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {expiredIngredients.map((name) => (
            <li key={name}>
              <label className="flex items-center gap-2.5 font-app-body text-[13px] text-app-ink">
                <input type="checkbox" defaultChecked />
                {name}
              </label>
            </li>
          ))}
        </ul>
        <SheetActions />
      </>
    ),
  },
};

export const DismissDisabled: Story = {
  args: {
    dismissBehavior: "none",
    children: (
      <>
        <SheetHeader />
        <SheetActions disabled />
      </>
    ),
  },
};

export const WithoutActions: Story = {
  args: {
    children: (
      <>
        <AppBottomSheetTitle className={titleClassName}>
          보관 방법을 선택해 주세요
        </AppBottomSheetTitle>
        <ul className="m-0 flex list-none flex-col p-0">
          {["냉장", "냉동", "실온"].map((label) => (
            <li key={label}>
              <button
                type="button"
                className="w-full py-3 text-left font-app-body text-[14px] text-app-ink"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </>
    ),
  },
};
