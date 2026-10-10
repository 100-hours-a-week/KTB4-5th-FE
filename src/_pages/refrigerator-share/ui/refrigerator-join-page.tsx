"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  refrigeratorQueries,
  setCurrentRefrigeratorId,
} from "@/entities/refrigerator";
import { joinRefrigerator } from "@/features/share-refrigerator";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";
import { showAppToast } from "@/shared/ui/app-toast";
import { FieldHelperText } from "@/shared/ui/field-helper-text";
import { FooterButton } from "@/shared/ui/footer-button";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import {
  formatInviteCode,
  INVITE_CODE_LENGTH,
  normalizeInviteCodeInput,
} from "../lib/invite-code";
import { getJoinFailure, type JoinFailure } from "../model/join-failure";

const HELPER_TEXT = "영문 대문자·숫자 6자리";

export function RefrigeratorJoinPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [failure, setFailure] = useState<JoinFailure | null>(null);
  const joinMutation = useMutation({
    mutationFn: joinRefrigerator,
    onSuccess: async (refrigeratorId) => {
      await queryClient.invalidateQueries({
        queryKey: refrigeratorQueries.all(),
      });
      setCurrentRefrigeratorId(refrigeratorId);
      markAppNavigationIntent("replace", routes.home);
      router.replace(routes.home);
      showAppToast({ message: "함께 쓰기 시작했어요", variant: "success" });
    },
    onError: (error) => {
      const nextFailure = getJoinFailure(error);
      if (nextFailure.kind === "toast") {
        showAppToast({ message: nextFailure.message, variant: "error" });
        return;
      }
      setFailure(nextFailure);
    },
  });

  const isComplete = code.length === INVITE_CODE_LENGTH;
  const helperError = failure?.kind === "helper" ? failure.message : null;
  const dialog = failure?.kind === "dialog" ? failure : null;

  return (
    <>
      <PageActionLayout
        footerClassName="flex"
        action={
          <FooterButton
            disabled={!isComplete || joinMutation.isPending}
            onClick={() => joinMutation.mutate(code)}
          >
            {joinMutation.isPending ? "로딩 중" : "참여하기"}
          </FooterButton>
        }
      >
        <div className="px-5 pt-8 pb-6">
          <h2 className="m-0 break-keep font-app-heading text-[22px] font-black leading-snug text-app-ink">
            받은 초대 코드를
            <br />
            입력해 주세요
          </h2>

          <input
            aria-label="초대 코드"
            aria-invalid={helperError !== null}
            aria-describedby="invite-code-helper"
            autoCapitalize="characters"
            autoComplete="one-time-code"
            spellCheck={false}
            inputMode="text"
            value={formatInviteCode(code)}
            onChange={(event) => {
              setCode(normalizeInviteCodeInput(event.target.value));
              setFailure(null);
            }}
            placeholder="A7K-3F9"
            className={`mt-6 w-full rounded-[4px] border-[1.5px] bg-white px-4 py-4 text-center font-app-mono text-[22px] font-black tracking-[0.06em] text-app-ink outline-none placeholder:text-app-ink/25 focus:border-app-ink ${
              helperError ? "border-app-primary" : "border-app-ink/18"
            }`}
          />
          <FieldHelperText
            id="invite-code-helper"
            hint={HELPER_TEXT}
            error={helperError ?? undefined}
          />

          <p className="m-0 mt-4 break-keep rounded-[4px] bg-app-neutral-100 px-3 py-2.5 text-[12.5px] leading-5 text-app-ink/70">
            참여하면 개인 재고는 그대로 보관되고, 공유 냉장고만 관리할 수
            있어요.
          </p>
        </div>
      </PageActionLayout>

      <AppDialog
        open={dialog !== null}
        title={dialog?.title ?? ""}
        description={dialog?.description ?? ""}
        primaryAction={{ label: "다시 시도", onClick: () => setFailure(null) }}
      />
    </>
  );
}
