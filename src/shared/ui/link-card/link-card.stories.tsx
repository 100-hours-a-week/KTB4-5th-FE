import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "@/shared/ui/badge";

import { LinkCard } from "./link-card";

const meta = {
  title: "shared/ui/LinkCard",
  component: LinkCard,
  parameters: { nextjs: { appDirectory: true } },
  args: {
    href: "/refrigerator/ingredients/1",
    title: "우유",
  },
} satisfies Meta<typeof LinkCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {};

export const WithDescription: Story = {
  args: { description: "1개 · 900ml" },
};

export const WithTrailing: Story = {
  args: {
    description: "1개 · 900ml",
    trailing: <Badge tone="highlight">임박</Badge>,
    trailingCaption: "D-2",
  },
};

export const LongTitle: Story = {
  args: {
    title: "국내산 무항생제 유기농 저지방 고칼슘 우유 2.3L 대용량",
    description: "2개 · 2300ml",
  },
};
