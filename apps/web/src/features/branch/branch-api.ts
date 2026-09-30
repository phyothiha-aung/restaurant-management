import type {
  ApiSuccessResponse,
  Branch,
  PaginatedResponse,
} from "@restaurant-management/shared";
import type { AxiosInstance } from "axios";

import apiClient from "../../lib/api-client";

export interface BranchListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateBranchInput {
  branchCode?: string | null;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

type AtLeastOne<T> = {
  [Key in keyof T]-?: Required<Pick<T, Key>> & Partial<Omit<T, Key>>;
}[keyof T];

export type UpdateBranchInput = AtLeastOne<CreateBranchInput>;

export const getBranches = async (
  query: BranchListQuery = {},
  client: AxiosInstance = apiClient,
) => {
  const response = await client.get<
    ApiSuccessResponse<PaginatedResponse<Branch>>
  >("/api/branches", { params: query });

  return response.data.data;
};

export const getBranch = async (
  id: number,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.get<ApiSuccessResponse<Branch>>(
    `/api/branches/${id}`,
  );

  return response.data.data;
};

export const createBranch = async (
  input: CreateBranchInput,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.post<ApiSuccessResponse<Branch>>(
    "/api/branches",
    input,
  );

  return response.data.data;
};

export const updateBranch = async (
  id: number,
  input: UpdateBranchInput,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.patch<ApiSuccessResponse<Branch>>(
    `/api/branches/${id}`,
    input,
  );

  return response.data.data;
};

export const deactivateBranch = async (
  id: number,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.delete<ApiSuccessResponse<Branch>>(
    `/api/branches/${id}`,
  );

  return response.data.data;
};
