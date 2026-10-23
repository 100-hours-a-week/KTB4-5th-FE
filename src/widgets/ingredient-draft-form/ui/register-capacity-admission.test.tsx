// @vitest-environment jsdom
import { zodResolver } from "@hookform/resolvers/zod";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@lineiconshq/free-icons", () => ({ CalendarDaysOutlined: {} }));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));
import { getTodayInSeoul } from "@/shared/lib/seoul-date";
import {
  ingredientDraftFormSchema,
  type IngredientDraftFormInput,
  type IngredientDraftFormValues,
} from "../model/ingredient-draft-form-schema";
import { RegisterSubmitButton } from "./register-submit-button";
import { RegisterSummaryLine } from "./register-summary-line";
function Form({ isEstimate }: { isEstimate: boolean }) {
  const form = useForm<
    IngredientDraftFormInput,
    unknown,
    IngredientDraftFormValues
  >({
    resolver: zodResolver(ingredientDraftFormSchema),
    mode: "onChange",
    defaultValues: {
      drafts: [
        {
          name: "우유",
          category: "DAIRY",
          storageType: "REFRIGERATED",
          quantity: "1",
          weightValue: "",
          weightUnit: "G",
          expirationDate: getTodayInSeoul(),
        },
      ],
    },
  });
  useEffect(() => {
    void form.trigger();
  }, [form]);
  const capacity = {
    stockTypeCount: 1500,
    stockTypeLimit: 1500,
    remainingSlots: 0,
    isLimitReached: true,
    existingStockKeys: [],
    isEstimate,
  };
  return (
    <FormProvider {...form}>
      <RegisterSummaryLine id="summary" capacity={capacity} />
      <RegisterSubmitButton
        formId="form"
        capacity={capacity}
        isSubmitting={false}
      />
    </FormProvider>
  );
}
afterEach(cleanup);
it("목록이 일부이면 합산 대상을 모른다는 이유로 등록을 막지 않는다", async () => {
  render(<Form isEstimate />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "등록하기" }).hasAttribute("disabled"),
    ).toBe(false),
  );
  expect(screen.getByText(/합산·용량은 등록 시 확인해요/)).toBeTruthy();
});
it("전체 후보가 확인된 경우에는 기존 용량 초과 차단을 유지한다", async () => {
  render(<Form isEstimate={false} />);
  await screen.findByText("1종을 줄여야 등록할 수 있어요");
  expect(
    screen.getByRole("button", { name: "등록하기" }).hasAttribute("disabled"),
  ).toBe(true);
});
