import { ArrowLeftOutlined, Bell1Outlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AppHeader } from "./app-header";

const iconButtonClassName =
  "grid size-[var(--tap-min)] place-items-center border-0 bg-transparent p-0 text-app-text";

const meta = {
  title: "shared/ui/AppHeader",
  component: AppHeader,
  args: { title: "냉장고" },
} satisfies Meta<typeof AppHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {};

export const WithLeadingAndActions: Story = {
  args: {
    title: "알림",
    leading: (
      <button
        type="button"
        className={iconButtonClassName}
        aria-label="이전 화면으로 이동"
      >
        <Lineicons
          icon={ArrowLeftOutlined}
          size={23}
          strokeWidth={1.8}
          aria-hidden="true"
          focusable="false"
        />
      </button>
    ),
    actions: (
      <button type="button" className={iconButtonClassName} aria-label="알림">
        <Lineicons
          icon={Bell1Outlined}
          size={23}
          strokeWidth={1.8}
          aria-hidden="true"
          focusable="false"
        />
      </button>
    ),
  },
};

export const LongTitle: Story = {
  args: {
    title: "카카오테크 부트캠프 4기 5조 공용 냉장고 두 번째 칸",
  },
};
