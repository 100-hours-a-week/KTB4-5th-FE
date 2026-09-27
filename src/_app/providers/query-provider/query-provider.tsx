"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

import { expireSession } from "@/_app/providers/session-expiry";
import { SessionExpiredError } from "@/shared/api";

const defaultOptions: QueryClientConfig["defaultOptions"] = {
  queries: {
    // TODO: 도메인별 최신성 정책이 확정되면 각 Query Option Factory에서 재정의한다.
    staleTime: 0,
  },
};

function createQueryClient(): QueryClient {
  const clientRef: { current: QueryClient | null } = { current: null };

  const handleSessionExpired = (error: unknown) => {
    if (error instanceof SessionExpiredError && clientRef.current) {
      expireSession(clientRef.current);
    }
  };

  const client = new QueryClient({
    defaultOptions,
    queryCache: new QueryCache({ onError: handleSessionExpired }),
    mutationCache: new MutationCache({ onError: handleSessionExpired }),
  });

  clientRef.current = client;

  return client;
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return createQueryClient();
  }

  browserQueryClient ??= createQueryClient();

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
