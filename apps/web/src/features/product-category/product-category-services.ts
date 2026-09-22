import type {
  ApiErrorResponse,
  PaginatedResponse,
  ProductCategory,
} from "@restaurant-management/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../lib/api-error";
import {
  createProductCategory,
  deactivateProductCategory,
  getProductCategories,
  getProductCategory,
  updateProductCategory,
  type CreateProductCategoryInput,
  type ProductCategoryListQuery,
  type UpdateProductCategoryInput,
} from "./product-category-api";

export const productCategoryKeys = {
  all: ["product-categories"] as const,
  lists: () => [...productCategoryKeys.all, "list"] as const,
  list: (query: ProductCategoryListQuery) => [...productCategoryKeys.lists(), query] as const,
  details: () => [...productCategoryKeys.all, "detail"] as const,
  detail: (id: number) => [...productCategoryKeys.details(), id] as const,
};

export const useProductCategories = (query: ProductCategoryListQuery = {}) =>
  useQuery<PaginatedResponse<ProductCategory>, AxiosError<ApiErrorResponse>>({
    queryKey: productCategoryKeys.list(query),
    queryFn: () => getProductCategories(query),
  });

export const useProductCategory = (id: number | null) =>
  useQuery<ProductCategory, AxiosError<ApiErrorResponse>>({
    queryKey: productCategoryKeys.detail(id ?? 0),
    queryFn: () => getProductCategory(id as number),
    enabled: id !== null && id > 0,
  });

interface MutationOptions {
  onSuccess?: (category: ProductCategory) => void;
}

export const useCreateProductCategory = (options: MutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<ProductCategory, AxiosError<ApiErrorResponse>, CreateProductCategoryInput>({
    mutationFn: (input) => createProductCategory(input),
    onSuccess: async (category) => {
      await queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() });
      queryClient.setQueryData(productCategoryKeys.detail(category.id), category);
      toast.success("Product category created successfully.");
      options.onSuccess?.(category);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not create product category.")),
  });
};

interface UpdateVariables {
  id: number;
  input: UpdateProductCategoryInput;
}

export const useUpdateProductCategory = (options: MutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<ProductCategory, AxiosError<ApiErrorResponse>, UpdateVariables>({
    mutationFn: ({ id, input }) => updateProductCategory(id, input),
    onSuccess: async (category) => {
      queryClient.setQueryData(productCategoryKeys.detail(category.id), category);
      await queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() });
      toast.success("Product category updated successfully.");
      options.onSuccess?.(category);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not update product category.")),
  });
};

export const useDeactivateProductCategory = (options: MutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<ProductCategory, AxiosError<ApiErrorResponse>, number>({
    mutationFn: (id) => deactivateProductCategory(id),
    onSuccess: async (category) => {
      queryClient.setQueryData(productCategoryKeys.detail(category.id), category);
      await queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() });
      toast.success("Product category deactivated successfully.");
      options.onSuccess?.(category);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not deactivate product category.")),
  });
};
