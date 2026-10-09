"use client";

import { ArrowLeftOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  isValidNickname,
  NICKNAME_DISALLOWED_CHARS,
  NICKNAME_HINT,
  NICKNAME_LENGTH_ERROR,
  NICKNAME_MAX_LENGTH,
} from "@/features/oauth-signup";
import { routes } from "@/shared/routes";
import { AppHeader } from "@/shared/ui/app-header";
import { Button } from "@/shared/ui/button";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { useSignupDraftStore } from "../model/use-signup-draft-store";

export function SignupProfilePage() {
  const router = useRouter();
  const nickname = useSignupDraftStore((state) => state.nickname);
  const serverError = useSignupDraftStore((state) => state.nicknameError);
  const setNickname = useSignupDraftStore((state) => state.setNickname);

  const nicknameError =
    serverError ?? (nickname.length === 1 ? NICKNAME_LENGTH_ERROR : null);

  return (
    <PageActionLayout
      action={
        <Button
          variant="highlight"
          shape="note"
          className="w-full shadow-app-md"
          disabled={!isValidNickname(nickname) || serverError !== null}
          onClick={() => router.push(routes.signupNotification)}
        >
          다음
        </Button>
      }
    >
      <AppHeader
        title="정보 입력"
        leading={
          <Link
            href={routes.signup}
            aria-label="약관 동의로 돌아가기"
            className="grid size-[var(--tap-min)] place-items-center text-app-text hover:text-app-primary"
          >
            <Lineicons
              icon={ArrowLeftOutlined}
              size={23}
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            />
          </Link>
        }
      />

      <div className="flex flex-col gap-6 px-5 pt-3 pb-5">
        <h2 className="m-0 text-[24px] leading-[1.35] text-app-ink">
          닉네임을 알려주세요
        </h2>

        <div>
          <label
            htmlFor="nickname"
            className="block text-[15px] font-bold text-app-ink"
          >
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(event) =>
              setNickname(
                event.target.value.replace(NICKNAME_DISALLOWED_CHARS, ""),
              )
            }
            maxLength={NICKNAME_MAX_LENGTH}
            autoComplete="nickname"
            aria-describedby="nickname-help"
            aria-invalid={nicknameError ? true : undefined}
            placeholder="닉네임을 입력해주세요"
            className="mt-2 w-full rounded-[4px] border-0 bg-white px-4 py-[14px] text-[16px] font-bold text-app-ink shadow-app-sm outline-none placeholder:text-app-neutral-400 focus:outline-2 focus:outline-offset-2 focus:outline-app-primary"
          />
          <p
            id="nickname-help"
            aria-live="polite"
            className={`mb-0 mt-1 text-sm leading-5 ${nicknameError ? "text-app-primary" : "text-app-ink/50"}`}
          >
            {nicknameError ?? NICKNAME_HINT}
          </p>
        </div>
      </div>
    </PageActionLayout>
  );
}
