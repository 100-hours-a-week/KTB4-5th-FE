import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FilterChip } from "./filter-chip";

const meta = {
  title: "shared/ui/FilterChip",
  component: FilterChip,
  args: { children: "채소" },
} satisfies Meta<typeof FilterChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

export const SelectedInk: Story = { args: { selected: true } };

export const SelectedPrimary: Story = {
  args: { selected: true, tone: "primary", children: "만료" },
};

export const Disabled: Story = { args: { disabled: true } };

export const LongLabel: Story = {
  args: { children: "유통기한 임박한 냉동식품" },
};
