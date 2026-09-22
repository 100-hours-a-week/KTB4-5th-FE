"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

import { setCurrentRefrigeratorId } from "@/entities/refrigerator";
import { SessionExpiredError } from "@/shared/api";
import { routes } from "@/shared/routes";

const defaultOptions: QueryClientConfig["defaultOptions"] = {
  queries: {
    // TODO: 도메인별 최신성 정책이 확정되면 각 Query Option Factory에서 재정의한다.
    staleTime: 0,
  },
};

function createQueryClient(): QueryClient {
  const clientRef: { current: QueryClient | null } = { current: null };

  const handleSessionExpired = (error: unknown) => {
    if (!(error instanceof SessionExpiredError)) {
      return;
    }

    clientRef.current?.clear();

    // 이동 방식 매트릭스: 로그아웃 → 로그인은 replace. 뒤로가기로 이전
    // 사용자의 보호 화면에 다시 들어가지 않게 한다.
    if (typeof window !== "undefined") {
      setCurrentRefrigeratorId(null);
      window.location.replace(routes.login);
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
