import { useMutation } from "@tanstack/react-query";
import type { ApiErrorResponse } from "@restaurant-management/shared";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

import { useAuthStore } from "../../store/useAuthStore";
import type { LoginType } from "../../lib/validations/login-schema";
import { getApiErrorMessage } from "../../lib/api-error";
import { loginRequest, logoutRequest, type LoginResult } from "./auth-api";

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<LoginResult, AxiosError<ApiErrorResponse>, LoginType>({
    mutationFn: (credentials) => loginRequest(credentials),
    onSuccess: (result) => {
      setAuth(result.user, result.accessToken);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Login failed. Please try again."));
    },
  });
};

export const logout = async () => {
  try {
    await logoutRequest();
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Logout failed. Please try again."));
  } finally {
    useAuthStore.getState().logout();
  }
};
