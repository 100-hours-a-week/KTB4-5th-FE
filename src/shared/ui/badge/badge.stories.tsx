import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./badge";

const meta = {
  title: "shared/ui/Badge",
  component: Badge,
  args: { children: "D-3" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Solid: Story = { args: { tone: "solid" } };

export const Muted: Story = { args: { tone: "muted" } };

export const Outline: Story = { args: { tone: "outline" } };

export const Primary: Story = { args: { tone: "primary", children: "만료" } };

export const Highlight: Story = {
  args: { tone: "highlight", children: "임박" },
};

export const Medium: Story = { args: { size: "md", children: "냉장" } };
