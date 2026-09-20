import axios from "axios";

import type { ApiErrorResponse } from "../types/error-response";

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) => {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }

  if (error.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }

  if (!error.response) {
    return "Unable to reach the server. Please check your connection.";
  }

  return error.response.data?.message || fallback;
};
