import { TEXT_FIELD_MAX_LENGTH } from "@/shared/config";

// 재료 이름에 허용하는 문자. 한글·영문·숫자와 낱말을 나누는 공백만 남긴다.
const ALLOWED_NAME_CHARACTERS = /[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]/g;

/**
 * 입력 즉시 적용하는 필터다. 특수문자와 이모지는 입력 자체를 막고,
 * 글자 수 검사와 헬퍼 표시는 schema가 맡는다.
 */
export function sanitizeIngredientNameInput(value: string) {
  return value
    .replace(/\s/g, " ")
    .replace(ALLOWED_NAME_CHARACTERS, "")
    .slice(0, TEXT_FIELD_MAX_LENGTH * 2);
}

/** 저장 시 앞뒤 공백을 지우고 중간 공백은 1칸으로 줄인다. */
export function normalizeIngredientName(value: string) {
  return value.trim().replace(/ {2,}/g, " ");
}

/**
 * 숫자 칸 입력 필터다. 숫자만 남기고 앞자리 0을 제거한다(007 → 7).
 * 상한을 넘는 값은 헬퍼로 알려야 하므로 여기서 자르지 않고 자릿수만 제한한다.
 */
export function sanitizeIntegerInput(value: string, maxLength: number) {
  const digits = value.replace(/\D/g, "").slice(0, maxLength);
  const withoutLeadingZeros = digits.replace(/^0+(?=\d)/, "");

  return withoutLeadingZeros === "0" ? "" : withoutLeadingZeros;
}
