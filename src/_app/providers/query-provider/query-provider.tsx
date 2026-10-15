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
import { ApiError, SessionExpiredError } from "@/shared/api";

const MAX_NETWORK_RETRIES = 1;

function shouldRetryQuery(failureCount: number, error: unknown) {
  if (error instanceof ApiError || error instanceof SessionExpiredError) {
    return false;
  }
  return failureCount < MAX_NETWORK_RETRIES;
}

export function createQueryClient(): QueryClient {
  const clientRef: { current: QueryClient | null } = { current: null };

  const handleSessionExpired = (error: unknown) => {
    if (error instanceof SessionExpiredError && clientRef.current) {
      expireSession(clientRef.current);
    }
  };

  const client = new QueryClient({
    defaultOptions: { queries: { retry: shouldRetryQuery } },
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

  if (process.env.NEXT_PUBLIC_LIST_PERF === "true") {
    (
      window as Window & {
        __listPerfQuerySnapshot?: (type: "ingredient" | "notification") => {
          queryCount: number;
          pages: number;
          estimatedJsonBytes: number;
        };
      }
    ).__listPerfQuerySnapshot = (type) => {
      const queries = browserQueryClient!
        .getQueryCache()
        .getAll()
        .filter(
          (query) =>
            query.queryKey.includes(
              type === "ingredient" ? "ingredients" : "notifications",
            ) && query.queryKey.includes("list"),
        );
      const values = queries.map((query) => query.state.data).filter(Boolean);
      return {
        queryCount: queries.length,
        pages: values.flatMap(
          (value) => (value as { pages?: unknown[] }).pages ?? [],
        ).length,
        estimatedJsonBytes: new TextEncoder().encode(JSON.stringify(values))
          .length,
      };
    };
  }

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
