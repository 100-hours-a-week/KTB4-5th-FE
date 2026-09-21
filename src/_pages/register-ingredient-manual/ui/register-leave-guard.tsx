"use client";

import { useWatch } from "react-hook-form";

import { useFormLeaveGuard } from "@/features/ingredient-form";
import { AppDialog } from "@/shared/ui/app-dialog";

import {
  hasAnyDraftInput,
  type ManualRegisterFormInput,
} from "../model/manual-register-form-schema";

type RegisterLeaveGuardProps = {
  formId: string;
  isRegistered: boolean;
};

/**
 * 작성 중 뒤로가기를 붙잡아 확인 모달을 띄운다. 입력값은 임시 저장하지 않으므로
 * 나가면 그대로 사라진다. 값 구독을 이 컴포넌트에 가둬 폼 전체가 다시 그려지지 않게 한다.
 */
export function RegisterLeaveGuard({
  formId,
  isRegistered,
}: RegisterLeaveGuardProps) {
  const drafts = useWatch<ManualRegisterFormInput, "drafts">({
    name: "drafts",
  });
  const dialog = useFormLeaveGuard({
    formId,
    isGuarded: !isRegistered && hasAnyDraftInput(drafts ?? []),
    title: "작성을 그만둘까요?",
    description: "지금 나가면 입력한 내용이 사라져요",
    continueLabel: "계속 작성",
  });

  return <AppDialog {...dialog} />;
}
