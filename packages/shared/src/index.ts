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

export interface BranchSummary {
  id: number;
  branchCode: string | null;
  name: string;
  isActive: boolean;
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