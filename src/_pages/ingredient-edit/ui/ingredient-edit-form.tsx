"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { INGREDIENT_QUANTITY_UNIT } from "@/entities/ingredient";
import {
  markAppNavigationIntent,
  readAppNavigationDepth,
} from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";
import { showAppToast } from "@/shared/ui/app-toast";
import { FooterButton } from "@/shared/ui/footer-button";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { withSubjectParticle } from "../lib/korean-particle";
import {
  LEAVE_DIALOG_DESCRIPTION,
  LEAVE_DIALOG_TITLE,
  SAVE_ERROR_MESSAGE,
  SAVE_SUCCESS_MESSAGE,
} from "../model/edit-messages";
import {
  hasEditChanges,
  ingredientEditFormSchema,
  type IngredientEditFormInput,
  type IngredientEditFormValues,
} from "../model/ingredient-edit-form-schema";
import type {
  IngredientEditTarget,
  MergeTarget,
} from "../model/mock-ingredient-edit";
import { toStockKey } from "../model/stock-key";
import { EditLeaveGuard } from "./edit-leave-guard";
import { EditSubmitButton } from "./edit-submit-button";
import { EditSummaryLine } from "./edit-summary-line";
import { IngredientEditCard } from "./ingredient-edit-card";

const FORM_ID = "ingredient-edit-form";
const SUMMARY_ID = "ingredient-edit-summary";
const MERGE_NOTICE =
  "이름·보관 방법·유통기한이 모두 같은 재료가 이미 있으면 저장할 때 수량이 합쳐져요.";

type IngredientEditFormProps = {
  target: IngredientEditTarget;
};

// 합산 확인 모달이 열려 있는 동안 저장할 값을 그대로 들고 있는다.
type PendingMerge = {
  target: MergeTarget;
  values: IngredientEditFormValues;
};

export function IngredientEditForm({ target }: IngredientEditFormProps) {
  const { ingredientId, createdDate, initialValues, mergeCandidates } = target;
  const router = useRouter();
  const form = useForm<
    IngredientEditFormInput,
    unknown,
    IngredientEditFormValues
  >({
    resolver: zodResolver(ingredientEditFormSchema),
    mode: "onChange",
    defaultValues: initialValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 저장이나 취소로 화면을 떠나기로 정하면 이탈 확인을 풀어 그대로 이동한다.
  const [isLeaving, setIsLeaving] = useState(false);
  const [pendingMerge, setPendingMerge] = useState<PendingMerge | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const detailHref = routes.ingredientDetail(ingredientId);

  /** 상세에서 들어왔으면 기존 엔트리로 돌아가고, 직접 진입이면 상세로 교체한다. */
  function leaveToDetail() {
    setIsLeaving(true);

    if ((readAppNavigationDepth() ?? 0) > 0) {
      router.back();
      return;
    }

    markAppNavigationIntent("replace", detailHref);
    router.replace(detailHref);
  }

  // 합산된 품목은 사라지므로 이전 화면에 남기지 않고 대상 품목 상세로 교체한다.
  function leaveToMergedDetail(mergeTarget: MergeTarget) {
    const href = routes.ingredientDetail(mergeTarget.ingredientId);

    setIsLeaving(true);
    markAppNavigationIntent("replace", href);
    router.replace(href);
  }

  async function save(
    values: IngredientEditFormValues,
    mergeTarget: MergeTarget | null,
  ) {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: 수정 API 연동 시 요청 DTO로 변환해 전송한다.
      void values;
      await new Promise<void>((resolve) => setTimeout(resolve, 600));

      setPendingMerge(null);
      showAppToast({ message: SAVE_SUCCESS_MESSAGE, variant: "success" });

      if (mergeTarget) {
        leaveToMergedDetail(mergeTarget);
        return;
      }

      leaveToDetail();
    } catch {
      // 실패하면 화면을 그대로 두고 다시 저장할 수 있게 한다.
      setIsSubmitting(false);
      setPendingMerge(null);
      showAppToast({ message: SAVE_ERROR_MESSAGE, variant: "error" });
    }
  }

  // 이름·보관 방법·유통기한이 기존 품목과 같아지면 합산이므로 먼저 확인을 받는다.
  function submitEdit(values: IngredientEditFormValues) {
    const mergeTarget =
      mergeCandidates[
        toStockKey(values.name, values.storageType, values.expirationDate)
      ];

    if (mergeTarget) {
      setPendingMerge({ target: mergeTarget, values });
      return;
    }

    void save(values, null);
  }

  function cancelEdit() {
    if (isSubmitting) {
      return;
    }

    // 바꾼 것이 없으면 확인 없이 바로 상세로 돌아간다.
    if (!hasEditChanges(initialValues, form.getValues())) {
      leaveToDetail();
      return;
    }

    setIsCancelConfirmOpen(true);
  }

  return (
    <FormProvider {...form}>
      <PageActionLayout
        action={
          <div className="flex gap-2.5">
            <div className="flex w-28 flex-none">
              <FooterButton
                variant="secondary"
                onClick={cancelEdit}
                disabled={isSubmitting}
              >
                취소
              </FooterButton>
            </div>
            <div className="flex min-w-0 flex-1">
              <EditSubmitButton
                formId={FORM_ID}
                initialValues={initialValues}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        }
      >
        {/* 수정 전 값은 위에 고정하고 입력 카드만 스크롤한다. */}
        <div className="sticky top-0 z-10 border-b border-app-ink/10 bg-app-bg px-5 pt-3 pb-2.5">
          <EditSummaryLine id={SUMMARY_ID} initialValues={initialValues} />
        </div>

        <form
          id={FORM_ID}
          noValidate
          onSubmit={form.handleSubmit(submitEdit)}
          aria-describedby={SUMMARY_ID}
          className="px-5 pt-4 pb-5"
        >
          <IngredientEditCard createdDate={createdDate} />

          <p className="m-0 mt-3 rounded-[3px] border border-dashed border-app-ink/25 px-4 py-3 text-[12px] leading-[1.5] break-keep text-app-ink/55">
            {MERGE_NOTICE}
          </p>
        </form>
      </PageActionLayout>

      <EditLeaveGuard
        formId={FORM_ID}
        initialValues={initialValues}
        isSaved={isLeaving}
      />

      <AppDialog
        open={isCancelConfirmOpen}
        dismissBehavior="none"
        title={LEAVE_DIALOG_TITLE}
        description={LEAVE_DIALOG_DESCRIPTION}
        secondaryAction={{
          label: "계속 수정",
          disabled: isLeaving,
          onClick: () => setIsCancelConfirmOpen(false),
        }}
        primaryAction={{
          label: "나가기",
          disabled: isLeaving,
          onClick: () => {
            setIsCancelConfirmOpen(false);
            leaveToDetail();
          },
        }}
      />

      <AppDialog
        open={pendingMerge !== null}
        dismissBehavior="none"
        title="기존 재료와 합칠까요?"
        description={
          pendingMerge
            ? `이름·보관 방법·유통기한이 같은 ${withSubjectParticle(pendingMerge.target.name)} 이미 있어요.\n합치면 ${pendingMerge.target.quantity + pendingMerge.values.quantity}${INGREDIENT_QUANTITY_UNIT}가 되고 수정하던 품목은 사라져요.`
            : ""
        }
        secondaryAction={{
          label: "취소",
          disabled: isSubmitting,
          onClick: () => setPendingMerge(null),
        }}
        primaryAction={{
          label: isSubmitting ? "로딩 중" : "합치기",
          disabled: isSubmitting,
          onClick: () => {
            if (pendingMerge) {
              void save(pendingMerge.values, pendingMerge.target);
            }
          },
        }}
      />
    </FormProvider>
  );
}
