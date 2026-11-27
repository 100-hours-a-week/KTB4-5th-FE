import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";

const meta = {
  title: "shared/ui/Button",
  component: Button,
  args: { children: "재료 등록", className: "w-full" },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ink: Story = {};

export const Highlight: Story = { args: { variant: "highlight" } };

export const Note: Story = {
  args: { variant: "highlight", shape: "note", children: "다음" },
};

export const Disabled: Story = { args: { disabled: true } };

export const Loading: Story = { args: { loading: true } };

export const LongLabel: Story = {
  args: { children: "카카오테크 부트캠프 공용 냉장고에 참여하기" },
};
