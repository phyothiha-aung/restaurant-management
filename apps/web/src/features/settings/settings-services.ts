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
  attachRestaurantLogo,
  removeRestaurantLogo,
  updateRestaurantSettings,
  uploadRestaurantLogo,
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
  restaurantLogoUrl: settings.logoUrl,
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

export const useReplaceRestaurantLogo = () => {
  const queryClient = useQueryClient();
  return useMutation<
    RestaurantSettings,
    AxiosError<ApiErrorResponse>,
    { file: File; onProgress: (progress: number) => void }
  >({
    mutationFn: async ({ file, onProgress }) => {
      const uploaded = await uploadRestaurantLogo(file, onProgress);
      return attachRestaurantLogo(uploaded.id);
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(restaurantSettingsKey, settings);
      queryClient.setQueryData(appConfigKey, toAppConfig(settings));
      toast.success("Restaurant logo updated.");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not update the restaurant logo.")),
  });
};

export const useRemoveRestaurantLogo = () => {
  const queryClient = useQueryClient();
  return useMutation<RestaurantSettings, AxiosError<ApiErrorResponse>>({
    mutationFn: removeRestaurantLogo,
    onSuccess: (settings) => {
      queryClient.setQueryData(restaurantSettingsKey, settings);
      queryClient.setQueryData(appConfigKey, toAppConfig(settings));
      toast.success("Restaurant logo removed. The default logo is now in use.");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not remove the restaurant logo.")),
  });
};
