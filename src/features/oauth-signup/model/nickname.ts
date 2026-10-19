export const NICKNAME_MAX_LENGTH = 10;
export const NICKNAME_DISALLOWED_CHARS = /[^ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9]/g;
export const NICKNAME_HINT =
  "2~10자 · 한글/영문/숫자 · 특수문자 불가 · 금칙어 사용 불가";
export const NICKNAME_LENGTH_ERROR =
  "최소 2글자, 최대 10글자 사이로 입력해주세요.";

const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]{2,10}$/;

export function isValidNickname(nickname: string): boolean {
  return NICKNAME_PATTERN.test(nickname);
}
