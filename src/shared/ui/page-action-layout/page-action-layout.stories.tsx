import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/shared/ui/button";

import { PageActionLayout } from "./page-action-layout";

const meta = {
  title: "shared/ui/PageActionLayout",
  component: PageActionLayout,
  args: {
    children: <p className="m-0 p-5 text-[14px]">닉네임을 정해 주세요</p>,
    action: (
      <Button variant="highlight" shape="note" className="w-full">
        다음
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="h-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PageActionLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Canvas: Story = {};

export const Ink: Story = {
  args: {
    tone: "ink",
    action: (
      <Button variant="highlight" shape="note" className="w-full">
        시작하기
      </Button>
    ),
  },
};

export const LongContent: Story = {
  args: {
    children: (
      <div className="p-5 text-[14px]">
        {Array.from({ length: 40 }, (_, index) => (
          <p key={index} className="m-0 py-1">
            {index + 1}번째 안내 문구
          </p>
        ))}
      </div>
    ),
  },
};
