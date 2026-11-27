import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FooterButton } from "./footer-button";

const meta = {
  title: "shared/ui/FooterButton",
  component: FooterButton,
  args: { children: "저장" },
} satisfies Meta<typeof FooterButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary", children: "취소" },
};

export const Small: Story = { args: { size: "sm" } };

export const Disabled: Story = { args: { disabled: true } };

export const DialogPair: Story = {
  render: () => (
    <div className="flex gap-2">
      <FooterButton size="sm" variant="secondary">
        취소
      </FooterButton>
      <FooterButton size="sm">삭제</FooterButton>
    </div>
  ),
};
