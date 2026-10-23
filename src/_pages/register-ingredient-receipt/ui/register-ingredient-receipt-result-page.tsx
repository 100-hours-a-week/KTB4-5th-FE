"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { FormProvider } from "react-hook-form";

import { imageAnalysisQueries, useDeleteImageAnalysis } from "@/entities/image";
import { ApiError } from "@/shared/api";
import { AppLink } from "@/shared/ui/app-link";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

import { INGREDIENT_REGISTER_BATCH_LIMIT } from "@/shared/config";
import { routes } from "@/shared/routes";
import { PageActionLayout } from "@/shared/ui/page-action-layout";
import {
  EMPTY_DRAFTS_MESSAGE,
  IngredientDraftCard,
  type RegisterCapacity,
  RegisterCapacityBoundary,
  RegisterCompleteDialog,
  RegisterLeaveGuard,
  RegisterSubmitButton,
  RegisterSummaryLine,
} from "@/widgets/ingredient-draft-form";

import {
  toRecognitionResult,
  type ReceiptRecognitionResult,
  getAnalysisFailureMessage,
} from "../model/receipt-recognition";
import { useReceiptResultForm } from "../model/use-receipt-result-form";
import { useReceiptResultStore } from "../model/use-receipt-result-store";
import { RecognitionStatusChip } from "./recognition-status-chip";

const FORM_ID = "receipt-result-form";
const SUMMARY_ID = "receipt-result-summary";

export function RegisterIngredientReceiptResultPage({
  analysisId,
}: {
  analysisId?: string;
}) {
  const router = useRouter();
  const storedResult = useReceiptResultStore((state) => state.result);
  const removeAnalysis = useDeleteImageAnalysis();
  const analysis = useQuery({
    ...imageAnalysisQueries.detail(analysisId ?? ""),
    enabled: Boolean(analysisId),
  });
  const result = useMemo(
    () =>
      analysisId
        ? analysis.data && toRecognitionResult(analysis.data)
        : storedResult,
    [analysisId, analysis.data, storedResult],
  );

  useEffect(() => {
    if (!analysisId && !storedResult)
      router.replace(routes.registerIngredientReceipt);
  }, [analysisId, storedResult, router]);

  if (analysisId && !analysis.data) {
    if (analysis.isError) {
      const expired =
        analysis.error instanceof ApiError && analysis.error.status === 404;
      return (
        <AsyncViewState
          className="flex-1 justify-center"
          status="error"
          title={
            expired ? "보관 기간이 지났어요" : "인식 결과를 불러오지 못했어요"
          }
          description={expired ? "다시 촬영해 주세요" : undefined}
          action={
            expired ? (
              <AppLink
                href={routes.registerIngredientReceipt}
                className={asyncViewActionClassName}
              >
                다시 촬영하기
              </AppLink>
            ) : (
              <button
                type="button"
                className={asyncViewActionClassName}
                disabled={analysis.isFetching}
                onClick={() => void analysis.refetch()}
              >
                다시 시도
              </button>
            )
          }
        />
      );
    }
    return (
      <AsyncViewState
        className="flex-1 justify-center"
        status="loading"
        title="인식 결과를 불러오는 중입니다"
      />
    );
  }

  if (
    analysisId &&
    (analysis.data?.status === "QUEUED" ||
      analysis.data?.status === "PROCESSING")
  ) {
    const processed = analysis.data.results.filter(
      (image) => image.status === "COMPLETED" || image.status === "FAILED",
    ).length;
    return (
      <AsyncViewState
        className="flex-1 justify-center"
        status="loading"
        title={`사진 인식 중 · ${processed}/${analysis.data.results.length}장`}
        description="다른 화면으로 이동해도 인식은 계속돼요."
        action={
          <AppLink href={routes.home} className={asyncViewActionClassName}>
            다른 화면 둘러보기
          </AppLink>
        }
      />
    );
  }

  if (!result) return null;
  if (analysis.data?.status === "FAILED" || result.drafts.length === 0) {
    return (
      <AsyncViewState
        className="flex-1 justify-center"
        status="empty"
        title="인식한 재료가 없어요"
        description={
          (analysis.data && getAnalysisFailureMessage(analysis.data)) ??
          "사진을 다시 촬영하거나 직접 입력해 주세요."
        }
        action={
          <button
            type="button"
            className={asyncViewActionClassName}
            onClick={() => {
              removeAnalysis.mutate(result.analysisId);
              router.push(routes.registerIngredient);
            }}
          >
            재료 등록으로 이동
          </button>
        }
      />
    );
  }

  return (
    <RegisterCapacityBoundary>
      {(capacity) => (
        <ReceiptResultForm
          key={result.analysisId}
          capacity={capacity}
          result={result}
        />
      )}
    </RegisterCapacityBoundary>
  );
}

function ReceiptResultForm({
  capacity,
  result,
}: {
  capacity: RegisterCapacity;
  result: ReceiptRecognitionResult;
}) {
  const {
    form,
    fields,
    statuses,
    expirationNotes,
    hasUncertain,
    hasUnsetExpiration,
    photoCount,
    isTruncated,
    expandedIndex,
    toggle,
    removeDraft,
    submit,
    isRegistering,
    completedResult,
  } = useReceiptResultForm(result);

  return (
    <FormProvider {...form}>
      <PageActionLayout
        action={
          <div className="flex">
            <RegisterSubmitButton
              formId={FORM_ID}
              capacity={capacity}
              isSubmitting={isRegistering}
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
            {isTruncated ? (
              <p className="m-0 mt-3 rounded-[3px] bg-app-primary/10 px-4 py-3 text-[13px] leading-normal text-app-primary">
                일부만 인식했어요. 한 번에 {INGREDIENT_REGISTER_BATCH_LIMIT}
                건까지 불러와요.
              </p>
            ) : null}
            {result.unreadCount > 0 ? (
              <p className="m-0 mt-3 text-[13px] text-app-ink/60">
                사진 {result.unreadCount}장은 인식하지 못했어요. 인식된 재료를
                먼저 등록하고, 나머지는 직접 입력해 주세요.
              </p>
            ) : null}
            {hasUncertain ? (
              <p className="m-0 mt-3 rounded-[3px] bg-app-ink/5 px-4 py-3 text-[13px] leading-normal text-app-ink/60">
                영수증 {photoCount}장에서 인식했어요.{" "}
                {hasUnsetExpiration
                  ? "유통기한은 직접 지정해 주세요."
                  : "AI 인식 결과를 확인한 후 등록해 주세요."}
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
                    expirationHint={expirationNotes[index]}
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
        isRegistered={completedResult !== null}
        description="지금 나가면 수정한 내용이 사라져요"
      />
      <RegisterCompleteDialog result={completedResult} />
    </FormProvider>
  );
}
