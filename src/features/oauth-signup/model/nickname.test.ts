import { expect, it } from "vitest";
import { sanitizeNicknameInput } from "./nickname";
it("분해형 한글은 먼저 조합하고 닉네임 규칙을 적용한다", () => {
  expect(sanitizeNicknameInput("가나다라마바사아자차".normalize("NFD"))).toBe(
    "가나다라마바사아자차",
  );
  expect(sanitizeNicknameInput("테스트😀닉네임")).toBe("테스트닉네임");
});
