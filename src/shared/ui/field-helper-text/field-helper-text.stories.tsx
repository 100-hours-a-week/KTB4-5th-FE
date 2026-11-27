import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FieldHelperText } from "./field-helper-text";

const meta = {
  title: "shared/ui/FieldHelperText",
  component: FieldHelperText,
  args: {
    id: "ingredient-name-helper",
    hint: "2~10자로 입력해주세요",
  },
  render: (args) => (
    <div>
      <label htmlFor="ingredient-name" className="block text-[13px]">
        재료 이름
      </label>
      <input
        id="ingredient-name"
        defaultValue="우유"
        aria-invalid={args.error ? true : undefined}
        aria-describedby={args.id}
        className="w-full border border-app-ink/20 px-3 py-2"
      />
      <FieldHelperText {...args} />
    </div>
  ),
} satisfies Meta<typeof FieldHelperText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hint: Story = {};

export const Error: Story = {
  args: { error: "사용할 수 없는 단어가 포함돼 있어요" },
};
