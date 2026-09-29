"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GalleryOutlined, XmarkOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useId, useRef, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ApiError } from "@/shared/api";
import {
  AppBottomSheet,
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { showAppToast } from "@/shared/ui/app-toast";
import { FieldHelperText } from "@/shared/ui/field-helper-text";
import { FooterButton } from "@/shared/ui/footer-button";

import {
  BUG_REPORT_CATEGORIES,
  BUG_REPORT_DESCRIPTION_HINT,
  BUG_REPORT_DESCRIPTION_MAX_LENGTH,
  BUG_REPORT_REPORTER_NAME_EXAMPLE,
  BUG_REPORT_REPORTER_NAME_MAX_LENGTH,
  BUG_REPORT_SCREENSHOT_TYPES,
  bugReportCategoryLabels,
  bugReportFormSchema,
  getScreenshotError,
} from "../model/bug-report-form.schema";
import type { BugReportFormValues } from "../model/bug-report-form.schema";
import { useSubmitBugReport } from "../model/use-submit-bug-report";

const REPORTER_NAME_HINT = "올바른 이름이 아니면 쿠폰을 전달하기 어려워요";
const SCREENSHOT_HINT = "선택 · 8MB 이하 이미지 1장";
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

type BugReportSheetProps = {
  open: boolean;
  onDismiss: () => void;
};

export function BugReportSheet({ open, onDismiss }: BugReportSheetProps) {
  const fieldId = useId();
  const reporterNameId = `${fieldId}-reporter-name`;
  const reporterNameHelperId = `${fieldId}-reporter-name-helper`;
  const categoryHelperId = `${fieldId}-category-helper`;
  const descriptionId = `${fieldId}-description`;
  const descriptionHelperId = `${fieldId}-description-helper`;
  const screenshotHelperId = `${fieldId}-screenshot-helper`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const submitMutation = useSubmitBugReport();
  const {
    register,
    handleSubmit,
    reset,
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

  function clearScreenshot() {
    setScreenshot(null);
    setScreenshotError(null);
  }

  function handleScreenshotChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 파일을 지웠다가 다시 골라도 change가 발생하도록 바로 비운다.
    event.target.value = "";
    if (!file) {
      return;
    }

    const error = getScreenshotError(file);
    setScreenshotError(error);
    setScreenshot(error ? null : file);
  }

  function handleDismiss() {
    if (!isPending) {
      onDismiss();
    }
  }

  async function onSubmit(values: BugReportFormValues) {
    try {
      await submitMutation.mutateAsync({ ...values, screenshot });
    } catch (error) {
      showAppToast({
        message: getSubmitErrorMessage(error),
        variant: "error",
        dedupeKey: "bug-report-error",
      });
      return;
    }

    reset();
    clearScreenshot();
    onDismiss();
    showAppToast({
      message: "소중한 의견 고마워요! 빠르게 확인할게요",
      variant: "success",
    });
  }

  return (
    <AppBottomSheet
      open={open}
      onDismiss={handleDismiss}
      dismissBehavior={isPending ? "none" : "dismiss"}
    >
      <AppBottomSheetTitle className="m-0 font-app-heading text-[16px] font-black leading-[1.35] tracking-normal">
        불편한 점을 알려주세요
      </AppBottomSheetTitle>
      <AppBottomSheetDescription className="m-[4px_0_12px] font-app-body text-[12.5px] leading-[1.35] text-app-ink/50">
        현재 화면 주소와 기기 정보가 함께 전달돼요.
      </AppBottomSheetDescription>

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
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

        <p className="mt-2 mb-1 text-[13px] font-bold">스크린샷</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={BUG_REPORT_SCREENSHOT_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleScreenshotChange}
        />
        {screenshot ? (
          <div className="flex min-h-[var(--tap-min)] items-center gap-2 rounded-[4px] border-[1.5px] border-app-ink/25 bg-white pl-3">
            <Lineicons
              icon={GalleryOutlined}
              size={18}
              aria-hidden="true"
              focusable="false"
            />
            <span className="min-w-0 flex-1 truncate text-[13px]">
              {screenshot.name}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={clearScreenshot}
              aria-label="스크린샷 삭제"
              className="grid size-[var(--tap-min)] shrink-0 cursor-pointer place-items-center bg-transparent text-app-ink/60 disabled:cursor-not-allowed"
            >
              <Lineicons
                icon={XmarkOutlined}
                size={16}
                aria-hidden="true"
                focusable="false"
              />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            aria-describedby={screenshotHelperId}
            className="flex min-h-[var(--tap-min)] w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] border-[1.5px] border-dashed border-app-ink/25 bg-transparent text-[13px] text-app-ink/60 disabled:cursor-not-allowed"
          >
            <Lineicons
              icon={GalleryOutlined}
              size={18}
              aria-hidden="true"
              focusable="false"
            />
            이미지 첨부
          </button>
        )}
        <FieldHelperText
          id={screenshotHelperId}
          hint={SCREENSHOT_HINT}
          error={screenshotError ?? undefined}
        />

        <div className="mt-3 flex gap-2">
          <FooterButton
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={handleDismiss}
          >
            취소
          </FooterButton>
          <FooterButton
            size="sm"
            type="submit"
            disabled={!isValid || isPending}
          >
            {isPending ? "보내는 중" : "보내기"}
          </FooterButton>
        </div>
      </form>
    </AppBottomSheet>
  );
}
