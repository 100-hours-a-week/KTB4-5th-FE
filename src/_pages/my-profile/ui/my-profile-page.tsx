"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { refrigeratorQueries } from "@/entities/refrigerator";
import { UserAvatar, userQueries, type Me } from "@/entities/user";
import { useFormLeaveGuard } from "@/features/ingredient-form";
import {
  isValidNickname,
  NICKNAME_DISALLOWED_CHARS,
  NICKNAME_HINT,
  NICKNAME_LENGTH_ERROR,
  NICKNAME_MAX_LENGTH,
} from "@/features/oauth-signup";
import { ApiError } from "@/shared/api";
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

import { updateMyNickname } from "../api/my-profile";
import { WithdrawAccountButton } from "./withdraw-account-button";

const FORM_ID = "my-profile-form";

function getNicknameServerError(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === "USER-409-001") return "이미 사용 중이에요";
  if (error.code === "USER-422-001")
    return "사용할 수 없는 단어가 포함돼 있어요";
  return null;
}

export function MyProfilePage() {
  const { data, error, isError, isFetching, refetch } = useQuery(
    userQueries.me(),
  );

  if (data) return <MyProfileForm me={data} />;

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      {isError ? (
        <AsyncViewState
          status="error"
          title={
            error instanceof ApiError
              ? "프로필을 불러오지 못했어요"
              : "네트워크 연결을 확인해 주세요"
          }
          description="잠시 후 다시 시도해 주세요"
          action={
            <button
              type="button"
              disabled={isFetching}
              onClick={() => void refetch()}
              className={asyncViewActionClassName}
            >
              {isFetching ? "로딩 중" : "다시 시도"}
            </button>
          }
        />
      ) : (
        <AsyncViewState status="loading" title="프로필을 불러오는 중입니다" />
      )}
    </main>
  );
}

function MyProfileForm({ me }: { me: Me }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState(me.nickname);
  const [nicknameServerError, setNicknameServerError] = useState<string | null>(
    null,
  );
  const [isSaved, setIsSaved] = useState(false);

  const trimmedNickname = nickname.trim();
  const isDirty = trimmedNickname !== me.nickname;
  const nicknameError =
    trimmedNickname.length === 0
      ? "닉네임을 입력해주세요"
      : !isValidNickname(trimmedNickname)
        ? NICKNAME_LENGTH_ERROR
        : nicknameServerError;

  const leaveDialog = useFormLeaveGuard({
    formId: FORM_ID,
    isGuarded: isDirty && !isSaved,
    title: "저장하지 않고 나갈까요?",
    description: "바꾼 내용이 사라져요.",
    continueLabel: "계속 수정",
  });

  const saveMutation = useMutation({
    mutationFn: updateMyNickname,
    onSuccess: async () => {
      setIsSaved(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userQueries.me().queryKey }),
        queryClient.invalidateQueries({ queryKey: refrigeratorQueries.all() }),
      ]);
      showAppToast({ message: "저장했어요", variant: "success" });
      markAppNavigationIntent("replace", routes.me);
      router.replace(routes.me);
    },
    onError: (error) => {
      const serverError = getNicknameServerError(error);

      if (serverError) {
        setNicknameServerError(serverError);
        return;
      }

      showAppToast({
        message: "저장하지 못했어요. 다시 시도해 주세요",
        variant: "error",
      });
    },
  });

  return (
    <>
      <PageActionLayout
        action={
          <div className="flex">
            <FooterButton
              form={FORM_ID}
              type="submit"
              disabled={
                !isDirty || nicknameError !== null || saveMutation.isPending
              }
            >
              {saveMutation.isPending ? "로딩 중" : "저장"}
            </FooterButton>
          </div>
        }
      >
        <form
          id={FORM_ID}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate(trimmedNickname);
          }}
          className="flex flex-col gap-5 px-5 pt-3 pb-6"
        >
          <section className="flex flex-col items-center">
            <UserAvatar src={me.profileImageUrl} size={88} />
          </section>

          <div>
            <label
              htmlFor="nickname"
              className="block text-[15px] font-bold text-app-ink"
            >
              닉네임
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-[4px] bg-white px-4 shadow-app-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-app-primary">
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(event) => {
                  setNickname(
                    event.target.value.replace(NICKNAME_DISALLOWED_CHARS, ""),
                  );
                  setNicknameServerError(null);
                }}
                maxLength={NICKNAME_MAX_LENGTH}
                autoComplete="nickname"
                aria-describedby="nickname-help"
                aria-invalid={nicknameError ? true : undefined}
                className="min-w-0 flex-1 border-0 bg-transparent py-[14px] text-[16px] font-bold text-app-ink outline-none"
              />
              <span className="flex-none text-[13px] text-app-ink/45">
                {trimmedNickname.length} / {NICKNAME_MAX_LENGTH}
              </span>
            </div>
            <p
              id="nickname-help"
              aria-live="polite"
              className={`mb-0 mt-1 text-sm leading-5 ${nicknameError ? "text-app-primary" : "text-app-ink/50"}`}
            >
              {nicknameError ?? NICKNAME_HINT}
            </p>
          </div>

          {me.email ? (
            <div>
              <label
                htmlFor="email"
                className="block text-[15px] font-bold text-app-ink"
              >
                이메일
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-[4px] bg-app-neutral-100 px-4">
                <input
                  id="email"
                  type="email"
                  value={me.email}
                  disabled
                  className="min-w-0 flex-1 truncate border-0 bg-transparent py-[14px] font-app-body text-[16px] text-app-ink/45"
                />
                <span className="flex-none text-[13px] text-app-ink/45">
                  수정 불가
                </span>
              </div>
            </div>
          ) : null}

          <WithdrawAccountButton />
        </form>
      </PageActionLayout>

      <AppDialog {...leaveDialog} />
    </>
  );
}
