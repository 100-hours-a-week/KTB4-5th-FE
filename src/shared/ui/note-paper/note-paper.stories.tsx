import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NotePaper } from "./note-paper";

const meta = {
  title: "shared/ui/NotePaper",
  component: NotePaper,
  args: {
    children: (
      <p className="m-0 p-4 text-[14px]">
        유통기한이 지난 재료를 정리해 주세요
      </p>
    ),
  },
} satisfies Meta<typeof NotePaper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SmallFold: Story = { args: { foldSize: 22 } };

export const LongContent: Story = {
  args: {
    children: (
      <div className="p-4 text-[14px]">
        {Array.from({ length: 8 }, (_, index) => (
          <p key={index} className="m-0">
            {index + 1}. 냉장 칸 정리하고 남은 재료를 목록에 다시 등록하기
          </p>
        ))}
      </div>
    ),
  },
};
