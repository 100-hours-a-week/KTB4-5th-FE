"use client";

import { ArrowLeftOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import Link from "next/link";

import { routes } from "@/shared/routes";
import { AppHeader } from "@/shared/ui/app-header";
import { Button } from "@/shared/ui/button";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { useSignupDraftStore } from "../model/use-signup-draft-store";

const NICKNAME_DISALLOWED_CHARS = /[^ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9]/g;
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]{2,10}$/;
const NICKNAME_HINT = "2~10자 · 한글/영문/숫자 · 특수문자 불가 · 금칙어 사용 불가";
const NICKNAME_LENGTH_ERROR = "최소 2글자, 최대 10글자 사이로 입력해주세요.";
const OAUTH_EMAIL = "kakao-account@example.com";

export function SignupProfilePage() {
  const nickname = useSignupDraftStore((state) => state.nickname);
  const setNickname = useSignupDraftStore((state) => state.setNickname);

  const isNicknameValid = NICKNAME_PATTERN.test(nickname);
  const nicknameError =
    nickname.length === 1 ? NICKNAME_LENGTH_ERROR : undefined;

  return (
    <PageActionLayout
      action={
        <Button
          variant="highlight"
          shape="note"
          className="w-full shadow-app-md"
          disabled={!isNicknameValid}
        >
          다음
        </Button>
      }
    >
      <AppHeader
        title="정보 입력"
        leading={
          <Link
            href={routes.signupTerms}
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
            maxLength={10}
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

        <div>
          <p className="m-0 text-[15px] font-bold text-app-ink">이메일</p>
          <p className="m-0 mt-2 rounded-[4px] bg-app-neutral-200 px-4 py-[14px] text-[16px] font-bold text-app-neutral-500">
            {OAUTH_EMAIL}
          </p>
          <p className="mb-0 mt-1 text-sm leading-5 text-app-ink/50">
            카카오 계정에서 자동 입력됩니다 (수정 불가)
          </p>
        </div>
      </div>
    </PageActionLayout>
  );
}
