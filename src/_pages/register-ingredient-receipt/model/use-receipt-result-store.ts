import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ReceiptRecognitionResult } from "./receipt-recognition";

type ReceiptResultState = {
  result: ReceiptRecognitionResult | null;
  setResult: (result: ReceiptRecognitionResult) => void;
  refrigeratorIds: Record<string, string>;
  rememberRefrigerator: (analysisId: string, refrigeratorId: string) => void;
};

export const useReceiptResultStore = create<ReceiptResultState>()(
  persist(
    (set) => ({
      result: null,
      setResult: (result) => set({ result }),
      refrigeratorIds: {},
      rememberRefrigerator: (analysisId, refrigeratorId) =>
        set((state) => ({
          refrigeratorIds: {
            ...state.refrigeratorIds,
            [analysisId]: refrigeratorId,
          },
        })),
    }),
    {
      name: "dameokja.analysis-refrigerators",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return sessionStorage.getItem(name);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            sessionStorage.setItem(name, value);
          } catch {
            /* 메모리의 등록 대상 확인은 유지한다. */
          }
        },
        removeItem: (name) => {
          try {
            sessionStorage.removeItem(name);
          } catch {
            /* 저장소가 차단된 브라우저에서는 메모리만 사용한다. */
          }
        },
      })),
      partialize: ({ refrigeratorIds }) => ({ refrigeratorIds }),
    },
  ),
);
