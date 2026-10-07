import type {
  ApiSuccessResponse,
  RestaurantSettings,
  StoredFileUpload,
  UpdateRestaurantSettingsInput,
} from "@restaurant-management/shared";
import apiClient from "../../lib/api-client";
import { uploadToS3, type PresignedPost } from "../../lib/s3-upload";

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

interface PresignedRestaurantLogo {
  file: StoredFileUpload;
  upload: PresignedPost;
}

export const uploadRestaurantLogo = async (
  file: File,
  onProgress: (progress: number) => void,
) => {
  const presign = await apiClient.post<ApiSuccessResponse<PresignedRestaurantLogo>>(
    "/api/restaurant-settings/logo/presign",
    { fileName: file.name, mimeType: file.type, sizeBytes: file.size },
  );
  const staged = presign.data.data;
  await uploadToS3(staged.upload, file, onProgress);
  const complete = await apiClient.post<ApiSuccessResponse<StoredFileUpload>>(
    `/api/restaurant-settings/logo/uploads/${staged.file.id}/complete`,
  );
  return complete.data.data;
};

export const attachRestaurantLogo = async (fileId: string) => {
  const response = await apiClient.put<ApiSuccessResponse<RestaurantSettings>>(
    "/api/restaurant-settings/logo",
    { fileId },
  );
  return response.data.data;
};

export const removeRestaurantLogo = async () => {
  const response = await apiClient.delete<ApiSuccessResponse<RestaurantSettings>>(
    "/api/restaurant-settings/logo",
  );
  return response.data.data;
};
