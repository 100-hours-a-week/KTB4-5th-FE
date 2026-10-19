import { create } from "zustand";

import type { RegisterBatchResult } from "@/entities/ingredient";

type RegisterResultState = {
  result: RegisterBatchResult | null;
  setResult: (result: RegisterBatchResult) => void;
  clearResult: () => void;
};

export const useRegisterResultStore = create<RegisterResultState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}));
