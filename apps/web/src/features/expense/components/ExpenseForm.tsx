import { zodResolver } from "@hookform/resolvers/zod";
import type { Branch, Expense, User } from "@restaurant-management/shared";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import {
  InputField,
  SelectField,
  TextareaField,
} from "../../../components/ui/FormField";
import type { CreateExpenseInput } from "../expense-api";
import {
  EXPENSE_CATEGORIES,
  formatExpenseCategory,
  isExpenseCategory,
} from "../expense-options";
import {
  ExpenseFormSchema,
  type ExpenseFormValues,
} from "../expense-validation";

interface ExpenseFormProps {
  actor: User;
  branches: Branch[];
  branchesLoading: boolean;
  expense?: Expense;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateExpenseInput) => void;
}

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultValues = (expense?: Expense): ExpenseFormValues => ({
  title: expense?.title ?? "",
  description: expense?.description ?? "",
  category: expense?.category ?? "",
  amount: expense?.amount ?? "",
  expenseDate: expense?.expenseDate ?? today(),
  branchId: expense?.branchId?.toString() ?? "",
});

export function ExpenseForm({
  actor,
  branches,
  branchesLoading,
  expense,
  isLoading,
  onCancel,
  onSubmit,
}: ExpenseFormProps) {
  const isBranchManager = actor.role === "BRANCH_MANAGER";
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseFormSchema),
    defaultValues: getDefaultValues(expense),
  });

  useEffect(() => {
    form.reset(getDefaultValues(expense));
  }, [expense, form]);

  const availableBranches = branches.filter(
    (branch) => branch.isActive || branch.id === expense?.branchId,
  );

  const submit = (values: ExpenseFormValues) => {
    if (!isExpenseCategory(values.category)) return;
    onSubmit({
      title: values.title.trim(),
      description: values.description.trim() || null,
      category: values.category,
      amount: values.amount.trim(),
      expenseDate: values.expenseDate,
      ...(!isBranchManager && {
        branchId: values.branchId ? Number(values.branchId) : null,
      }),
    });
  };

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <InputField
        label="Expense title"
        placeholder="Kitchen supplies"
        autoFocus
        error={form.formState.errors.title?.message}
        {...form.register("title")}
      />
      <TextareaField
        label="Description"
        placeholder="Optional details or comment"
        rows={4}
        error={form.formState.errors.description?.message}
        {...form.register("description")}
      />
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <SelectField
          label="Category"
          error={form.formState.errors.category?.message}
          {...form.register("category")}
        >
          <option value="">Select a category</option>
          {EXPENSE_CATEGORIES.map((category) => (
            <option value={category} key={category}>
              {formatExpenseCategory(category)}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Amount (MMK)"
          placeholder="0.00"
          inputMode="decimal"
          error={form.formState.errors.amount?.message}
          {...form.register("amount")}
        />
      </div>
      <InputField
        label="Expense date"
        type="date"
        error={form.formState.errors.expenseDate?.message}
        {...form.register("expenseDate")}
      />

      {isBranchManager ? (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs font-bold text-ink">Branch</p>
          <p className="mt-1.5 text-sm font-semibold text-muted">
            {actor.branch?.name ?? "Assigned branch"}
          </p>
          <p className="mt-1 text-xs text-muted">
            This expense will be recorded for your assigned branch.
          </p>
        </div>
      ) : (
        <SelectField
          label="Branch"
          hint="Choose Restaurant-wide for overhead not tied to one branch."
          disabled={branchesLoading || isLoading}
          error={form.formState.errors.branchId?.message}
          {...form.register("branchId")}
        >
          <option value="">Restaurant-wide</option>
          {availableBranches.map((branch) => (
            <option
              value={branch.id}
              disabled={!branch.isActive}
              key={branch.id}
            >
              {branch.name}{branch.isActive ? "" : " (Inactive)"}
            </option>
          ))}
        </SelectField>
      )}

      <div className="mt-2 flex justify-end gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={branchesLoading && !isBranchManager}
          loadingLabel={expense ? "Saving..." : "Creating..."}
        >
          {expense ? "Save changes" : "Create expense"}
        </Button>
      </div>
    </form>
  );
}
