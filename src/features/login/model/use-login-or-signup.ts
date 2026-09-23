"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setCurrentRefrigeratorId } from "@/entities/refrigerator";
import { ApiError } from "@/shared/api";

import { login, type LoginRequest, type LoginResult } from "../api/login";
import { signup } from "../api/signup";

const ACCOUNT_NOT_FOUND_CODE = "AUTH-404-001";

export type LoginOrSignupResult = {
  data: LoginResult;
  isNewAccount: boolean;
};

export async function loginOrSignup(
  request: LoginRequest,
): Promise<LoginOrSignupResult> {
  try {
    const response = await login(request);
    return { data: response.data, isNewAccount: false };
  } catch (error) {
    if (error instanceof ApiError && error.code === ACCOUNT_NOT_FOUND_CODE) {
      const response = await signup(request);
      return { data: response.data, isNewAccount: true };
    }

    throw error;
  }
}

export function useLoginOrSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginOrSignup,
    onSuccess: ({ data }) => {
      queryClient.removeQueries();
      setCurrentRefrigeratorId(data.activeRefrigeratorIds[0] ?? null);
    },
  });
}
