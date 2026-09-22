import type { Branch, Expense, User } from "@restaurant-management/shared";
import { Edit3, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { getApiErrorMessage } from "../../../lib/api-error";
import type { CreateExpenseInput } from "../expense-api";
import {
  useCreateExpense,
  useExpense,
  useUpdateExpense,
} from "../expense-services";
import { ExpenseDetails } from "./ExpenseDetails";
import { ExpenseForm } from "./ExpenseForm";

export type ExpenseDrawerMode = "create" | "view" | "edit";

interface ExpenseDrawerProps {
  open: boolean;
  mode: ExpenseDrawerMode;
  expenseId: number | null;
  actor: User;
  branches: Branch[];
  branchesLoading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRequestVoid: (expense: Expense) => void;
}

export function ExpenseDrawer({
  open,
  mode,
  expenseId,
  actor,
  branches,
  branchesLoading,
  onClose,
  onEdit,
  onRequestVoid,
}: ExpenseDrawerProps) {
  const detail = useExpense(mode === "create" || !open ? null : expenseId);
  const createMutation = useCreateExpense({ onSuccess: onClose });
  const updateMutation = useUpdateExpense({ onSuccess: onClose });
  const expense = detail.data;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const title =
    mode === "create"
      ? "Add expense"
      : mode === "edit"
        ? "Edit expense"
        : "Expense details";
  const description =
    mode === "create"
      ? "Record a restaurant or branch expense."
      : mode === "edit"
        ? "Update this expense while preserving its audit history."
        : "Review expense details and audit information.";

  const handleSubmit = (input: CreateExpenseInput) => {
    if (mode === "create") {
      createMutation.mutate(input);
      return;
    }
    if (expenseId) updateMutation.mutate({ id: expenseId, input });
  };

  const handleClose = () => {
    if (!isSaving) onClose();
  };

  const footer = mode === "view" && expense?.status === "ACTIVE" ? (
    <div className="flex flex-wrap justify-end gap-3">
      <Button variant="danger" onClick={() => onRequestVoid(expense)}>
        <XCircle size={16} /> Void expense
      </Button>
      <Button variant="outline" onClick={onEdit}>
        <Edit3 size={16} /> Edit
      </Button>
    </div>
  ) : undefined;

  return (
    <Drawer
      open={open}
      title={title}
      description={description}
      footer={footer}
      onClose={handleClose}
    >
      {mode === "create" ? (
        <ExpenseForm
          actor={actor}
          branches={branches}
          branchesLoading={branchesLoading}
          isLoading={createMutation.isPending}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      ) : detail.isPending ? (
        <ExpenseDrawerSkeleton />
      ) : detail.isError ? (
        <div className="rounded-2xl border border-danger/20 bg-brand-red-soft p-5">
          <p className="font-bold text-danger">Could not load this expense</p>
          <p className="mt-1 text-sm text-muted">
            {getApiErrorMessage(detail.error, "Please try again.")}
          </p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => void detail.refetch()}>
            Retry
          </Button>
        </div>
      ) : expense && mode === "edit" ? (
        <ExpenseForm
          actor={actor}
          branches={branches}
          branchesLoading={branchesLoading}
          expense={expense}
          isLoading={updateMutation.isPending}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      ) : expense ? (
        <ExpenseDetails expense={expense} />
      ) : null}
    </Drawer>
  );
}

function ExpenseDrawerSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading expense details">
      <div className="h-32 rounded-2xl bg-line-soft" />
      {[1, 2, 3, 4].map((item) => (
        <div className="h-16 rounded-xl bg-line-soft" key={item} />
      ))}
    </div>
  );
}
