import type {
  ApiErrorResponse,
  PaginatedResponse,
  User,
} from "@restaurant-management/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../lib/api-error";
import {
  createUser,
  deactivateUser,
  getUser,
  getUsers,
  updateUser,
  type CreateUserInput,
  type UpdateUserInput,
  type UserListQuery,
} from "./user-api";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (query: UserListQuery) => [...userKeys.lists(), query] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

export const useUsers = (query: UserListQuery = {}) =>
  useQuery<PaginatedResponse<User>, AxiosError<ApiErrorResponse>>({
    queryKey: userKeys.list(query),
    queryFn: () => getUsers(query),
  });

export const useUser = (id: number | null) =>
  useQuery<User, AxiosError<ApiErrorResponse>>({
    queryKey: userKeys.detail(id ?? 0),
    queryFn: () => getUser(id as number),
    enabled: id !== null && id > 0,
  });

interface UserMutationOptions {
  onSuccess?: (user: User) => void;
}

export const useCreateUser = (options: UserMutationOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation<User, AxiosError<ApiErrorResponse>, CreateUserInput>({
    mutationFn: (input) => createUser(input),
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.setQueryData(userKeys.detail(user.id), user);
      toast.success("User created successfully.");
      options.onSuccess?.(user);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not create user.")),
  });
};

interface UpdateUserVariables {
  id: number;
  input: UpdateUserInput;
}

export const useUpdateUser = (options: UserMutationOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation<User, AxiosError<ApiErrorResponse>, UpdateUserVariables>({
    mutationFn: ({ id, input }) => updateUser(id, input),
    onSuccess: async (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User updated successfully.");
      options.onSuccess?.(user);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not update user.")),
  });
};

export const useDeactivateUser = (options: UserMutationOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation<User, AxiosError<ApiErrorResponse>, number>({
    mutationFn: (id) => deactivateUser(id),
    onSuccess: async (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User deactivated successfully.");
      options.onSuccess?.(user);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not deactivate user.")),
  });
};
