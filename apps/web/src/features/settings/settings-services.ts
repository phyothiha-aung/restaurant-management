import type {
  ApiErrorResponse,
  AppConfig,
  RestaurantSettings,
  UpdateRestaurantSettingsInput,
} from "@restaurant-management/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { appConfigKey } from "../app-config/app-config-api";
import { getApiErrorMessage } from "../../lib/api-error";
import {
  getRestaurantSettings,
  updateRestaurantSettings,
} from "./settings-api";

export const restaurantSettingsKey = ["restaurant-settings"] as const;

export const useRestaurantSettings = () =>
  useQuery<RestaurantSettings, AxiosError<ApiErrorResponse>>({
    queryKey: restaurantSettingsKey,
    queryFn: getRestaurantSettings,
  });

const toAppConfig = (settings: RestaurantSettings): AppConfig => ({
  restaurantName: settings.name,
  restaurantAddress: settings.address,
  restaurantPhone: settings.phone,
  restaurantTaxId: settings.taxId,
  timeZone: settings.timeZone,
  receiptFooter: settings.receiptFooter,
  receiptPaperWidth: settings.receiptPaperWidth,
});

export const useUpdateRestaurantSettings = () => {
  const queryClient = useQueryClient();
  return useMutation<
    RestaurantSettings,
    AxiosError<ApiErrorResponse>,
    UpdateRestaurantSettingsInput
  >({
    mutationFn: updateRestaurantSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(restaurantSettingsKey, settings);
      queryClient.setQueryData(appConfigKey, toAppConfig(settings));
      toast.success("Restaurant settings updated.");
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, "Could not update restaurant settings."),
      ),
  });
};
