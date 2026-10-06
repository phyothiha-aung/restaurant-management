import type {
  ApiSuccessResponse,
  DiningTable,
  DiningTableStatus,
} from "@restaurant-management/shared";
import apiClient from "../../lib/api-client";

export interface DiningTableListQuery {
  search?: string;
  status?: DiningTableStatus;
}

export interface CreateDiningTableInput {
  name: string;
  capacity?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateDiningTableInput = Partial<CreateDiningTableInput>;

const unwrap = <T>(response: { data: ApiSuccessResponse<T> }) =>
  response.data.data;

export const getDiningTables = async (query: DiningTableListQuery = {}) =>
  unwrap(
    await apiClient.get<ApiSuccessResponse<DiningTable[]>>(
      "/api/tables",
      { params: query },
    ),
  );

export const getDiningTable = async (id: number) =>
  unwrap(
    await apiClient.get<ApiSuccessResponse<DiningTable>>(`/api/tables/${id}`),
  );

export const createDiningTable = async (input: CreateDiningTableInput) =>
  unwrap(
    await apiClient.post<ApiSuccessResponse<DiningTable>>("/api/tables", input),
  );

export const updateDiningTable = async (
  id: number,
  input: UpdateDiningTableInput,
) =>
  unwrap(
    await apiClient.patch<ApiSuccessResponse<DiningTable>>(
      `/api/tables/${id}`,
      input,
    ),
  );

export const deactivateDiningTable = async (id: number) =>
  unwrap(
    await apiClient.delete<ApiSuccessResponse<DiningTable>>(`/api/tables/${id}`),
  );
