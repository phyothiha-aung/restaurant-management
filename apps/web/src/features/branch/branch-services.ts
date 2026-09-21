import type {
  ApiErrorResponse,
  Branch,
  PaginatedResponse,
} from "@restaurant-management/shared";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "../../lib/api-error";
import {
  createBranch,
  deactivateBranch,
  getBranch,
  getBranches,
  updateBranch,
  type BranchListQuery,
  type CreateBranchInput,
  type UpdateBranchInput,
} from "./branch-api";

export const branchKeys = {
  all: ["branches"] as const,
  lists: () => [...branchKeys.all, "list"] as const,
  list: (query: BranchListQuery) => [...branchKeys.lists(), query] as const,
  details: () => [...branchKeys.all, "detail"] as const,
  detail: (id: number) => [...branchKeys.details(), id] as const,
};

export const useBranches = (query: BranchListQuery = {}) =>
  useQuery<PaginatedResponse<Branch>, AxiosError<ApiErrorResponse>>({
    queryKey: branchKeys.list(query),
    queryFn: () => getBranches(query),
  });

export const useBranch = (id: number | null) =>
  useQuery<Branch, AxiosError<ApiErrorResponse>>({
    queryKey: branchKeys.detail(id ?? 0),
    queryFn: () => getBranch(id as number),
    enabled: id !== null && id > 0,
  });

export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, AxiosError<ApiErrorResponse>, CreateBranchInput>({
    mutationFn: (input) => createBranch(input),
    onSuccess: async (branch) => {
      await queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      queryClient.setQueryData(branchKeys.detail(branch.id), branch);
      toast.success("Branch created successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not create branch."));
    },
  });
};

interface UpdateBranchVariables {
  id: number;
  input: UpdateBranchInput;
}

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, AxiosError<ApiErrorResponse>, UpdateBranchVariables>({
    mutationFn: ({ id, input }) => updateBranch(id, input),
    onSuccess: async (branch) => {
      queryClient.setQueryData(branchKeys.detail(branch.id), branch);
      await queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      toast.success("Branch updated successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update branch."));
    },
  });
};

export const useDeactivateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation<Branch, AxiosError<ApiErrorResponse>, number>({
    mutationFn: (id) => deactivateBranch(id),
    onSuccess: async (branch) => {
      queryClient.setQueryData(branchKeys.detail(branch.id), branch);
      await queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      toast.success("Branch deactivated successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not deactivate branch."));
    },
  });
};
