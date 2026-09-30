import type { Addon, ApiErrorResponse, PaginatedResponse, Product } from "@restaurant-management/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../lib/api-error";
import {
  attachProductImage,
  createAddon,
  createProduct,
  deactivateAddon,
  deactivateProduct,
  getAddon,
  getAddons,
  getProduct,
  getProductImageAccess,
  getProducts,
  removeProductImage,
  updateAddon,
  updateProduct,
  type CatalogListQuery,
  type CreateAddonInput,
  type CreateProductInput,
  type UpdateAddonInput,
  type UpdateProductInput,
} from "./catalog-api";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (query: CatalogListQuery) => [...productKeys.lists(), query] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  image: (id: number) => [...productKeys.detail(id), "image"] as const,
};
export const addonKeys = {
  all: ["addons"] as const,
  lists: () => [...addonKeys.all, "list"] as const,
  list: (query: CatalogListQuery) => [...addonKeys.lists(), query] as const,
  details: () => [...addonKeys.all, "detail"] as const,
  detail: (id: number) => [...addonKeys.details(), id] as const,
};

export const useProducts = (query: CatalogListQuery) =>
  useQuery<PaginatedResponse<Product>, AxiosError<ApiErrorResponse>>({ queryKey: productKeys.list(query), queryFn: () => getProducts(query) });
export const useProduct = (id: number | null) =>
  useQuery<Product, AxiosError<ApiErrorResponse>>({ queryKey: productKeys.detail(id ?? 0), queryFn: () => getProduct(id as number), enabled: Boolean(id) });
export const useProductImageAccess = (id: number | null, enabled: boolean) =>
  useQuery<{ url: string; expiresAt: string }, AxiosError<ApiErrorResponse>>({ queryKey: productKeys.image(id ?? 0), queryFn: () => getProductImageAccess(id as number), enabled: Boolean(id) && enabled, staleTime: 4 * 60 * 1000 });
export const useAddons = (query: CatalogListQuery) =>
  useQuery<PaginatedResponse<Addon>, AxiosError<ApiErrorResponse>>({ queryKey: addonKeys.list(query), queryFn: () => getAddons(query) });
export const useAddon = (id: number | null) =>
  useQuery<Addon, AxiosError<ApiErrorResponse>>({ queryKey: addonKeys.detail(id ?? 0), queryFn: () => getAddon(id as number), enabled: Boolean(id) });

interface Options<T> { onSuccess?: (value: T) => void }
const productSuccess = async (queryClient: ReturnType<typeof useQueryClient>, product: Product) => {
  queryClient.setQueryData(productKeys.detail(product.id), product);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: addonKeys.lists() }),
  ]);
};

export const useCreateProduct = (options: Options<Product> = {}) => {
  const qc = useQueryClient();
  return useMutation<Product, AxiosError<ApiErrorResponse>, CreateProductInput>({
    mutationFn: createProduct,
    onSuccess: async (value) => { await productSuccess(qc, value); toast.success("Product created successfully."); options.onSuccess?.(value); },
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not create product.")),
  });
};
export const useUpdateProduct = (options: Options<Product> = {}) => {
  const qc = useQueryClient();
  return useMutation<Product, AxiosError<ApiErrorResponse>, { id: number; input: UpdateProductInput }>({
    mutationFn: ({ id, input }) => updateProduct(id, input),
    onSuccess: async (value) => { await productSuccess(qc, value); toast.success("Product updated successfully."); options.onSuccess?.(value); },
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not update product.")),
  });
};
export const useDeactivateProduct = (options: Options<Product> = {}) => {
  const qc = useQueryClient();
  return useMutation<Product, AxiosError<ApiErrorResponse>, number>({
    mutationFn: deactivateProduct,
    onSuccess: async (value) => { await productSuccess(qc, value); toast.success("Product deactivated."); options.onSuccess?.(value); },
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not deactivate product.")),
  });
};

const addonSuccess = async (queryClient: ReturnType<typeof useQueryClient>, addon: Addon) => {
  queryClient.setQueryData(addonKeys.detail(addon.id), addon);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: addonKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: productKeys.all }),
  ]);
};
export const useCreateAddon = (options: Options<Addon> = {}) => {
  const qc = useQueryClient();
  return useMutation<Addon, AxiosError<ApiErrorResponse>, CreateAddonInput>({
    mutationFn: createAddon,
    onSuccess: async (value) => { await addonSuccess(qc, value); toast.success("Add-on created successfully."); options.onSuccess?.(value); },
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not create add-on.")),
  });
};
export const useUpdateAddon = (options: Options<Addon> = {}) => {
  const qc = useQueryClient();
  return useMutation<Addon, AxiosError<ApiErrorResponse>, { id: number; input: UpdateAddonInput }>({
    mutationFn: ({ id, input }) => updateAddon(id, input),
    onSuccess: async (value) => { await addonSuccess(qc, value); toast.success("Add-on updated successfully."); options.onSuccess?.(value); },
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not update add-on.")),
  });
};
export const useDeactivateAddon = (options: Options<Addon> = {}) => {
  const qc = useQueryClient();
  return useMutation<Addon, AxiosError<ApiErrorResponse>, number>({
    mutationFn: deactivateAddon,
    onSuccess: async (value) => { await addonSuccess(qc, value); toast.success("Add-on deactivated."); options.onSuccess?.(value); },
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not deactivate add-on.")),
  });
};

export const useProductImageMutation = () => {
  const qc = useQueryClient();
  return useMutation<unknown, AxiosError<ApiErrorResponse>, { productId: number; fileId?: string; remove?: boolean }>({
    mutationFn: ({ productId, fileId, remove }) => remove ? removeProductImage(productId) : attachProductImage(productId, fileId as string),
    onSuccess: async (_value, variables) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: productKeys.detail(variables.productId) }),
        qc.invalidateQueries({ queryKey: productKeys.lists() }),
        qc.invalidateQueries({ queryKey: productKeys.image(variables.productId) }),
      ]);
    },
  });
};
