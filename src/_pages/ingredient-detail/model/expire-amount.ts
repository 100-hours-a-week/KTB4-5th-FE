import {
  INGREDIENT_QUANTITY_UNIT,
  type Ingredient,
} from "@/entities/ingredient";

export type ExpireQuickOption = {
  label: string;
  amount: number;
  disabled: boolean;
};

// 사용자가 바꿀 수 없는 고정값이다. 보유량보다 큰 값은 비활성으로 둔다.
const QUICK_AMOUNTS = [1, 5];

export type ExpireAmountField = {
  stock: number;
  amount: number | null;
  quickOptions: ExpireQuickOption[];
  helperText: string;
  hasError: boolean;
  canSubmit: boolean;
};

// 비울 수량은 1개부터 보유량까지만 받는다.
export function getExpireAmountField(
  ingredient: Ingredient,
  value: string,
): ExpireAmountField {
  const stock = ingredient.quantity;
  const amount = value === "" ? null : Number(value);
  const isValid = amount !== null && amount > 0 && amount <= stock;

  return {
    stock,
    amount,
    quickOptions: getQuickOptions(stock),
    helperText: `1~${stock} 사이로 입력해 주세요`,
    hasError: amount !== null && !isValid,
    canSubmit: isValid,
  };
}

function getQuickOptions(stock: number): ExpireQuickOption[] {
  const partialOptions = QUICK_AMOUNTS.map((amount) => ({
    label: `${amount}${INGREDIENT_QUANTITY_UNIT}`,
    amount,
    disabled: amount > stock,
  }));

  // 시트는 보유량이 2 이상일 때만 열리므로 전체는 항상 고를 수 있다.
  return [...partialOptions, { label: "전체", amount: stock, disabled: false }];
}
