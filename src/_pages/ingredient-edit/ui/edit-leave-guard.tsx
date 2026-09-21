"use client";

import { useEffect, useRef, useState } from "react";

import { registerAppBackGuard } from "@/shared/lib/navigation-guard";
import { AppDialog } from "@/shared/ui/app-dialog";

import {
  LEAVE_DIALOG_DESCRIPTION,
  LEAVE_DIALOG_TITLE,
} from "../model/edit-messages";
import {
  hasEditChanges,
  type IngredientEditFormInput,
} from "../model/ingredient-edit-form-schema";
import { useEditValues } from "../model/use-edit-values";

type EditLeaveGuardProps = {
  formId: string;
  initialValues: IngredientEditFormInput;
  isSaved: boolean;
};

/**
 * 바꾼 내용이 있을 때 뒤로가기를 붙잡아 확인 모달을 띄운다. 값 구독을 이 컴포넌트에
 * 가둬 폼 전체가 다시 그려지지 않게 한다.
 */
export function EditLeaveGuard({
  formId,
  initialValues,
  isSaved,
}: EditLeaveGuardProps) {
  const values = useEditValues();
  // 가드가 붙잡아 둔 이동. 값이 있으면 모달이 열려 있다.
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const lastFieldRef = useRef<HTMLElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);

  const isGuarded = !isSaved && hasEditChanges(initialValues, values);

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

  function continueEditing() {
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
      title={LEAVE_DIALOG_TITLE}
      description={LEAVE_DIALOG_DESCRIPTION}
      secondaryAction={{
        label: "계속 수정",
        disabled: isLeaving,
        onClick: continueEditing,
      }}
      primaryAction={{
        label: "나가기",
        disabled: isLeaving,
        onClick: leave,
      }}
    />
  );
}
