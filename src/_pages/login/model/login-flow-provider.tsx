"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { useEnterHome } from "./use-enter-home";

type LoginFlowContextValue = {
  enterHome: () => void;
  isEnteringHome: boolean;
};

const LoginFlowContext = createContext<LoginFlowContextValue | null>(null);

export function LoginFlowProvider({ children }: { children: ReactNode }) {
  const { enterHome, isPending } = useEnterHome();

  return (
    <LoginFlowContext.Provider value={{ enterHome, isEnteringHome: isPending }}>
      {children}
    </LoginFlowContext.Provider>
  );
}

export function useLoginFlow() {
  const context = useContext(LoginFlowContext);

  if (context === null) {
    throw new Error("useLoginFlow must be used within LoginFlowProvider.");
  }

  return context;
}
