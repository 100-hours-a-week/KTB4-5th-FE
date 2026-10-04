"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

import { reportOperationFailure } from "@/_app/monitoring/index.client";
import { expireSession } from "@/_app/providers/session-expiry";
import { SessionExpiredError } from "@/shared/api";

export function createQueryClient(): QueryClient {
  const clientRef: { current: QueryClient | null } = { current: null };

  const handleSessionExpired = (error: unknown) => {
    if (error instanceof SessionExpiredError && clientRef.current) {
      expireSession(clientRef.current);
    }
  };

  const client = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        handleSessionExpired(error);
        reportOperationFailure(error, query.meta);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        handleSessionExpired(error);
        reportOperationFailure(error, mutation.meta);
      },
    }),
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
