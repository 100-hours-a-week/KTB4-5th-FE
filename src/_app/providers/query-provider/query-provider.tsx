"use client";

import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // TODO: 도메인별 최신성 정책이 확정되면 각 Query Option Factory에서 재정의한다.
      staleTime: 0,
    },
  },
};

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return new QueryClient(queryClientConfig);
  }

  browserQueryClient ??= new QueryClient(queryClientConfig);

  return browserQueryClient;
}

type QueryProviderProps = {
  children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
