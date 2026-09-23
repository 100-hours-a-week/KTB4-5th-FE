"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";

import {
  ingredientQueries,
  registerIngredients,
  type RegisterBatchResult,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { INGREDIENT_REGISTER_BATCH_LIMIT } from "@/shared/config";
import { showAppToast } from "@/shared/ui/app-toast";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import {
  BATCH_LIMIT_MESSAGE,
  EMPTY_DRAFTS_MESSAGE,
  createEmptyDraft,
  manualRegisterFormSchema,
  type ManualRegisterFormInput,
  type ManualRegisterFormValues,
} from "../model/manual-register-form-schema";
import type { RegisterCapacity } from "../model/register-capacity";
import { toRegisterIngredientItems } from "../model/to-register-items";
import { useRegisterResultStore } from "../model/use-register-result-store";
import { IngredientDraftCard } from "./ingredient-draft-card";
import { RegisterCompleteDialog } from "./register-complete-dialog";
import { RegisterLeaveGuard } from "./register-leave-guard";
import { RegisterSubmitButton } from "./register-submit-button";
import { RegisterSummaryLine } from "./register-summary-line";

const FORM_ID = "manual-register-form";
const SUMMARY_ID = "manual-register-summary";

type ManualRegisterFormProps = {
  capacity: RegisterCapacity;
};

export function ManualRegisterForm({ capacity }: ManualRegisterFormProps) {
  const form = useForm<
    ManualRegisterFormInput,
    unknown,
    ManualRegisterFormValues
  >({
    resolver: zodResolver(manualRegisterFormSchema),
    mode: "onChange",
    defaultValues: { drafts: [createEmptyDraft()] },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "drafts",
  });
  // 화면에 처음 들어오면 빈 메모 한 장만 펼쳐 둔다. 한 번에 하나만 펼친다.
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [completedResult, setCompletedResult] =
    useState<RegisterBatchResult | null>(null);
  const setRegisterResult = useRegisterResultStore((state) => state.setResult);
  const clearRegisterResult = useRegisterResultStore(
    (state) => state.clearResult,
  );
  const queryClient = useQueryClient();
  const refrigeratorId = useCurrentRefrigeratorId();
  const registerMutation = useMutation({
    mutationFn: registerIngredients,
    onSuccess: (result, { refrigeratorId: registeredRefrigeratorId }) => {
      // 등록으로 재고 목록과 품목 수가 바뀌므로 해당 냉장고의 조회를 모두 무효화한다.
      void queryClient.invalidateQueries({
        queryKey: ingredientQueries.byRefrigerator(registeredRefrigeratorId),
      });
      setCompletedResult(result);
    },
    onError: () => {
      showAppToast({ message: "재고 등록에 실패했어요.", variant: "error" });
    },
  });

  const isBatchLimitReached = fields.length >= INGREDIENT_REGISTER_BATCH_LIMIT;

  function addDraft() {
    append(createEmptyDraft(), {
      focusName: `drafts.${fields.length}.name`,
    });
    setExpandedIndex(fields.length);
  }

  function removeDraft(index: number) {
    remove(index);
    setExpandedIndex((current) => {
      if (current === null || current === index) {
        return null;
      }

      return current > index ? current - 1 : current;
    });
  }

  function toggleDraft(index: number) {
    setExpandedIndex((current) => (current === index ? null : index));
  }

  // 등록은 확인 모달 없이 기존 품목에 합산한다.
  function submitDrafts(values: ManualRegisterFormValues) {
    if (registerMutation.isPending) {
      return;
    }

    if (!refrigeratorId) {
      showAppToast({ message: "재고 등록에 실패했어요.", variant: "error" });
      return;
    }

    clearRegisterResult();
    registerMutation.mutate({
      refrigeratorId,
      items: toRegisterIngredientItems(values.drafts),
    });
  }

  return (
    <FormProvider {...form}>
      <PageActionLayout
        action={
          <div className="flex">
            <RegisterSubmitButton
              formId={FORM_ID}
              capacity={capacity}
              isSubmitting={registerMutation.isPending}
            />
          </div>
        }
      >
        {/* 합계 줄은 목록 위에 고정하고 메모 목록만 스크롤한다. */}
        <div className="sticky top-0 z-10 border-b border-app-ink/10 bg-app-bg px-5 pt-3 pb-2.5">
          <RegisterSummaryLine id={SUMMARY_ID} capacity={capacity} />
        </div>

        <form
          id={FORM_ID}
          noValidate
          onSubmit={form.handleSubmit(submitDrafts)}
          aria-describedby={SUMMARY_ID}
          className="px-5 pt-4 pb-5"
        >
          {fields.length === 0 ? (
            <p className="m-0 rounded-[3px] border border-dashed border-app-ink/25 px-5 py-8 text-center text-[13.5px] text-app-ink/50">
              {EMPTY_DRAFTS_MESSAGE}
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {fields.map((field, index) => (
                <li key={field.id}>
                  <IngredientDraftCard
                    index={index}
                    isExpanded={index === expandedIndex}
                    onToggle={() => toggleDraft(index)}
                    onRemove={() => removeDraft(index)}
                  />
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={addDraft}
            disabled={isBatchLimitReached}
            className="mt-3 w-full cursor-pointer rounded-[3px] border border-dashed border-app-ink/35 bg-transparent py-3.5 text-center font-app-heading text-[13px] font-bold text-app-ink hover:bg-app-ink/4 disabled:cursor-not-allowed disabled:border-app-ink/15 disabled:text-app-ink/30 disabled:hover:bg-transparent"
          >
            + 재료 추가
          </button>

          {isBatchLimitReached ? (
            <p className="m-0 mt-2 text-center text-[12px] leading-tight text-app-primary">
              {BATCH_LIMIT_MESSAGE}
            </p>
          ) : null}
        </form>
      </PageActionLayout>
      <RegisterLeaveGuard
        formId={FORM_ID}
        isRegistered={completedResult !== null}
      />
      <RegisterCompleteDialog
        result={completedResult}
        onViewMergeResult={setRegisterResult}
      />
    </FormProvider>
  );
}
