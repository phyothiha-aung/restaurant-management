export type UserRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "OWNER"
  | "MANAGER"
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
export type OrderStatus = "OPEN" | "COMPLETED" | "CANCELLED";
export type DiscountType = "FIXED_AMOUNT" | "PERCENT";
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
  name: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
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

export interface MenuProductVariant {
  id: number;
  name: string;
  price: string;
  sortOrder: number;
}

export interface MenuProductAddon {
  id: number;
  name: string;
  unitPrice: string;
  maxQuantity: number;
  sortOrder: number;
}

export interface MenuProduct {
  id: number;
  categoryId: number;
  code: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  category: Pick<ProductCategory, "id" | "name">;
  variants: MenuProductVariant[];
  addons: MenuProductAddon[];
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
  createdBy: ExpenseUserSummary;
  updatedBy: ExpenseUserSummary;
  voidedBy: ExpenseUserSummary | null;
  attachmentCount: number;
  attachments: ExpenseAttachment[];
}

export interface OrderUserSummary {
  id: number;
  name: string;
}

export interface OrderItemAddon {
  orderItemId: number;
  addonId: number;
  addonName: string;
  unitPrice: string;
  quantity: number;
  totalAmount: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productVariantId: number;
  productName: string;
  variantName: string;
  unitPrice: string;
  quantity: number;
  baseSubtotal: string;
  addonTotal: string;
  lineTotal: string;
  addons: OrderItemAddon[];
}

export interface OrderSummary {
  id: number;
  createdById: number;
  updatedById: number;
  status: OrderStatus;
  subtotal: string;
  discountType: DiscountType | null;
  discountValue: string;
  discountAmount: string;
  taxPercent: string;
  taxAmount: string;
  totalAmount: string;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: OrderUserSummary;
  updatedBy: OrderUserSummary;
  itemCount: number;
}

export interface Order extends OrderSummary {
  items: OrderItem[];
}
