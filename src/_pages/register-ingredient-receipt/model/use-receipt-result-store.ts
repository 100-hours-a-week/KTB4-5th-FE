import { create } from "zustand";

import type { ReceiptRecognitionResult } from "./receipt-recognition";

type ReceiptResultState = {
  result: ReceiptRecognitionResult | null;
  setResult: (result: ReceiptRecognitionResult) => void;
};

export const useReceiptResultStore = create<ReceiptResultState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
}));
