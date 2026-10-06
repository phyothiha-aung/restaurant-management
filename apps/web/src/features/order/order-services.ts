import type {
  ApiErrorResponse,
  MenuProduct,
  Order,
  OrderSummary,
  PaginatedResponse,
} from "@restaurant-management/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../lib/api-error";
import { diningTableKeys } from "../dining-table/dining-table-services";
import {
  cancelOrder,
  completeOrder,
  createOrder,
  getOrder,
  getOrderMenu,
  getOrders,
  updateOrder,
  type CreateOrderInput,
  type OrderListQuery,
  type UpdateOrderInput,
} from "./order-api";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (query: OrderListQuery) => [...orderKeys.lists(), query] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
  menu: ["order-menu"] as const,
};

export const useOrders = (query: OrderListQuery = {}) =>
  useQuery<PaginatedResponse<OrderSummary>, AxiosError<ApiErrorResponse>>({
    queryKey: orderKeys.list(query),
    queryFn: () => getOrders(query),
  });

export const useOrder = (id: number | null) =>
  useQuery<Order, AxiosError<ApiErrorResponse>>({
    queryKey: orderKeys.detail(id ?? 0),
    queryFn: () => getOrder(id as number),
    enabled: id !== null && id > 0,
  });

export const useOrderMenu = () =>
  useQuery<MenuProduct[], AxiosError<ApiErrorResponse>>({
    queryKey: orderKeys.menu,
    queryFn: getOrderMenu,
    staleTime: 60_000,
  });

interface OrderMutationOptions {
  onSuccess?: (order: Order) => void;
}

const storeOrder = async (
  queryClient: ReturnType<typeof useQueryClient>,
  order: Order,
) => {
  queryClient.setQueryData(orderKeys.detail(order.id), order);
  await queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
  await queryClient.invalidateQueries({ queryKey: diningTableKeys.all });
};

export const useCreateOrder = (options: OrderMutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<Order, AxiosError<ApiErrorResponse>, CreateOrderInput>({
    mutationFn: createOrder,
    onSuccess: async (order) => {
      await storeOrder(queryClient, order);
      toast.success("Order saved successfully.");
      options.onSuccess?.(order);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not save the order.")),
  });
};

export const useUpdateOrder = (options: OrderMutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<
    Order,
    AxiosError<ApiErrorResponse>,
    { id: number; input: UpdateOrderInput }
  >({
    mutationFn: ({ id, input }) => updateOrder(id, input),
    onSuccess: async (order) => {
      await storeOrder(queryClient, order);
      toast.success("Order updated successfully.");
      options.onSuccess?.(order);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not update the order.")),
  });
};

export const useCompleteOrder = (options: OrderMutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<Order, AxiosError<ApiErrorResponse>, number>({
    mutationFn: completeOrder,
    onSuccess: async (order) => {
      await storeOrder(queryClient, order);
      toast.success("Order completed.");
      options.onSuccess?.(order);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not complete the order.")),
  });
};

export const useCancelOrder = (options: OrderMutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<Order, AxiosError<ApiErrorResponse>, number>({
    mutationFn: cancelOrder,
    onSuccess: async (order) => {
      await storeOrder(queryClient, order);
      toast.success("Order cancelled.");
      options.onSuccess?.(order);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not cancel the order.")),
  });
};
