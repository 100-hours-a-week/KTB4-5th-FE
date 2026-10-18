"use client";

import { useId, useState } from "react";

import { AppDialog } from "@/shared/ui/app-dialog";
import { showAppToast } from "@/shared/ui/app-toast";
import { Button } from "@/shared/ui/button";

import { getJoinFailure } from "../model/join-failure";
import { useJoinRefrigerator } from "../model/use-join-refrigerator";

export function KakaotechJoinCard({ onDismiss }: { onDismiss?: () => void }) {
  const headingId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const mutation = useJoinRefrigerator({
    onError: (error) => {
      const failure = getJoinFailure(error);
      showAppToast({
        message: failure.kind === "dialog" ? failure.title : failure.message,
        variant: "error",
      });
    },
  });
  const inviteCode = process.env.NEXT_PUBLIC_KAKAOTECH_INVITE_CODE;

  if (!inviteCode) return null;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-[4px] border border-app-ink/15 bg-white p-4 shadow-app-sm"
    >
      <h2
        id={headingId}
        className="m-0 break-keep font-app-heading text-[16px] font-black leading-snug text-app-ink"
      >
        카테부 냉장고, 지금 참여해 보세요!
      </h2>
      <p className="mb-0 mt-1 break-keep text-[12.5px] leading-5 text-app-ink/70">
        카테부 구성원과 냉장고를 함께 사용해 보세요.
      </p>
      <div className="mt-3 flex flex-col gap-1">
        <Button
          variant="highlight"
          shape="note"
          aria-label="카테부 냉장고 참여하기"
          className="min-h-11! w-full px-4! py-2! text-sm!"
          loading={mutation.isPending}
          onClick={() => setIsOpen(true)}
        >
          참여하기
        </Button>
        {onDismiss ? (
          <button
            type="button"
            className="min-h-11 self-center px-3 text-[12.5px] font-bold text-app-ink/70"
            disabled={mutation.isPending}
            onClick={onDismiss}
          >
            나중에
          </button>
        ) : null}
      </div>
      <AppDialog
        open={isOpen}
        title="카테부 냉장고에 참여할까요?"
        description="참여하는 동안에는 카테부 냉장고만 쓸 수 있어요. 내 냉장고 재료는 옮겨지지 않고 따로 보관되며, 카테부 냉장고에서 나가면 다시 쓸 수 있어요."
        secondaryAction={{ label: "취소", onClick: () => setIsOpen(false) }}
        primaryAction={{
          label: "참여하기",
          disabled: mutation.isPending,
          onClick: () => {
            if (mutation.isPending) return;
            setIsOpen(false);
            mutation.mutate(inviteCode);
          },
        }}
      />
    </section>
  );
}
