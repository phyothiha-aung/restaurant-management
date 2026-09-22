import type {
  ApiSuccessResponse,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  PaginatedResponse,
  ExpenseAttachment,
  StoredFilePurpose,
  StoredFileUpload,
} from "@restaurant-management/shared";
import type { AxiosInstance } from "axios";
import axios from "axios";

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
  attachmentIds?: string[];
}

type AtLeastOne<T> = {
  [Key in keyof T]-?: Required<Pick<T, Key>> & Partial<Omit<T, Key>>;
}[keyof T];

export type UpdateExpenseInput = AtLeastOne<Omit<CreateExpenseInput, "attachmentIds">>;

export interface PresignAttachmentInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  purpose: StoredFilePurpose;
}

interface PresignedUpload {
  file: StoredFileUpload;
  upload: {
    url: string;
    fields: Record<string, string>;
    expiresAt: string;
  };
}

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

export const presignExpenseAttachment = async (
  input: PresignAttachmentInput,
  signal?: AbortSignal,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.post<ApiSuccessResponse<PresignedUpload>>(
    "/api/expenses/attachments/presign",
    input,
    { signal },
  );
  return response.data.data;
};

export const uploadToS3 = async (
  upload: PresignedUpload["upload"],
  file: File,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
) => {
  const body = new FormData();
  Object.entries(upload.fields).forEach(([key, value]) => body.append(key, value));
  body.append("file", file);
  await axios.post(upload.url, body, {
    signal,
    onUploadProgress: (event) => {
      if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
};

export const completeExpenseAttachment = async (
  fileId: string,
  signal?: AbortSignal,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.post<ApiSuccessResponse<StoredFileUpload>>(
    `/api/expenses/attachments/${fileId}/complete`,
    undefined,
    { signal },
  );
  return response.data.data;
};

export const uploadExpenseAttachment = async (
  file: File,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
) => {
  const presigned = await presignExpenseAttachment({
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    purpose: "EXPENSE",
  }, signal);
  await uploadToS3(presigned.upload, file, onProgress, signal);
  return completeExpenseAttachment(presigned.file.id, signal);
};

export const attachExpenseFiles = async (
  expenseId: number,
  attachmentIds: string[],
  client: AxiosInstance = apiClient,
) => {
  const response = await client.post<ApiSuccessResponse<ExpenseAttachment[]>>(
    `/api/expenses/${expenseId}/attachments`,
    { attachmentIds },
  );
  return response.data.data;
};

export const getExpenseAttachmentAccessUrl = async (
  expenseId: number,
  attachmentId: number,
  client: AxiosInstance = apiClient,
) => {
  const response = await client.get<
    ApiSuccessResponse<{ url: string; expiresAt: string }>
  >(`/api/expenses/${expenseId}/attachments/${attachmentId}/access-url`);
  return response.data.data;
};
