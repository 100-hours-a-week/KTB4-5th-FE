"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  refrigeratorQueries,
  useCurrentRefrigeratorId,
} from "@/entities/refrigerator";
import { createInviteCode } from "@/features/share-refrigerator";
import { showAppToast } from "@/shared/ui/app-toast";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";
import { FooterButton } from "@/shared/ui/footer-button";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { formatInviteCode, formatRemainingTime } from "../lib/invite-code";
import { ShareStateLayout } from "./share-state-layout";

function useNow(enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return now;
}

export function RefrigeratorInvitePage() {
  const queryClient = useQueryClient();
  const refrigeratorId = useCurrentRefrigeratorId() ?? "";
  const invitationQuery = useQuery({
    ...refrigeratorQueries.invitation(refrigeratorId),
    enabled: Boolean(refrigeratorId),
  });
  const createMutation = useMutation({
    mutationFn: createInviteCode,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: refrigeratorQueries.invitation(refrigeratorId).queryKey,
      }),
  });
  const handledUpdateRef = useRef(0);
  const data = invitationQuery.data;
  const now = useNow(Boolean(data));
  const createCode = () => createMutation.mutate(refrigeratorId);

  const { dataUpdatedAt } = invitationQuery;
  const { mutate } = createMutation;

  useEffect(() => {
    if (data !== null || handledUpdateRef.current === dataUpdatedAt) return;
    handledUpdateRef.current = dataUpdatedAt;
    mutate(refrigeratorId);
  }, [data, dataUpdatedAt, mutate, refrigeratorId]);

  if (invitationQuery.isError || createMutation.isError) {
    const isRetrying = invitationQuery.isFetching || createMutation.isPending;

    return (
      <ShareStateLayout>
        <AsyncViewState
          status="error"
          title="문제가 생겼어요"
          description="잠시 후 다시 시도해 주세요"
          action={
            <button
              type="button"
              disabled={isRetrying}
              onClick={() =>
                invitationQuery.isError
                  ? void invitationQuery.refetch()
                  : createCode()
              }
              className={asyncViewActionClassName}
            >
              {isRetrying ? "로딩 중" : "다시 시도"}
            </button>
          }
        />
      </ShareStateLayout>
    );
  }

  if (!data) {
    return (
      <ShareStateLayout>
        <AsyncViewState
          status="loading"
          title="초대 코드를 불러오는 중입니다"
        />
      </ShareStateLayout>
    );
  }

  const remainingMs = new Date(data.expiresAt).getTime() - now;
  const isExpired = remainingMs <= 0;
  const { code } = data;
  const displayCode = formatInviteCode(code);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      showAppToast({
        message: "복사했어요",
        variant: "success",
        dedupeKey: "invite-code-copy",
      });
    } catch {
      showAppToast({
        message: "코드를 길게 눌러 직접 선택해 주세요",
        variant: "error",
        dedupeKey: "invite-code-copy",
      });
    }
  }

  return (
    <PageActionLayout
      footerClassName="flex"
      action={
        isExpired ? (
          <FooterButton
            disabled={createMutation.isPending}
            onClick={createCode}
          >
            새 코드 만들기
          </FooterButton>
        ) : (
          <FooterButton variant="secondary" onClick={() => void copyCode()}>
            코드 복사
          </FooterButton>
        )
      }
    >
      <div className="px-5 pt-8 pb-6">
        <h2 className="m-0 font-app-heading text-[22px] font-black text-app-ink">
          이 코드를 알려주세요
        </h2>

        <section
          aria-label="초대 코드"
          className="mt-5 flex flex-col items-center rounded-[4px] bg-white px-4 py-8 shadow-app-sm"
        >
          <p
            className={`m-0 select-all font-app-mono text-[36px] font-black tracking-[0.04em] ${
              isExpired ? "text-app-ink/30 line-through" : "text-app-ink"
            }`}
          >
            {displayCode}
          </p>
          <p
            aria-live="off"
            className="m-0 mt-2 font-app-mono text-[13px] text-app-ink/55"
          >
            {isExpired
              ? "만료된 코드예요"
              : `${formatRemainingTime(remainingMs)} 후 만료`}
          </p>
        </section>

        <p className="m-0 mt-3 break-keep text-[12.5px] leading-5 text-app-ink/55">
          코드는 5분 동안 유효하고, 한 번 사용하면 사라져요. 만료되면 새로 만들
          수 있어요.
        </p>
      </div>
    </PageActionLayout>
  );
}
