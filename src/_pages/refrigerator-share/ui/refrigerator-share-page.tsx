"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  refrigeratorQueries,
  setCurrentRefrigeratorId,
  useCurrentRefrigeratorId,
  type RefrigeratorMember,
} from "@/entities/refrigerator";
import { userQueries } from "@/entities/user";
import {
  leaveRefrigerator,
  removeRefrigeratorMember,
} from "@/features/share-refrigerator";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";
import { showAppToast } from "@/shared/ui/app-toast";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";
import { FooterButton } from "@/shared/ui/footer-button";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { MemberRow } from "./member-row";
import { ShareStateLayout } from "./share-state-layout";

export function RefrigeratorSharePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const refrigeratorId = useCurrentRefrigeratorId();
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    ...refrigeratorQueries.members(refrigeratorId ?? ""),
    enabled: Boolean(refrigeratorId),
  });
  const meQuery = useQuery(userQueries.me());
  const [removeTarget, setRemoveTarget] = useState<RefrigeratorMember | null>(
    null,
  );
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);

  const removeMutation = useMutation({
    mutationFn: removeRefrigeratorMember,
    onSuccess: () => {
      setRemoveTarget(null);
      void queryClient.invalidateQueries({
        queryKey: refrigeratorQueries.members(refrigeratorId ?? "").queryKey,
      });
    },
    onError: () => {
      setRemoveTarget(null);
      showAppToast({
        message: "내보내지 못했어요. 다시 시도해 주세요",
        variant: "error",
      });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: leaveRefrigerator,
    onSuccess: async (nextRefrigeratorId) => {
      await queryClient.invalidateQueries({
        queryKey: refrigeratorQueries.all(),
      });
      setCurrentRefrigeratorId(nextRefrigeratorId);
      markAppNavigationIntent("replace", routes.home);
      router.replace(routes.home);
    },
    onError: () => {
      setIsLeaveOpen(false);
      showAppToast({
        message: "나가지 못했어요. 다시 시도해 주세요",
        variant: "error",
      });
    },
  });

  if (refrigeratorId === null || isError || meQuery.isError) {
    return (
      <ShareStateLayout>
        <AsyncViewState
          status="error"
          title="문제가 생겼어요"
          description="잠시 후 다시 시도해 주세요"
          action={
            <button
              type="button"
              disabled={isFetching || meQuery.isFetching}
              onClick={() => {
                void refetch();
                void meQuery.refetch();
              }}
              className={asyncViewActionClassName}
            >
              {isFetching || meQuery.isFetching ? "로딩 중" : "다시 시도"}
            </button>
          }
        />
      </ShareStateLayout>
    );
  }

  if (refrigeratorId === undefined || isPending || meQuery.isPending) {
    return (
      <ShareStateLayout>
        <AsyncViewState status="loading" title="참여자를 불러오는 중입니다" />
      </ShareStateLayout>
    );
  }

  const myUserId = meQuery.data.userId;
  const isOwner = data.members.some(
    (member) => member.userId === myUserId && member.role === "owner",
  );
  const isAlone = data.memberCount <= 1;
  const isFull = data.memberCount >= data.memberMax;

  function goTo(href: string) {
    markAppNavigationIntent("push", href);
    router.push(href);
  }

  return (
    <>
      <PageActionLayout
        action={
          <div
            data-page-action-rows={isOwner && !isAlone ? undefined : "2"}
            className="flex flex-col gap-2.5"
          >
            {isOwner ? (
              <FooterButton
                disabled={isFull}
                onClick={() => goTo(routes.refrigeratorShareInvite)}
              >
                초대 코드 만들기
              </FooterButton>
            ) : null}
            {!isOwner || isAlone ? (
              <FooterButton
                variant="secondary"
                onClick={() =>
                  isAlone
                    ? goTo(routes.refrigeratorShareJoin)
                    : showAppToast({
                        message: "지금 냉장고에서 나간 뒤 참여할 수 있어요",
                        variant: "error",
                      })
                }
              >
                다른 냉장고 참여하기
              </FooterButton>
            ) : null}
            {!isOwner ? (
              <FooterButton
                variant="secondary"
                onClick={() => setIsLeaveOpen(true)}
              >
                나가기
              </FooterButton>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-col gap-5 px-5 pt-6 pb-6">
          <section className="rounded-[4px] bg-white px-4 py-4 shadow-app-sm">
            <h2 className="m-0 truncate font-app-heading text-[18px] font-black text-app-ink">
              {data.refrigeratorName}
            </h2>
            <p className="m-0 mt-1 text-[12.5px] text-app-ink/55">
              함께 쓰는 사람 {data.memberCount} / {data.memberMax}명
            </p>
          </section>

          <section aria-labelledby="share-members-title">
            <h3
              id="share-members-title"
              className="m-0 mb-2 font-app-heading text-[15px] font-black text-app-ink"
            >
              참여자
            </h3>
            <ul className="m-0 list-none rounded-[4px] bg-white px-4 shadow-app-sm">
              {data.members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  isMe={member.userId === myUserId}
                  canRemove={isOwner && member.userId !== myUserId}
                  onRemove={() => setRemoveTarget(member)}
                />
              ))}
            </ul>
            {isAlone ? (
              <div className="mt-3 rounded-[4px] border border-dashed border-app-neutral-300 bg-white/70 px-4 py-4 text-center">
                <p className="m-0 font-app-heading text-[14.5px] font-black text-app-ink">
                  아직 함께 쓰는 사람이 없어요
                </p>
                <p className="m-0 mt-1 break-keep text-[12.5px] leading-5 text-app-ink/55">
                  초대 코드를 만들어 알려주면 최대 4명까지 함께 쓸 수 있어요.
                </p>
              </div>
            ) : (
              <p className="m-0 mt-2 break-keep text-[12.5px] leading-5 text-app-ink/55">
                {isFull
                  ? "정원이 다 찼어요. 참여자를 내보내야 새로 초대할 수 있어요."
                  : "방장만 참여자를 내보낼 수 있어요. 최대 4명까지 함께 쓸 수 있어요."}
              </p>
            )}
          </section>
        </div>
      </PageActionLayout>

      <AppDialog
        open={removeTarget !== null}
        title={`${removeTarget?.nickname ?? ""} 님을 내보낼까요?`}
        description="바로 냉장고를 볼 수 없게 되고, 내보냈다는 알림이 가요. 되돌릴 수 없어요."
        secondaryAction={{
          label: "취소",
          disabled: removeMutation.isPending,
          onClick: () => setRemoveTarget(null),
        }}
        primaryAction={{
          label: "내보내기",
          disabled: removeMutation.isPending,
          onClick: () => {
            if (removeTarget) {
              removeMutation.mutate({
                refrigeratorId,
                userId: removeTarget.userId,
              });
            }
          },
        }}
      />

      <AppDialog
        open={isLeaveOpen}
        title={`${data.refrigeratorName}를 나가시는 건가요?`}
        description="공유 냉장고 재료는 가져가지 않고, 참여 전 개인 냉장고로 돌아가요."
        secondaryAction={{
          label: "취소",
          disabled: leaveMutation.isPending,
          onClick: () => setIsLeaveOpen(false),
        }}
        primaryAction={{
          label: "나가기",
          disabled: leaveMutation.isPending,
          onClick: () => leaveMutation.mutate(refrigeratorId),
        }}
      />
    </>
  );
}
