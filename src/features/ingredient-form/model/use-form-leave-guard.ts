"use client";

import { useEffect, useRef, useState } from "react";

import { registerAppBackGuard } from "@/shared/lib/navigation-guard";

type UseFormLeaveGuardOptions = {
  formId: string;
  isGuarded: boolean;
  title: string;
  description: string;
  continueLabel: string;
};

/**
 * 작성 중인 폼에서 뒤로가기를 붙잡아 확인 모달을 띄우는 데 필요한 AppDialog props를 만든다.
 * 가드 여부와 문구는 각 화면이 정한다.
 */
export function useFormLeaveGuard({
  formId,
  isGuarded,
  title,
  description,
  continueLabel,
}: UseFormLeaveGuardOptions) {
  // 가드가 붙잡아 둔 이동. 값이 있으면 모달이 열려 있다.
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const lastFieldRef = useRef<HTMLElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);

  useEffect(() => {
    if (!isGuarded) return;

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

    return () => document.removeEventListener("focusin", rememberField);
  }, [formId]);

  // AppDialog는 닫히면서 모달을 연 뒤로가기 버튼으로 포커스를 되돌린다. 이 effect는
  // 그 정리 단계 다음에 실행되므로 마지막으로 쓰던 입력칸을 다시 잡을 수 있다.
  useEffect(() => {
    if (pendingLeave !== null || !shouldRestoreFocusRef.current) return;

    shouldRestoreFocusRef.current = false;
    const lastField = lastFieldRef.current;

    if (lastField?.isConnected === true) lastField.focus();
  }, [pendingLeave]);

  function continueEditing() {
    shouldRestoreFocusRef.current = true;
    setPendingLeave(null);
  }

  function leave() {
    if (isLeaving || pendingLeave === null) return;

    setIsLeaving(true);
    pendingLeave();
  }

  return {
    open: pendingLeave !== null,
    dismissBehavior: "none" as const,
    title,
    description,
    secondaryAction: {
      label: continueLabel,
      disabled: isLeaving,
      onClick: continueEditing,
    },
    primaryAction: {
      label: "나가기",
      disabled: isLeaving,
      onClick: leave,
    },
  };
}
