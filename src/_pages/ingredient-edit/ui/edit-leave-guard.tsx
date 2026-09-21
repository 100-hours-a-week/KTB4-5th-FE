"use client";

import { useFormLeaveGuard } from "@/features/ingredient-form";
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
  const dialog = useFormLeaveGuard({
    formId,
    isGuarded: !isSaved && hasEditChanges(initialValues, values),
    title: LEAVE_DIALOG_TITLE,
    description: LEAVE_DIALOG_DESCRIPTION,
    continueLabel: "계속 수정",
  });

  return <AppDialog {...dialog} />;
}
