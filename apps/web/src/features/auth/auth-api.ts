import type { AxiosInstance } from "axios";
import type {
  ApiSuccessResponse,
  User,
} from "@restaurant-management/shared";

import apiClient from "../../lib/api-client";
import type { LoginType } from "../../lib/validations/login-schema";

export type LoginResult = {
  user: User;
  accessToken: string;
};

export const loginRequest = async (
  credentials: LoginType,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.post<ApiSuccessResponse<LoginResult>>(
    "/api/auth/login",
    credentials,
    {
      withCredentials: true,
    },
  );

  return response.data.data;
};

export const logoutRequest = async (client: AxiosInstance = apiClient) => {
  await client.post("/api/auth/logout", {}, { withCredentials: true });
};
