import { zodResolver } from "@hookform/resolvers/zod";
import type { Expense } from "@restaurant-management/shared";
import { AlertTriangle } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { TextareaField } from "../../../components/ui/FormField";
import {
  VoidExpenseSchema,
  type VoidExpenseFormValues,
} from "../expense-validation";

interface VoidExpenseDialogProps {
  expense: Expense | null;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function VoidExpenseDialog({
  expense,
  isLoading,
  onCancel,
  onConfirm,
}: VoidExpenseDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const form = useForm<VoidExpenseFormValues>({
    resolver: zodResolver(VoidExpenseSchema),
    defaultValues: { reason: "" },
  });
  const open = expense !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      form.reset({ reason: "" });
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [form, open]);

  useEffect(() => {
    if (!open || isLoading) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, onCancel, open]);

  const submit = (values: VoidExpenseFormValues) => {
    onConfirm(values.reason.trim());
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/45"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isLoading) onCancel();
      }}
    >
      <form className="p-6" onSubmit={form.handleSubmit(submit)} noValidate>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-red-soft text-brand-red">
          <AlertTriangle size={21} />
        </div>
        <h2 id={titleId} className="mt-4 text-lg font-extrabold">
          Void expense?
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
          {expense
            ? `${expense.title} will remain in financial history as a voided record and cannot be restored.`
            : "This expense will remain in financial history as a voided record."}
        </p>
        <div className="mt-5">
          <TextareaField
            label="Reason for voiding"
            placeholder="Explain why this expense should be voided"
            rows={4}
            autoFocus
            disabled={isLoading}
            error={form.formState.errors.reason?.message}
            {...form.register("reason")}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isLoading}
            loadingLabel="Voiding..."
          >
            Void expense
          </Button>
        </div>
      </form>
    </dialog>
  );
}
