import { create } from "zustand";

import type { RegisterBatchResult } from "./register-result";

type RegisterResultState = {
  result: RegisterBatchResult | null;
  setResult: (result: RegisterBatchResult) => void;
  clearResult: () => void;
};

// 등록 응답을 완료 모달과 합산 결과 페이지 사이에서만 잠시 공유한다.
export const useRegisterResultStore = create<RegisterResultState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}));
