import type { Expense, ExpenseStatus } from "@restaurant-management/shared";
import {
  Building2,
  CalendarDays,
  Edit3,
  Eye,
  MoreHorizontal,
  ReceiptText,
  XCircle,
  Paperclip,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import {
  formatExpenseAmount,
  formatExpenseCategory,
} from "../expense-options";

interface ExpenseListProps {
  expenses: Expense[];
  pendingExpenseId: number | null;
  onView: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onVoid: (expense: Expense) => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const statusTone: Record<ExpenseStatus, "success" | "neutral"> = {
  ACTIVE: "success",
  VOIDED: "neutral",
};
const formatExpenseDate = (value: string) =>
  dateFormatter.format(new Date(`${value}T00:00:00`));

export function ExpenseList({
  expenses,
  pendingExpenseId,
  onView,
  onEdit,
  onVoid,
}: ExpenseListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
              <th className="px-5 py-3.5">Expense</th>
              <th className="px-4 py-3.5">Amount</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Branch</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Updated</th>
              <th className="px-5 py-3.5 text-right">
                <span className="sr-only">Actions</span>
                <MoreHorizontal className="ml-auto" size={17} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {expenses.map((expense) => {
              const isPending = pendingExpenseId === expense.id;
              const isActive = expense.status === "ACTIVE";
              return (
                <tr className="transition hover:bg-surface" key={expense.id}>
                  <td className="max-w-64 px-5 py-4">
                    <button className="max-w-full text-left" onClick={() => onView(expense)}>
                      <span className="block truncate text-sm font-extrabold text-ink">
                        {expense.title}
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        {formatExpenseCategory(expense.category)} · {expense.attachmentCount} file{expense.attachmentCount === 1 ? "" : "s"}
                      </span>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-extrabold text-ink">
                    {formatExpenseAmount(expense.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                    {formatExpenseDate(expense.expenseDate)}
                  </td>
                  <td className="max-w-48 px-4 py-4 text-xs text-muted">
                    <span className="block truncate">
                      {expense.branch?.name ?? "Restaurant-wide"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={statusTone[expense.status]}>{expense.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                    {dateFormatter.format(new Date(expense.updatedAt))}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <IconButton label={`View ${expense.title}`} onClick={() => onView(expense)}>
                        <Eye size={16} />
                      </IconButton>
                      {isActive && (
                        <>
                          <IconButton label={`Edit ${expense.title}`} onClick={() => onEdit(expense)}>
                            <Edit3 size={16} />
                          </IconButton>
                          <IconButton
                            label={`Void ${expense.title}`}
                            disabled={isPending}
                            onClick={() => onVoid(expense)}
                          >
                            <XCircle size={16} />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {expenses.map((expense) => {
          const isPending = pendingExpenseId === expense.id;
          const isActive = expense.status === "ACTIVE";
          return (
            <article className="rounded-2xl border border-line bg-white p-4" key={expense.id}>
              <div className="flex items-start justify-between gap-3">
                <button className="min-w-0 text-left" onClick={() => onView(expense)}>
                  <h3 className="truncate font-extrabold text-ink">{expense.title}</h3>
                  <p className="mt-1 text-sm font-extrabold text-brand-red">
                    {formatExpenseAmount(expense.amount)}
                  </p>
                </button>
                <Badge tone={statusTone[expense.status]}>{expense.status}</Badge>
              </div>
              <div className="mt-4 grid gap-2 text-xs text-muted">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <ReceiptText className="shrink-0 text-brand-red" size={14} />
                  {formatExpenseCategory(expense.category)}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="shrink-0" size={14} />
                  {formatExpenseDate(expense.expenseDate)}
                </p>
                <p className="flex items-center gap-2">
                  <Building2 className="shrink-0" size={14} />
                  {expense.branch?.name ?? "Restaurant-wide"}
                </p>
                <p className="flex items-center gap-2">
                  <Paperclip className="shrink-0" size={14} />
                  {expense.attachmentCount} attachment{expense.attachmentCount === 1 ? "" : "s"}
                </p>
                <p>Updated {dateFormatter.format(new Date(expense.updatedAt))}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                <Button size="sm" variant="ghost" onClick={() => onView(expense)}>
                  <Eye size={15} /> View
                </Button>
                {isActive && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => onEdit(expense)}>
                      <Edit3 size={15} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => onVoid(expense)}
                    >
                      <XCircle size={15} /> Void
                    </Button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function IconButton({
  label,
  disabled,
  children,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-line-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
