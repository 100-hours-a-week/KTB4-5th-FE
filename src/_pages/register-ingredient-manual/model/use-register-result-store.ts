import { create } from "zustand";

import type { RegisterBatchResult } from "@/entities/ingredient";

type RegisterResultState = {
  result: RegisterBatchResult | null;
  setResult: (result: RegisterBatchResult) => void;
  clearResult: () => void;
};

// 합산 결과 확인을 누른 순간부터 결과 페이지가 소비할 때까지만 응답을 보관한다.
export const useRegisterResultStore = create<RegisterResultState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}));
