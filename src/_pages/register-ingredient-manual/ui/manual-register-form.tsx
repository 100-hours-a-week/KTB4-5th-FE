"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";

import { INGREDIENT_REGISTER_BATCH_LIMIT } from "@/shared/config";
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
import { IngredientDraftCard } from "./ingredient-draft-card";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  async function submitDrafts(values: ManualRegisterFormValues) {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: 등록 API 연동 시 요청 DTO로 변환해 전송하고 성공하면 REG-006으로 이동한다.
      void values;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormProvider {...form}>
      <PageActionLayout
        action={
          <div className="flex">
            <RegisterSubmitButton
              formId={FORM_ID}
              capacity={capacity}
              isSubmitting={isSubmitting}
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
    </FormProvider>
  );
}
