import type {
  ApiSuccessResponse,
  DiscountType,
  MenuProduct,
  Order,
  OrderStatus,
  OrderType,
  OrderSummary,
  PaginatedResponse,
} from "@restaurant-management/shared";
import apiClient from "../../lib/api-client";

export interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  orderType?: OrderType;
  tableId?: number;
  createdById?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface OrderAddonInput {
  addonId: number;
  quantity: number;
}

export interface OrderItemInput {
  id?: number;
  productVariantId: number;
  quantity: number;
  addons: OrderAddonInput[];
}

export interface OrderDiscountInput {
  type: DiscountType;
  value: string;
}

export interface CreateOrderInput {
  orderType: OrderType;
  tableId?: number | null;
  items: Omit<OrderItemInput, "id">[];
  discount?: OrderDiscountInput | null;
  taxPercent?: string;
}

export interface UpdateOrderInput {
  orderType?: OrderType;
  tableId?: number | null;
  items?: OrderItemInput[];
  discount?: OrderDiscountInput | null;
  taxPercent?: string;
}

const unwrap = <T>(response: { data: ApiSuccessResponse<T> }) =>
  response.data.data;

export const getOrders = async (query: OrderListQuery = {}) =>
  unwrap(
    await apiClient.get<ApiSuccessResponse<PaginatedResponse<OrderSummary>>>(
      "/api/orders",
      { params: query },
    ),
  );

export const getOrder = async (id: number) =>
  unwrap(
    await apiClient.get<ApiSuccessResponse<Order>>(`/api/orders/${id}`),
  );

export const createOrder = async (input: CreateOrderInput) =>
  unwrap(
    await apiClient.post<ApiSuccessResponse<Order>>("/api/orders", input),
  );

export const updateOrder = async (id: number, input: UpdateOrderInput) =>
  unwrap(
    await apiClient.patch<ApiSuccessResponse<Order>>(
      `/api/orders/${id}`,
      input,
    ),
  );

export const completeOrder = async (id: number) =>
  unwrap(
    await apiClient.post<ApiSuccessResponse<Order>>(
      `/api/orders/${id}/complete`,
    ),
  );

export const cancelOrder = async (id: number) =>
  unwrap(
    await apiClient.delete<ApiSuccessResponse<Order>>(`/api/orders/${id}`),
  );

export const getOrderMenu = async () =>
  unwrap(
    await apiClient.get<ApiSuccessResponse<MenuProduct[]>>("/api/products/menu"),
  );
