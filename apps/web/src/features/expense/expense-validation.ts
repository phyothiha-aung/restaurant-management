import { z } from "zod";
import { EXPENSE_CATEGORIES } from "./expense-options";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/;

export const isValidExpenseDate = (value: string) => {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

export const ExpenseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must contain at least 2 characters")
    .max(100, "Title must contain 100 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must contain 1,000 characters or fewer"),
  category: z.string().superRefine((value, context) => {
    if (!EXPENSE_CATEGORIES.includes(value as (typeof EXPENSE_CATEGORIES)[number])) {
      context.addIssue({
        code: "custom",
        message: "Select an expense category",
      });
    }
  }),
  amount: z
    .string()
    .trim()
    .regex(
      AMOUNT_PATTERN,
      "Enter a positive amount with up to 12 digits and 2 decimal places",
    )
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  expenseDate: z
    .string()
    .refine(isValidExpenseDate, "Enter a valid expense date"),
  branchId: z.string(),
});

export const VoidExpenseSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Reason must contain at least 3 characters")
    .max(300, "Reason must contain 300 characters or fewer"),
});

export type ExpenseFormValues = z.infer<typeof ExpenseFormSchema>;
export type VoidExpenseFormValues = z.infer<typeof VoidExpenseSchema>;
