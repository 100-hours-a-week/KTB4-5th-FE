import { INGREDIENT_WEIGHT_MAX } from "@/shared/config";

const INTEGER_MAX_LENGTH = String(INGREDIENT_WEIGHT_MAX).length;
const FRACTION_MAX_LENGTH = 2;

export function sanitizeDecimalInput(value: string) {
  const [integer = "", ...fractions] = value.replace(/[^\d.]/g, "").split(".");
  const integerPart = integer
    .slice(0, INTEGER_MAX_LENGTH)
    .replace(/^0+(?=\d)/, "");

  if (fractions.length === 0) return integerPart;

  return `${integerPart || "0"}.${fractions.join("").slice(0, FRACTION_MAX_LENGTH)}`;
}
