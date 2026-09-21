/**
 * 숫자 칸 입력 필터다. 숫자만 남기고 앞자리 0을 제거한다(007 → 7).
 * 상한을 넘는 값은 헬퍼로 알려야 하므로 여기서 자르지 않고 자릿수만 제한한다.
 */
export function sanitizeIntegerInput(value: string, maxLength: number) {
  const digits = value.replace(/\D/g, "").slice(0, maxLength);
  const withoutLeadingZeros = digits.replace(/^0+(?=\d)/, "");

  return withoutLeadingZeros === "0" ? "" : withoutLeadingZeros;
}
