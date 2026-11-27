import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CheckMark } from "./check-mark";

const meta = {
  title: "shared/ui/CheckMark",
  component: CheckMark,
} satisfies Meta<typeof CheckMark>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
