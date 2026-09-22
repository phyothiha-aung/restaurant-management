import type {
  ExpenseCategory,
  ExpenseStatus,
} from "@restaurant-management/shared";

export const EXPENSE_CATEGORIES = [
  "INGREDIENTS",
  "UTILITIES",
  "RENT",
  "WAGES",
  "MAINTENANCE",
  "SUPPLIES",
  "TRANSPORT",
  "MARKETING",
  "TAXES_AND_FEES",
  "OTHER",
] as const satisfies readonly ExpenseCategory[];

export const EXPENSE_STATUSES = [
  "ACTIVE",
  "VOIDED",
] as const satisfies readonly ExpenseStatus[];

export const isExpenseCategory = (
  value: string | null,
): value is ExpenseCategory =>
  value !== null && EXPENSE_CATEGORIES.includes(value as ExpenseCategory);

export const isExpenseStatus = (
  value: string | null,
): value is ExpenseStatus =>
  value !== null && EXPENSE_STATUSES.includes(value as ExpenseStatus);

export const formatExpenseCategory = (category: ExpenseCategory) =>
  category
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const formatExpenseAmount = (amount: string) =>
  `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount))} MMK`;
