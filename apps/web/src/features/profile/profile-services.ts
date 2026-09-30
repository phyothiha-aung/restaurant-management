import type { ApiErrorResponse, User } from "@restaurant-management/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../lib/api-error";
import { useAuthStore } from "../../store/useAuthStore";
import {
  getMyProfile,
  updateMyProfile,
  type UpdateProfileInput,
} from "./profile-api";

export const profileKey = ["profile", "me"] as const;

export const useProfile = () =>
  useQuery<User, AxiosError<ApiErrorResponse>>({
    queryKey: profileKey,
    queryFn: () => getMyProfile(),
  });

interface ProfileMutationOptions {
  onSuccess?: (user: User) => void;
}

export const useUpdateProfile = (options: ProfileMutationOptions = {}) => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);

  return useMutation<
    User,
    AxiosError<ApiErrorResponse>,
    UpdateProfileInput
  >({
    mutationFn: (input) => updateMyProfile(input),
    onSuccess: (user, input) => {
      queryClient.setQueryData(profileKey, user);
      setAuth(user, token);
      toast.success(
        input.password
          ? "Profile and password updated successfully."
          : "Profile updated successfully.",
      );
      options.onSuccess?.(user);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not update your profile.")),
  });
};
