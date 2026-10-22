export const NICKNAME_MAX_LENGTH = 10;
export const NICKNAME_DISALLOWED_CHARS = /[^ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9]/g;
export const NICKNAME_HINT =
  "2~10자 · 한글/영문/숫자 · 특수문자 불가 · 금칙어 사용 불가";
const NICKNAME_LENGTH_ERROR = "최소 2글자, 최대 10글자 사이로 입력해주세요.";
const NICKNAME_JAMO_ERROR = "자음이나 모음만 따로 쓸 수 없어요";

const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]{2,10}$/;
const NICKNAME_JAMO = /[ㄱ-ㅎㅏ-ㅣ]/;

export function isValidNickname(nickname: string): boolean {
  return NICKNAME_PATTERN.test(nickname);
}

export function getNicknameFormatError(nickname: string): string | null {
  if (nickname.length < 2 || nickname.length > NICKNAME_MAX_LENGTH)
    return NICKNAME_LENGTH_ERROR;
  if (NICKNAME_JAMO.test(nickname)) return NICKNAME_JAMO_ERROR;
  return null;
}
