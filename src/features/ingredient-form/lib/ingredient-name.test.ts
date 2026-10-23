import { expect, it } from "vitest";
import { sanitizeIngredientNameInput } from "./ingredient-name";
it("NFD 한글을 조합한 뒤 정제하고 길이를 제한한다", () => {
  expect(sanitizeIngredientNameInput("서울우유".normalize("NFD"))).toBe(
    "서울우유",
  );
  expect(
    sanitizeIngredientNameInput("가나다라마바사아자차".normalize("NFD")),
  ).toBe("가나다라마바사아자차");
});
