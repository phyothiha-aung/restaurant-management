import type {
  ApiSuccessResponse,
  RestaurantSettings,
  UpdateRestaurantSettingsInput,
} from "@restaurant-management/shared";
import apiClient from "../../lib/api-client";

export const getRestaurantSettings = async () => {
  const response = await apiClient.get<ApiSuccessResponse<RestaurantSettings>>(
    "/api/restaurant-settings",
  );
  return response.data.data;
};

export const updateRestaurantSettings = async (
  input: UpdateRestaurantSettingsInput,
) => {
  const response = await apiClient.patch<ApiSuccessResponse<RestaurantSettings>>(
    "/api/restaurant-settings",
    input,
  );
  return response.data.data;
};
