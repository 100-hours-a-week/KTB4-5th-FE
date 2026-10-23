// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { IngredientWeightInput } from "./ingredient-weight-input";
afterEach(cleanup);
it("소수점과 범위 초과 입력을 다른 수로 바꾸지 않고 검증 계층에 전달한다", () => {
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
  expect(onChange).toHaveBeenLastCalledWith("500001");
});
