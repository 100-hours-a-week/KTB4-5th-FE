"use client";

import { useEffect, useRef, useState } from "react";
import { useWatch } from "react-hook-form";

import { registerAppBackGuard } from "@/shared/lib/navigation-guard";
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
  // 가드가 붙잡아 둔 이동. 값이 있으면 모달이 열려 있다.
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const lastFieldRef = useRef<HTMLElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);

  const isGuarded = !isRegistered && hasAnyDraftInput(drafts ?? []);

  useEffect(() => {
    if (!isGuarded) {
      return;
    }

    return registerAppBackGuard((proceed) => {
      setPendingLeave(() => proceed);
      return true;
    });
  }, [isGuarded]);

  // 모달을 닫을 때 되돌릴 곳은 직전에 누른 뒤로가기 버튼이 아니라 쓰던 입력칸이다.
  useEffect(() => {
    function rememberField(event: FocusEvent) {
      const form = document.getElementById(formId);

      if (
        event.target instanceof HTMLElement &&
        form?.contains(event.target) === true
      ) {
        lastFieldRef.current = event.target;
      }
    }

    document.addEventListener("focusin", rememberField);

    return () => {
      document.removeEventListener("focusin", rememberField);
    };
  }, [formId]);

  // AppDialog는 닫히면서 모달을 연 뒤로가기 버튼으로 포커스를 되돌린다. 이 effect는
  // 그 정리 단계 다음에 실행되므로 마지막으로 쓰던 입력칸을 다시 잡을 수 있다.
  useEffect(() => {
    if (pendingLeave !== null || !shouldRestoreFocusRef.current) {
      return;
    }

    shouldRestoreFocusRef.current = false;

    const lastField = lastFieldRef.current;

    if (lastField?.isConnected === true) {
      lastField.focus();
    }
  }, [pendingLeave]);

  function continueWriting() {
    shouldRestoreFocusRef.current = true;
    setPendingLeave(null);
  }

  function leave() {
    if (isLeaving || pendingLeave === null) {
      return;
    }

    setIsLeaving(true);
    pendingLeave();
  }

  return (
    <AppDialog
      open={pendingLeave !== null}
      dismissBehavior="none"
      title="작성을 그만둘까요?"
      description="지금 나가면 입력한 내용이 사라져요"
      secondaryAction={{
        label: "계속 작성",
        disabled: isLeaving,
        onClick: continueWriting,
      }}
      primaryAction={{
        label: "나가기",
        disabled: isLeaving,
        onClick: leave,
      }}
    />
  );
}
