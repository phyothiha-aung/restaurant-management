import type {
  ApiSuccessResponse,
  PaginatedResponse,
  ProductCategory,
} from "@restaurant-management/shared";
import type { AxiosInstance } from "axios";
import apiClient from "../../lib/api-client";

export interface ProductCategoryListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateProductCategoryInput {
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

type AtLeastOne<T> = {
  [Key in keyof T]-?: Required<Pick<T, Key>> & Partial<Omit<T, Key>>;
}[keyof T];

export type UpdateProductCategoryInput = AtLeastOne<CreateProductCategoryInput>;

export const getProductCategories = async (
  query: ProductCategoryListQuery = {},
  client: AxiosInstance = apiClient,
) => {
  const response = await client.get<
    ApiSuccessResponse<PaginatedResponse<ProductCategory>>
  >("/api/product-categories", { params: query });
  return response.data.data;
};

export const getProductCategory = async (
  id: number,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.get<ApiSuccessResponse<ProductCategory>>(
    `/api/product-categories/${id}`,
  );
  return response.data.data;
};

export const createProductCategory = async (
  input: CreateProductCategoryInput,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.post<ApiSuccessResponse<ProductCategory>>(
    "/api/product-categories",
    input,
  );
  return response.data.data;
};

export const updateProductCategory = async (
  id: number,
  input: UpdateProductCategoryInput,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.patch<ApiSuccessResponse<ProductCategory>>(
    `/api/product-categories/${id}`,
    input,
  );
  return response.data.data;
};

export const deactivateProductCategory = async (
  id: number,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.delete<ApiSuccessResponse<ProductCategory>>(
    `/api/product-categories/${id}`,
  );
  return response.data.data;
};
