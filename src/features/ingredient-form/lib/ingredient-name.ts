import { TEXT_FIELD_MAX_LENGTH } from "@/shared/config";

const ALLOWED_NAME_CHARACTERS = /[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]/g;

export function sanitizeIngredientNameInput(value: string) {
  return value
    .replace(/\s/g, " ")
    .replace(ALLOWED_NAME_CHARACTERS, "")
    .slice(0, TEXT_FIELD_MAX_LENGTH);
}
