"use client";

import { SerwistProvider as SerwistRuntimeProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

import { isMswEnabled } from "../../mocks/enabled";

type SerwistProviderProps = {
  children: ReactNode;
};

export function SerwistProvider({ children }: SerwistProviderProps) {
  if (isMswEnabled()) {
    return children;
  }

  return (
    <SerwistRuntimeProvider swUrl="/serwist/sw.js">
      {children}
    </SerwistRuntimeProvider>
  );
}
