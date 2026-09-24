"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ingredientQueries, updateIngredient } from "@/entities/ingredient";
import { ApiError } from "@/shared/api";
import { FormProvider, useForm } from "react-hook-form";

import {
  markAppNavigationIntent,
  readAppNavigationDepth,
} from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";
import { showAppToast } from "@/shared/ui/app-toast";
import { FooterButton } from "@/shared/ui/footer-button";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import {
  LEAVE_DIALOG_DESCRIPTION,
  LEAVE_DIALOG_TITLE,
  SAVE_SUCCESS_MESSAGE,
} from "../model/edit-messages";
import {
  hasEditChanges,
  createIngredientEditFormSchema,
  type IngredientEditFormInput,
  type IngredientEditFormValues,
} from "../model/ingredient-edit-form-schema";
import type { IngredientEditTarget } from "../model/ingredient-edit-target";
import { getEditErrorMessage } from "../model/edit-error-message";
import { toUpdateIngredientBody } from "../model/to-update-ingredient-body";
import { EditLeaveGuard } from "./edit-leave-guard";
import { EditSubmitButton } from "./edit-submit-button";
import { EditSummaryLine } from "./edit-summary-line";
import { IngredientEditCard } from "./ingredient-edit-card";

const FORM_ID = "ingredient-edit-form";
const SUMMARY_ID = "ingredient-edit-summary";

type IngredientEditFormProps = {
  target: IngredientEditTarget;
  refrigeratorId: string;
};

export function IngredientEditForm({
  target,
  refrigeratorId,
}: IngredientEditFormProps) {
  const { ingredientId, etag, createdDate, initialValues } = target;
  const queryClient = useQueryClient();
  const router = useRouter();
  const form = useForm<
    IngredientEditFormInput,
    unknown,
    IngredientEditFormValues
  >({
    resolver: zodResolver(
      createIngredientEditFormSchema(initialValues.expirationDate),
    ),
    mode: "onChange",
    defaultValues: initialValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const detailHref = routes.ingredientDetail(ingredientId);

  function leaveToDetail() {
    setIsLeaving(true);

    if ((readAppNavigationDepth() ?? 0) > 0) {
      router.back();
      return;
    }

    markAppNavigationIntent("replace", detailHref);
    router.replace(detailHref);
  }

  async function submitEdit(values: IngredientEditFormValues) {
    if (isSubmitting) return;
    if (!etag) {
      showAppToast({
        message: "재고 버전 정보가 없어요. 다시 불러와 주세요",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateIngredient({
        ingredientId,
        etag,
        body: toUpdateIngredientBody(initialValues, values),
      });
      queryClient.setQueryData(
        ingredientQueries.detail(refrigeratorId, ingredientId).queryKey,
        result,
      );
      void queryClient.invalidateQueries({
        queryKey: ingredientQueries.byRefrigerator(refrigeratorId),
        refetchType: "inactive",
      });
      showAppToast({ message: SAVE_SUCCESS_MESSAGE, variant: "success" });
      leaveToDetail();
    } catch (error) {
      setIsSubmitting(false);
      const message = getEditErrorMessage(error);
      if (message) showAppToast({ message, variant: "error" });
      if (
        error instanceof ApiError &&
        (error.status === 412 || error.status === 428)
      ) {
        void queryClient.invalidateQueries({
          queryKey: ingredientQueries.detail(refrigeratorId, ingredientId)
            .queryKey,
        });
      }
    }
  }

  function cancelEdit() {
    if (isSubmitting) {
      return;
    }

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
          <IngredientEditCard
            createdDate={createdDate}
            initialStorageType={initialValues.storageType}
            measureType={initialValues.measureType}
          />
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
    </FormProvider>
  );
}
