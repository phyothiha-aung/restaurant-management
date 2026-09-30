import type {
  ApiSuccessResponse,
  PaginatedResponse,
  User,
  UserRole,
  UserStatus,
} from "@restaurant-management/shared";
import type { AxiosInstance } from "axios";
import apiClient from "../../lib/api-client";

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  branchId?: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  branchId?: number | null;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export const getUsers = async (
  query: UserListQuery = {},
  client: AxiosInstance = apiClient,
) => {
  const response = await client.get<
    ApiSuccessResponse<PaginatedResponse<User>>
  >("/api/users", { params: query });
  return response.data.data;
};

export const getUser = async (
  id: number,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.get<ApiSuccessResponse<User>>(
    `/api/users/${id}`,
  );
  return response.data.data;
};

export const createUser = async (
  input: CreateUserInput,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.post<ApiSuccessResponse<User>>(
    "/api/users",
    input,
  );
  return response.data.data;
};

export const updateUser = async (
  id: number,
  input: UpdateUserInput,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.patch<ApiSuccessResponse<User>>(
    `/api/users/${id}`,
    input,
  );
  return response.data.data;
};

export const deactivateUser = async (
  id: number,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.delete<ApiSuccessResponse<User>>(
    `/api/users/${id}`,
  );
  return response.data.data;
};
