import type {
  ApiErrorResponse,
  Expense,
  PaginatedResponse,
} from "@restaurant-management/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "../../lib/api-error";
import {
  createExpense,
  getExpense,
  getExpenses,
  updateExpense,
  voidExpense,
  type CreateExpenseInput,
  type ExpenseListQuery,
  type UpdateExpenseInput,
} from "./expense-api";

export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  list: (query: ExpenseListQuery) => [...expenseKeys.lists(), query] as const,
  details: () => [...expenseKeys.all, "detail"] as const,
  detail: (id: number) => [...expenseKeys.details(), id] as const,
};

export const useExpenses = (query: ExpenseListQuery = {}) =>
  useQuery<PaginatedResponse<Expense>, AxiosError<ApiErrorResponse>>({
    queryKey: expenseKeys.list(query),
    queryFn: () => getExpenses(query),
  });

export const useExpense = (id: number | null) =>
  useQuery<Expense, AxiosError<ApiErrorResponse>>({
    queryKey: expenseKeys.detail(id ?? 0),
    queryFn: () => getExpense(id as number),
    enabled: id !== null && id > 0,
  });

interface ExpenseMutationOptions {
  onSuccess?: (expense: Expense) => void;
}

export const useCreateExpense = (options: ExpenseMutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<Expense, AxiosError<ApiErrorResponse>, CreateExpenseInput>({
    mutationFn: (input) => createExpense(input),
    onSuccess: async (expense) => {
      await queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.setQueryData(expenseKeys.detail(expense.id), expense);
      toast.success("Expense created successfully.");
      options.onSuccess?.(expense);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not create expense.")),
  });
};

interface UpdateExpenseVariables {
  id: number;
  input: UpdateExpenseInput;
}

export const useUpdateExpense = (options: ExpenseMutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<Expense, AxiosError<ApiErrorResponse>, UpdateExpenseVariables>({
    mutationFn: ({ id, input }) => updateExpense(id, input),
    onSuccess: async (expense) => {
      queryClient.setQueryData(expenseKeys.detail(expense.id), expense);
      await queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      toast.success("Expense updated successfully.");
      options.onSuccess?.(expense);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not update expense.")),
  });
};

interface VoidExpenseVariables {
  id: number;
  reason: string;
}

export const useVoidExpense = (options: ExpenseMutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<Expense, AxiosError<ApiErrorResponse>, VoidExpenseVariables>({
    mutationFn: ({ id, reason }) => voidExpense(id, reason),
    onSuccess: async (expense) => {
      queryClient.setQueryData(expenseKeys.detail(expense.id), expense);
      await queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      toast.success("Expense voided successfully.");
      options.onSuccess?.(expense);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not void expense.")),
  });
};
