import type {
  Addon,
  ApiSuccessResponse,
  PaginatedResponse,
  Product,
  StoredFileUpload,
} from "@restaurant-management/shared";
import type { AxiosInstance } from "axios";
import apiClient from "../../lib/api-client";
import { uploadToS3, type PresignedPost } from "../../lib/s3-upload";

export interface CatalogListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  categoryId?: number;
}

export interface VariantInput {
  id?: number;
  name: string;
  price: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AddonAssignmentInput {
  addonId: number;
  maxQuantity: number;
  sortOrder: number;
}

export interface CreateProductInput {
  categoryId: number;
  code?: string | null;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  variants: VariantInput[];
  addons?: AddonAssignmentInput[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface CreateAddonInput {
  name: string;
  unitPrice: string;
  isActive: boolean;
}

export type UpdateAddonInput = Partial<CreateAddonInput>;

const unwrap = <T>(response: { data: ApiSuccessResponse<T> }) => response.data.data;

export const getProducts = async (query: CatalogListQuery = {}) =>
  unwrap(await apiClient.get<ApiSuccessResponse<PaginatedResponse<Product>>>("/api/products", { params: query }));
export const getProduct = async (id: number) =>
  unwrap(await apiClient.get<ApiSuccessResponse<Product>>(`/api/products/${id}`));
export const createProduct = async (input: CreateProductInput) =>
  unwrap(await apiClient.post<ApiSuccessResponse<Product>>("/api/products", input));
export const updateProduct = async (id: number, input: UpdateProductInput) =>
  unwrap(await apiClient.patch<ApiSuccessResponse<Product>>(`/api/products/${id}`, input));
export const deactivateProduct = async (id: number) =>
  unwrap(await apiClient.delete<ApiSuccessResponse<Product>>(`/api/products/${id}`));

export const getAddons = async (query: CatalogListQuery = {}) =>
  unwrap(await apiClient.get<ApiSuccessResponse<PaginatedResponse<Addon>>>("/api/addons", { params: query }));
export const getAddon = async (id: number) =>
  unwrap(await apiClient.get<ApiSuccessResponse<Addon>>(`/api/addons/${id}`));
export const createAddon = async (input: CreateAddonInput) =>
  unwrap(await apiClient.post<ApiSuccessResponse<Addon>>("/api/addons", input));
export const updateAddon = async (id: number, input: UpdateAddonInput) =>
  unwrap(await apiClient.patch<ApiSuccessResponse<Addon>>(`/api/addons/${id}`, input));
export const deactivateAddon = async (id: number) =>
  unwrap(await apiClient.delete<ApiSuccessResponse<Addon>>(`/api/addons/${id}`));

interface PresignedProductImage {
  file: StoredFileUpload;
  upload: PresignedPost;
}

export const uploadProductImage = async (
  file: File,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
) => {
  const presigned = unwrap(await apiClient.post<ApiSuccessResponse<PresignedProductImage>>(
    "/api/products/images/presign",
    { fileName: file.name, mimeType: file.type, sizeBytes: file.size, purpose: "PRODUCT" },
    { signal },
  ));
  await uploadToS3(presigned.upload, file, onProgress, signal);
  return unwrap(await apiClient.post<ApiSuccessResponse<StoredFileUpload>>(
    `/api/products/images/${presigned.file.id}/complete`, undefined, { signal },
  ));
};

export const attachProductImage = async (productId: number, fileId: string) =>
  unwrap(await apiClient.put<ApiSuccessResponse<unknown>>(`/api/products/${productId}/image`, { fileId }));
export const removeProductImage = async (productId: number) =>
  unwrap(await apiClient.delete<ApiSuccessResponse<unknown>>(`/api/products/${productId}/image`));
export const getProductImageAccess = async (productId: number, client: AxiosInstance = apiClient) =>
  unwrap(await client.get<ApiSuccessResponse<{ url: string; expiresAt: string }>>(
    `/api/products/${productId}/image/access-url`,
  ));
