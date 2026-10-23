import { expect, it } from "vitest";
import { normalizeInviteCodeInput } from "./invite-code";
it("허용 문자만 남긴 뒤 6자리로 자른다", () => {
  expect(normalizeInviteCodeInput("ab😀-c d12한글")).toBe("ABCD12");
  expect(normalizeInviteCodeInput("abcde😀fgh")).toBe("ABCDEF");
});
