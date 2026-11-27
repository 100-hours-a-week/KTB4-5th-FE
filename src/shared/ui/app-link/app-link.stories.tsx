import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AppLink } from "./app-link";

const meta = {
  title: "shared/ui/AppLink",
  component: AppLink,
  parameters: { nextjs: { appDirectory: true } },
  args: {
    href: "/notifications",
    children: "알림 보기",
  },
} satisfies Meta<typeof AppLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
