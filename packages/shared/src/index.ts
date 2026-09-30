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

export type ExpenseCategory =
  | "INGREDIENTS"
  | "UTILITIES"
  | "RENT"
  | "WAGES"
  | "MAINTENANCE"
  | "SUPPLIES"
  | "TRANSPORT"
  | "MARKETING"
  | "TAXES_AND_FEES"
  | "OTHER";

export type ExpenseStatus = "ACTIVE" | "VOIDED";
export type StoredFilePurpose = "EXPENSE" | "RECIPE" | "PRODUCT";
export type StoredFileStatus = "PENDING" | "READY" | "REJECTED";

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
  userCount: number;
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

export interface ExpenseUserSummary {
  id: number;
  name: string;
}

export interface ExpenseAttachment {
  id: number;
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  attachedBy: ExpenseUserSummary;
}

export interface StoredFileUpload {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: StoredFileStatus;
  expiresAt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: number;
  name: string;
  price: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductAddon {
  id: number;
  name: string;
  unitPrice: string;
  isActive: boolean;
  maxQuantity: number;
  sortOrder: number;
}

export interface ProductImage {
  id: number;
  fileId: string;
  createdAt: string;
  file: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    status: StoredFileStatus;
  };
}

export interface Product {
  id: number;
  categoryId: number;
  code: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: Pick<ProductCategory, "id" | "name" | "isActive">;
  variants: ProductVariant[];
  addons: ProductAddon[];
  image: ProductImage | null;
}

export interface Addon {
  id: number;
  name: string;
  unitPrice: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  branchId: number | null;
  createdById: number;
  updatedById: number;
  voidedById: number | null;
  title: string;
  description: string | null;
  category: ExpenseCategory;
  amount: string;
  expenseDate: string;
  status: ExpenseStatus;
  voidReason: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  branch: BranchSummary | null;
  createdBy: ExpenseUserSummary;
  updatedBy: ExpenseUserSummary;
  voidedBy: ExpenseUserSummary | null;
  attachmentCount: number;
  attachments: ExpenseAttachment[];
}
