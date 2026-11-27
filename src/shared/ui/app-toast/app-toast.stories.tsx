import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { AppToast } from "./app-toast";

const meta = {
  title: "shared/ui/AppToast",
  component: AppToast,
  args: {
    variant: "success",
    message: "재료를 등록했어요",
  },
} satisfies Meta<typeof AppToast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const SuccessWithAction: Story = {
  args: {
    message: "재료를 삭제했어요",
    action: { label: "되돌리기", onClick: fn() },
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    message: "인터넷 연결을 확인해 주세요",
  },
};

export const LongMessage: Story = {
  args: {
    message:
      "공유 냉장고에 새로운 재료 12종이 등록됐어요. 유통기한이 임박한 재료 3종은 홈 화면의 주의 섹션에서 먼저 확인할 수 있어요.",
  },
};
