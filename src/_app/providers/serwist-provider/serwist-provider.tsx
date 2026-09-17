"use client";

import { SerwistProvider as SerwistRuntimeProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

type SerwistProviderProps = {
  children: ReactNode;
};

export function SerwistProvider({ children }: SerwistProviderProps) {
  return (
    <SerwistRuntimeProvider swUrl="/serwist/sw.js">
      {children}
    </SerwistRuntimeProvider>
  );
}
