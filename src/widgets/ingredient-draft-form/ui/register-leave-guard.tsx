"use client";

import { useWatch } from "react-hook-form";

import { useFormLeaveGuard } from "@/features/ingredient-form";
import { AppDialog } from "@/shared/ui/app-dialog";

import {
  hasAnyDraftInput,
  type IngredientDraftFormInput,
} from "../model/ingredient-draft-form-schema";

type RegisterLeaveGuardProps = {
  formId: string;
  isRegistered: boolean;
};

export function RegisterLeaveGuard({
  formId,
  isRegistered,
}: RegisterLeaveGuardProps) {
  const drafts = useWatch<IngredientDraftFormInput, "drafts">({
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
