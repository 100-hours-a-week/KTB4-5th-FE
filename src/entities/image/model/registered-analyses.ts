"use client";

import { create } from "zustand";

type RegisteredAnalysesState = {
  idsBySession: Record<string, string[]>;
  markRegistered: (session: string, analysisId: string) => void;
};

export const useRegisteredAnalyses = create<RegisteredAnalysesState>((set) => ({
  idsBySession: {},
  markRegistered: (session, analysisId) =>
    set((state) => ({
      idsBySession: {
        ...state.idsBySession,
        [session]: [
          ...new Set([...(state.idsBySession[session] ?? []), analysisId]),
        ],
      },
    })),
}));
