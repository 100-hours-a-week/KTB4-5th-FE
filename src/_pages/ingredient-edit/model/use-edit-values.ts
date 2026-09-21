"use client";

import { useWatch } from "react-hook-form";

import type { IngredientEditFormInput } from "./ingredient-edit-form-schema";

/**
 * 폼의 현재 입력값을 통째로 구독한다. 모든 칸이 기본값을 갖고 시작하므로
 * 부분 타입이 아니라 입력 타입 그대로 다룬다.
 */
export function useEditValues() {
  return useWatch<IngredientEditFormInput>() as IngredientEditFormInput;
}
