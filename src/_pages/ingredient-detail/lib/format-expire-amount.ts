import { INGREDIENT_QUANTITY_UNIT } from "@/entities/ingredient";

import type { ExpireAmountField } from "../model/expire-amount";

// 입력 전에는 입력 범위를, 입력한 뒤에는 비우고 남는 수량을 알려 준다.
export function formatExpireAmountHelper(field: ExpireAmountField): string {
  if (!field.canSubmit || field.amount === null) {
    return field.helperText;
  }

  const remainder = field.stock - field.amount;

  return `비운 뒤 남는 수량 ${remainder}${INGREDIENT_QUANTITY_UNIT}`;
}

// 키패드 입력은 문자열로 이어 붙인다. 앞자리 0은 받지 않고, 보유량보다 긴 자릿수도 막는다. 
// 보유량을 넘는 값 자체는 막지 않고 안내 문구로 알려 준다.
export function appendExpireDigit(
  value: string,
  digit: string,
  stock: number,
): string {
  if (value === "" && digit === "0") {
    return value;
  }

  return value.length >= String(stock).length ? value : `${value}${digit}`;
}
