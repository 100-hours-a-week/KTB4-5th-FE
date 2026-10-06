"use client";

import { FormProvider } from "react-hook-form";

import { PageActionLayout } from "@/shared/ui/page-action-layout";
import {
  EMPTY_DRAFTS_MESSAGE,
  IngredientDraftCard,
  type RegisterCapacity,
  RegisterCapacityBoundary,
  RegisterLeaveGuard,
  RegisterSubmitButton,
  RegisterSummaryLine,
} from "@/widgets/ingredient-draft-form";

import { useReceiptResultForm } from "../model/use-receipt-result-form";
import { RecognitionStatusChip } from "./recognition-status-chip";

const FORM_ID = "receipt-result-form";
const SUMMARY_ID = "receipt-result-summary";

export function RegisterIngredientReceiptResultPage() {
  return (
    <RegisterCapacityBoundary>
      {(capacity) => <ReceiptResultForm capacity={capacity} />}
    </RegisterCapacityBoundary>
  );
}

function ReceiptResultForm({ capacity }: { capacity: RegisterCapacity }) {
  const {
    form,
    fields,
    statuses,
    hasUncertain,
    photoCount,
    expandedIndex,
    toggle,
    removeDraft,
    submit,
  } = useReceiptResultForm();

  return (
    <FormProvider {...form}>
      <PageActionLayout
        action={
          <div className="flex">
            <RegisterSubmitButton
              formId={FORM_ID}
              capacity={capacity}
              isSubmitting={false}
            />
          </div>
        }
      >
        {fields.length > 0 ? (
          <div className="px-5 pt-4">
            <h2 className="m-0 font-app-heading text-[20px] font-black leading-[1.4] text-app-ink">
              {fields.length}개를 찾았어요.
              <br />
              틀린 부분은 눌러서 고쳐 주세요
            </h2>
            {hasUncertain ? (
              <p className="m-0 mt-3 rounded-[3px] bg-app-ink/5 px-4 py-3 text-[13px] leading-normal text-app-ink/60">
                영수증 {photoCount}장에서 인식했어요. 유통기한은 직접 지정해
                주세요.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="sticky top-0 z-10 mt-3 border-b border-app-ink/10 bg-app-bg px-5 pt-3 pb-2.5">
          <RegisterSummaryLine
            id={SUMMARY_ID}
            capacity={capacity}
            showUnsetExpirationCount
          />
        </div>

        <form
          id={FORM_ID}
          noValidate
          onSubmit={submit}
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
                    onToggle={() => toggle(index)}
                    onRemove={() => removeDraft(index)}
                    badge={
                      statuses[index] ? (
                        <RecognitionStatusChip status={statuses[index]} />
                      ) : null
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </form>
      </PageActionLayout>
      <RegisterLeaveGuard
        formId={FORM_ID}
        isRegistered={false}
        description="지금 나가면 인식한 내용이 사라져요"
      />
    </FormProvider>
  );
}
