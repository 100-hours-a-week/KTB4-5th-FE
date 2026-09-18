"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type LoginStep = "login" | "notification-onboarding";

type LoginFlowContextValue = {
  step: LoginStep;
  showLogin: () => void;
  showNotificationOnboarding: () => void;
};

const LoginFlowContext = createContext<LoginFlowContextValue | null>(null);

export function LoginFlowProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<LoginStep>("login");

  return (
    <LoginFlowContext.Provider
      value={{
        step,
        showLogin: () => setStep("login"),
        showNotificationOnboarding: () => setStep("notification-onboarding"),
      }}
    >
      <div className="group contents" data-login-step={step}>
        {children}
      </div>
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
