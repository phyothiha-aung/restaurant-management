import type {
  ApiErrorResponse,
  DiningTable,
} from "@restaurant-management/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../lib/api-error";
import {
  createDiningTable,
  deactivateDiningTable,
  getDiningTable,
  getDiningTables,
  updateDiningTable,
  type CreateDiningTableInput,
  type DiningTableListQuery,
  type UpdateDiningTableInput,
} from "./dining-table-api";

export const diningTableKeys = {
  all: ["dining-tables"] as const,
  lists: () => [...diningTableKeys.all, "list"] as const,
  list: (query: DiningTableListQuery) =>
    [...diningTableKeys.lists(), query] as const,
  details: () => [...diningTableKeys.all, "detail"] as const,
  detail: (id: number) => [...diningTableKeys.details(), id] as const,
};

export const useDiningTables = (query: DiningTableListQuery = {}) =>
  useQuery<DiningTable[], AxiosError<ApiErrorResponse>>({
    queryKey: diningTableKeys.list(query),
    queryFn: () => getDiningTables(query),
  });

export const useDiningTable = (id: number | null) =>
  useQuery<DiningTable, AxiosError<ApiErrorResponse>>({
    queryKey: diningTableKeys.detail(id ?? 0),
    queryFn: () => getDiningTable(id as number),
    enabled: id !== null && id > 0,
  });

interface MutationOptions {
  onSuccess?: (table: DiningTable) => void;
}

const store = async (
  queryClient: ReturnType<typeof useQueryClient>,
  table: DiningTable,
) => {
  queryClient.setQueryData(diningTableKeys.detail(table.id), table);
  await queryClient.invalidateQueries({ queryKey: diningTableKeys.lists() });
};

export const useCreateDiningTable = (options: MutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<
    DiningTable,
    AxiosError<ApiErrorResponse>,
    CreateDiningTableInput
  >({
    mutationFn: createDiningTable,
    onSuccess: async (table) => {
      await store(queryClient, table);
      toast.success("Table created successfully.");
      options.onSuccess?.(table);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not create the table.")),
  });
};

export const useUpdateDiningTable = (options: MutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<
    DiningTable,
    AxiosError<ApiErrorResponse>,
    { id: number; input: UpdateDiningTableInput }
  >({
    mutationFn: ({ id, input }) => updateDiningTable(id, input),
    onSuccess: async (table) => {
      await store(queryClient, table);
      toast.success("Table updated successfully.");
      options.onSuccess?.(table);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not update the table.")),
  });
};

export const useDeactivateDiningTable = (options: MutationOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<DiningTable, AxiosError<ApiErrorResponse>, number>({
    mutationFn: deactivateDiningTable,
    onSuccess: async (table) => {
      await store(queryClient, table);
      toast.success("Table deactivated.");
      options.onSuccess?.(table);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not deactivate the table.")),
  });
};
