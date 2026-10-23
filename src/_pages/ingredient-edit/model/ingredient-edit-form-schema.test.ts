import { expect, it, vi } from "vitest";
vi.mock("@lineiconshq/free-icons", () => ({ CalendarDaysOutlined: {} }));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));
import { createIngredientEditFormSchema } from "./ingredient-edit-form-schema";
const values = {
  name: "서울우유(1000ml)",
  category: "DAIRY",
  measureType: "COUNT",
  storageType: "REFRIGERATED",
  quantity: "2",
  weightValue: "",
  weightUnit: "G",
  expirationDate: "2026-12-31",
};
it("기존 이름을 유지하면 다른 필드를 수정할 수 있다", () => {
  expect(
    createIngredientEditFormSchema(
      values.expirationDate,
      values.name,
    ).safeParse(values).success,
  ).toBe(true);
});
it("이름을 바꾸면 기존 신규 입력 규칙을 적용한다", () => {
  const schema = createIngredientEditFormSchema(
    values.expirationDate,
    values.name,
  );
  expect(
    schema.safeParse({ ...values, name: "다른우유(1000ml)" }).success,
  ).toBe(false);
  expect(schema.safeParse({ ...values, name: "우유" }).success).toBe(true);
  expect(schema.safeParse({ ...values, name: "" }).success).toBe(false);
});
