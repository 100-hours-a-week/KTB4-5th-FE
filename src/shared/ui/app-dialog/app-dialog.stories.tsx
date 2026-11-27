import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import {
  AppDialog,
  type AppDialogAction,
  type AppDialogProps,
} from "./app-dialog";

function DialogHarness(args: AppDialogProps) {
  const [open, setOpen] = useState(args.open);

  function closeAfter(action: AppDialogAction): AppDialogAction {
    return {
      ...action,
      onClick: () => {
        action.onClick();
        setOpen(false);
      },
    };
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        열기
      </button>
      <AppDialog
        {...args}
        open={open}
        primaryAction={closeAfter(args.primaryAction)}
        secondaryAction={
          args.secondaryAction ? closeAfter(args.secondaryAction) : undefined
        }
      />
    </>
  );
}

function getDialog(canvasElement: HTMLElement) {
  const dialog = canvasElement.querySelector("dialog");
  if (!dialog) throw new Error("dialog not rendered");
  return dialog;
}

function pressEscape(dialog: HTMLDialogElement) {
  dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
}

const outside = { clientX: 1, clientY: 1 };

const meta = {
  title: "shared/ui/AppDialog",
  component: AppDialog,
  args: {
    open: true,
    title: "재료를 삭제할까요?",
    description: "삭제하면 되돌릴 수 없어요",
    secondaryAction: { label: "취소", onClick: fn() },
    primaryAction: { label: "삭제", onClick: fn() },
  },
  render: (args) => <DialogHarness {...args} />,
} satisfies Meta<typeof AppDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TwoActions: Story = {
  play: async ({ args, canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: args.title }),
    ).toHaveFocus();

    await userEvent.click(canvas.getByRole("button", { name: "취소" }));

    await expect(args.secondaryAction?.onClick).toHaveBeenCalledOnce();
    await expect(args.primaryAction.onClick).not.toHaveBeenCalled();
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
  },
};

export const PrimaryOnly: Story = {
  args: {
    title: "등록을 완료했어요",
    description: "냉장고 목록에서 확인할 수 있어요",
    secondaryAction: undefined,
    primaryAction: { label: "확인", onClick: fn() },
  },
  play: async ({ args, canvasElement }) => {
    pressEscape(getDialog(canvasElement));

    await expect(args.primaryAction.onClick).toHaveBeenCalledOnce();
  },
};

export const EscapeRunsSecondaryAction: Story = {
  play: async ({ args, canvasElement }) => {
    pressEscape(getDialog(canvasElement));

    await expect(args.secondaryAction?.onClick).toHaveBeenCalledOnce();
    await expect(args.primaryAction.onClick).not.toHaveBeenCalled();
  },
};

export const BackdropClick: Story = {
  play: async ({ args, canvas, canvasElement }) => {
    const dialog = getDialog(canvasElement);

    await userEvent.pointer([
      {
        keys: "[MouseLeft>]",
        target: canvas.getByRole("heading", { name: args.title }),
      },
      { target: dialog, coords: outside },
      { keys: "[/MouseLeft]", target: dialog, coords: outside },
    ]);

    await expect(args.secondaryAction?.onClick).not.toHaveBeenCalled();

    await userEvent.pointer({
      keys: "[MouseLeft]",
      target: dialog,
      coords: outside,
    });

    await expect(args.secondaryAction?.onClick).toHaveBeenCalledOnce();
  },
};

export const DismissDisabled: Story = {
  args: { dismissBehavior: "none" },
  play: async ({ args, canvas, canvasElement }) => {
    const dialog = getDialog(canvasElement);

    pressEscape(dialog);
    await userEvent.pointer({
      keys: "[MouseLeft]",
      target: dialog,
      coords: outside,
    });

    await expect(args.secondaryAction?.onClick).not.toHaveBeenCalled();
    await expect(canvas.getByRole("dialog")).toBeVisible();
  },
};

export const DisabledDismissAction: Story = {
  args: {
    secondaryAction: { label: "취소", onClick: fn(), disabled: true },
  },
  play: async ({ args, canvas, canvasElement }) => {
    pressEscape(getDialog(canvasElement));

    await expect(args.secondaryAction?.onClick).not.toHaveBeenCalled();
    await expect(canvas.getByRole("dialog")).toBeVisible();
  },
};

export const LocksDocumentScroll: Story = {
  play: async ({ canvas }) => {
    await expect(document.body.style.overflow).toBe("hidden");
    await expect(document.documentElement.style.overflow).toBe("hidden");

    await userEvent.click(canvas.getByRole("button", { name: "취소" }));

    await waitFor(() => expect(document.body.style.overflow).toBe(""));
    await expect(document.documentElement.style.overflow).toBe("");
  },
};

export const RestoresFocusOnClose: Story = {
  args: { open: false },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "열기" });

    await userEvent.click(trigger);
    await expect(canvas.getByRole("dialog")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "취소" }));

    await expect(trigger).toHaveFocus();
  },
};

export const LongDescription: Story = {
  args: {
    title:
      "공유 냉장고에서 나가면 등록한 재료와 알림 기록을 더 이상 볼 수 없어요",
    description:
      "나간 뒤에는 초대 코드로 다시 참여할 수 있어요.\n등록한 재료는 냉장고에 그대로 남아요.\n알림 설정은 기기별로 초기화돼요.",
  },
};

export const WithChildren: Story = {
  args: {
    children: (
      <ul className="mt-3 list-disc pl-5 text-[12.5px]">
        <li>우유 1개</li>
        <li>계란 10개</li>
      </ul>
    ),
  },
};
