import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AsyncViewState, asyncViewActionClassName } from "./async-view-state";

function ActionButton({ label }: { label: string }) {
  return (
    <button type="button" className={asyncViewActionClassName}>
      {label}
    </button>
  );
}

const meta = {
  title: "shared/ui/AsyncViewState",
  component: AsyncViewState,
  args: {
    status: "loading",
    title: "재료를 불러오는 중입니다",
  },
} satisfies Meta<typeof AsyncViewState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const Error: Story = {
  args: {
    status: "error",
    title: "재료를 불러오지 못했어요",
    description: "잠시 후 다시 시도해 주세요",
    action: <ActionButton label="다시 시도" />,
  },
};

export const NetworkError: Story = {
  args: {
    status: "error",
    title: "인터넷 연결을 확인해 주세요",
    action: <ActionButton label="다시 시도" />,
  },
};

export const RetryLimited: Story = {
  args: {
    status: "error",
    title: "재료를 불러오지 못했어요",
    description: "잠시 후 다시 시도해 주세요",
    action: (
      <button type="button" className={asyncViewActionClassName} disabled>
        58초 후 다시 시도
      </button>
    ),
  },
};

export const Empty: Story = {
  args: {
    status: "empty",
    title: "냉장고가 비어 있어요",
    description: "첫 재료를 등록해 보세요",
    action: <ActionButton label="재료 등록" />,
  },
};

export const EmptyWithoutAction: Story = {
  args: {
    status: "empty",
    title: "받은 알림이 없어요",
  },
};
