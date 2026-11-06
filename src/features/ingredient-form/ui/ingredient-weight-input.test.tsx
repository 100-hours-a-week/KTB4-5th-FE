// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { IngredientWeightInput } from "./ingredient-weight-input";
afterEach(cleanup);
it("숫자와 소수 둘째 자리까지만 남기고 정수부는 다섯 자리로 자른다", () => {
  const onChange = vi.fn();
  render(
    <IngredientWeightInput
      id="weight"
      name="weightValue"
      value="150.5"
      describedBy="help"
      invalid={false}
      inputRef={null}
      onValueChange={onChange}
      onBlur={() => {}}
      unitName="unit"
      unitValue="G"
      unitRef={null}
      onUnitChange={() => {}}
      onUnitBlur={() => {}}
    />,
  );
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "150.6" } });
  expect(onChange).toHaveBeenLastCalledWith("150.6");
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "500001" },
  });
  expect(onChange).toHaveBeenLastCalledWith("50000");
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "가a-1.2.345" },
  });
  expect(onChange).toHaveBeenLastCalledWith("1.23");
});
