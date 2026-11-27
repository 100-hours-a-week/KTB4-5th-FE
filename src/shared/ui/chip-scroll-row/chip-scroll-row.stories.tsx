import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { FilterChip } from "@/shared/ui/filter-chip";

import { ChipScrollRow } from "./chip-scroll-row";

const manyLabels = [
  "전체",
  "채소",
  "과일",
  "육류",
  "수산물",
  "유제품",
  "음료",
  "소스",
  "냉동식품",
  "간식",
  "기타",
];

function getScrollButtons(canvasElement: HTMLElement) {
  return canvasElement.querySelectorAll<HTMLButtonElement>(
    'button[aria-hidden="true"]',
  );
}

const meta = {
  title: "shared/ui/ChipScrollRow",
  component: ChipScrollRow,
  args: {
    "aria-label": "재고 필터",
    children: null,
  },
} satisfies Meta<typeof ChipScrollRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FewChips: Story = {
  render: (args) => (
    <ChipScrollRow {...args}>
      <FilterChip selected>전체</FilterChip>
      <FilterChip>채소</FilterChip>
    </ChipScrollRow>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvas.getByRole("group", { name: "재고 필터" }),
    ).toBeVisible();
    await expect(getScrollButtons(canvasElement)).toHaveLength(0);
  },
};

export const ManyChips: Story = {
  render: (args) => (
    <ChipScrollRow {...args}>
      {manyLabels.map((label, index) => (
        <FilterChip key={label} selected={index === 0}>
          {label}
        </FilterChip>
      ))}
    </ChipScrollRow>
  ),
  play: async ({ canvas, canvasElement }) => {
    const row = canvas.getByRole("group", { name: "재고 필터" });

    await waitFor(() =>
      expect(getScrollButtons(canvasElement)).toHaveLength(1),
    );

    await userEvent.click(getScrollButtons(canvasElement)[0]);
    await waitFor(() => expect(row.scrollLeft).toBeGreaterThan(0));
    await waitFor(() =>
      expect(getScrollButtons(canvasElement)).toHaveLength(2),
    );

    row.scrollLeft = row.scrollWidth;
    await waitFor(() =>
      expect(getScrollButtons(canvasElement)).toHaveLength(1),
    );

    const endScrollLeft = row.scrollLeft;
    await userEvent.click(getScrollButtons(canvasElement)[0]);
    await waitFor(() => expect(row.scrollLeft).toBeLessThan(endScrollLeft));
  },
};
