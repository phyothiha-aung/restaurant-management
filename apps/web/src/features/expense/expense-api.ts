import type {
  ApiSuccessResponse,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  PaginatedResponse,
} from "@restaurant-management/shared";
import type { AxiosInstance } from "axios";

import apiClient from "../../lib/api-client";

export interface ExpenseListQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  branchId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateExpenseInput {
  title: string;
  description?: string | null;
  category: ExpenseCategory;
  amount: string;
  expenseDate: string;
  branchId?: number | null;
}

type AtLeastOne<T> = {
  [Key in keyof T]-?: Required<Pick<T, Key>> & Partial<Omit<T, Key>>;
}[keyof T];

export type UpdateExpenseInput = AtLeastOne<CreateExpenseInput>;

export const getExpenses = async (
  query: ExpenseListQuery = {},
  client: AxiosInstance = apiClient,
) => {
  const response = await client.get<
    ApiSuccessResponse<PaginatedResponse<Expense>>
  >("/api/expenses", { params: query });
  return response.data.data;
};

export const getExpense = async (
  id: number,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.get<ApiSuccessResponse<Expense>>(
    `/api/expenses/${id}`,
  );
  return response.data.data;
};

export const createExpense = async (
  input: CreateExpenseInput,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.post<ApiSuccessResponse<Expense>>(
    "/api/expenses",
    input,
  );
  return response.data.data;
};

export const updateExpense = async (
  id: number,
  input: UpdateExpenseInput,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.patch<ApiSuccessResponse<Expense>>(
    `/api/expenses/${id}`,
    input,
  );
  return response.data.data;
};

export const voidExpense = async (
  id: number,
  reason: string,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.delete<ApiSuccessResponse<Expense>>(
    `/api/expenses/${id}`,
    { data: { reason } },
  );
  return response.data.data;
};
