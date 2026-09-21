export type UserRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "OWNER"
  | "MANAGER"
  | "BRANCH_MANAGER"
  | "WAITER"
  | "CHEF"
  | "CASHIER";

export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string | string[];
  error: unknown | null;
  statusCode: number;
}

export interface BranchSummary {
  id: number;
  branchCode: string | null;
  name: string;
  isActive: boolean;
}

export interface Branch extends BranchSummary {
  address: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export interface PaginationLinks {
  first: string;
  last: string;
  current: string;
  previous: string | null;
  next: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface User {
  id: number;
  branchId: number | null;
  name: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  branch: BranchSummary | null;
}
