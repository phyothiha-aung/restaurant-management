import type { ApiSuccessResponse, User } from "@restaurant-management/shared";
import type { AxiosInstance } from "axios";
import apiClient from "../../lib/api-client";

export interface UpdateProfileInput {
  name?: string;
  password?: string;
}

export const getMyProfile = async (client: AxiosInstance = apiClient) => {
  const response = await client.get<ApiSuccessResponse<User>>("/api/users/me");
  return response.data.data;
};

export const updateMyProfile = async (
  input: UpdateProfileInput,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.patch<ApiSuccessResponse<User>>(
    "/api/users/me",
    input,
  );
  return response.data.data;
};
