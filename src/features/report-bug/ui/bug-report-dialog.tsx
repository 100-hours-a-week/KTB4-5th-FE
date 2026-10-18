"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ApiError } from "@/shared/api";
import { AppDialog } from "@/shared/ui/app-dialog";
import { showAppToast } from "@/shared/ui/app-toast";
import { FieldHelperText } from "@/shared/ui/field-helper-text";

import {
  BUG_REPORT_CATEGORIES,
  BUG_REPORT_DESCRIPTION_HINT,
  BUG_REPORT_DESCRIPTION_MAX_LENGTH,
  BUG_REPORT_REPORTER_NAME_EXAMPLE,
  BUG_REPORT_REPORTER_NAME_MAX_LENGTH,
  bugReportCategoryLabels,
  bugReportFormSchema,
} from "../model/bug-report-form.schema";
import type { BugReportFormValues } from "../model/bug-report-form.schema";
import { useSubmitBugReport } from "../model/use-submit-bug-report";

const REPORTER_NAME_HINT = "올바른 이름이 아니면 쿠폰을 전달하기 어려워요";
const RATE_LIMIT_MESSAGE = "잠시 후 다시 보내주세요";
const NETWORK_ERROR_MESSAGE = "인터넷 연결을 확인해 주세요";
const SERVER_ERROR_MESSAGE = "리포트를 보내지 못했어요. 다시 시도해 주세요";

function getSubmitErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 429) {
    return RATE_LIMIT_MESSAGE;
  }
  if (error instanceof TypeError) {
    return NETWORK_ERROR_MESSAGE;
  }
  return SERVER_ERROR_MESSAGE;
}

type BugReportDialogProps = {
  onDismiss: () => void;
};

export function BugReportDialog({ onDismiss }: BugReportDialogProps) {
  const fieldId = useId();
  const reporterNameId = `${fieldId}-reporter-name`;
  const reporterNameHelperId = `${fieldId}-reporter-name-helper`;
  const categoryHelperId = `${fieldId}-category-helper`;
  const descriptionId = `${fieldId}-description`;
  const descriptionHelperId = `${fieldId}-description-helper`;
  const submitMutation = useSubmitBugReport();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<BugReportFormValues>({
    resolver: zodResolver(bugReportFormSchema),
    mode: "onChange",
    defaultValues: { reporterName: "", description: "" },
  });
  const descriptionLength =
    useWatch({ control, name: "description" })?.length ?? 0;
  const isPending = submitMutation.isPending;

  async function onSubmit(values: BugReportFormValues) {
    try {
      await submitMutation.mutateAsync(values);
    } catch (error) {
      showAppToast({
        message: getSubmitErrorMessage(error),
        variant: "error",
        dedupeKey: "bug-report-error",
      });
      return;
    }

    onDismiss();
    showAppToast({
      message: "소중한 의견 고마워요! 빠르게 확인할게요",
      variant: "success",
    });
  }

  return (
    <AppDialog
      open
      title="불편한 점을 알려주세요"
      description="현재 화면 주소가 함께 전달돼요."
      dismissBehavior={isPending ? "none" : "secondary-action"}
      secondaryAction={{
        label: "취소",
        onClick: onDismiss,
        disabled: isPending,
      }}
      primaryAction={{
        label: isPending ? "보내는 중" : "보내기",
        onClick: () => void handleSubmit(onSubmit)(),
        disabled: !isValid || isPending,
      }}
    >
      <div className="mt-3">
        <label htmlFor={reporterNameId} className="text-[13px] font-bold">
          이름
        </label>
        <input
          id={reporterNameId}
          type="text"
          autoComplete="off"
          maxLength={BUG_REPORT_REPORTER_NAME_MAX_LENGTH}
          disabled={isPending}
          placeholder={BUG_REPORT_REPORTER_NAME_EXAMPLE}
          aria-invalid={errors.reporterName ? true : undefined}
          aria-describedby={reporterNameHelperId}
          className={`mt-1 block min-h-[var(--tap-min)] w-full rounded-[4px] border-[1.5px] bg-white px-3 font-app-body text-[16px] text-app-ink outline-none placeholder:text-[14px] placeholder:text-app-ink/30 ${
            errors.reporterName
              ? "border-app-primary"
              : "border-app-ink/25 focus:border-app-ink"
          }`}
          {...register("reporterName")}
        />
        <FieldHelperText
          id={reporterNameHelperId}
          hint={REPORTER_NAME_HINT}
          error={errors.reporterName?.message}
        />

        <fieldset
          className="m-0 mt-2 border-0 p-0"
          aria-describedby={categoryHelperId}
        >
          <legend className="mb-1 p-0 text-[13px] font-bold">유형</legend>
          <div className="flex flex-wrap gap-x-2">
            {BUG_REPORT_CATEGORIES.map((category) => (
              <label
                key={category}
                className="inline-flex min-h-[var(--tap-min)] cursor-pointer items-center"
              >
                <input
                  type="radio"
                  value={category}
                  disabled={isPending}
                  className="peer sr-only"
                  {...register("category")}
                />
                <span className="inline-flex items-center whitespace-nowrap rounded-[18px] border border-app-ink/20 px-4 py-2 text-[14px] leading-none text-app-ink/60 transition-colors peer-checked:border-app-ink peer-checked:bg-app-ink peer-checked:font-bold peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-app-ink">
                  {bugReportCategoryLabels[category]}
                </span>
              </label>
            ))}
          </div>
          <FieldHelperText
            id={categoryHelperId}
            hint="하나를 선택해주세요"
            error={errors.category?.message}
          />
        </fieldset>

        <div className="mt-2 flex items-baseline justify-between">
          <label htmlFor={descriptionId} className="text-[13px] font-bold">
            내용
          </label>
          <span
            aria-hidden="true"
            className="font-app-mono text-[11px] text-app-ink/40"
          >
            {descriptionLength}/{BUG_REPORT_DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id={descriptionId}
          rows={5}
          maxLength={BUG_REPORT_DESCRIPTION_MAX_LENGTH}
          disabled={isPending}
          placeholder="어떤 화면에서 무엇을 했을 때 문제가 생겼는지 적어주세요"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={descriptionHelperId}
          className={`mt-1 block w-full resize-none rounded-[4px] border-[1.5px] bg-white p-3 font-app-body text-[16px] leading-[1.5] text-app-ink outline-none placeholder:text-[14px] placeholder:text-app-ink/30 ${
            errors.description
              ? "border-app-primary"
              : "border-app-ink/25 focus:border-app-ink"
          }`}
          {...register("description")}
        />
        <FieldHelperText
          id={descriptionHelperId}
          hint={BUG_REPORT_DESCRIPTION_HINT}
          error={errors.description?.message}
        />
      </div>
    </AppDialog>
  );
}
