import type { ApiSuccessResponse, AppConfig } from "@restaurant-management/shared";
import apiClient from "../../lib/api-client";

export const appConfigKey = ["app-config"] as const;

export const getAppConfig = async () => {
  const response = await apiClient.get<ApiSuccessResponse<AppConfig>>("/api/config");
  return response.data.data;
};
