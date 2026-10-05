import { zodResolver } from "@hookform/resolvers/zod";
import type { Expense } from "@restaurant-management/shared";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { AttachmentPicker } from "../../../components/ui/AttachmentPicker";
import {
  InputField,
  SelectField,
  TextareaField,
} from "../../../components/ui/FormField";
import type { CreateExpenseInput } from "../expense-api";
import { uploadExpenseAttachment } from "../expense-api";
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
});

export function ExpenseForm({
  expense,
  isLoading,
  onCancel,
  onSubmit,
}: ExpenseFormProps) {
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseFormSchema),
    defaultValues: getDefaultValues(expense),
  });

  useEffect(() => {
    form.reset(getDefaultValues(expense));
  }, [expense, form]);

  const submit = (values: ExpenseFormValues) => {
    if (!isExpenseCategory(values.category)) return;
    onSubmit({
      title: values.title.trim(),
      description: values.description.trim() || null,
      category: values.category,
      amount: values.amount.trim(),
      expenseDate: values.expenseDate,
      ...(attachmentIds.length > 0 && { attachmentIds }),
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

      <AttachmentPicker
        maxFiles={Math.max(0, 5 - (expense?.attachmentCount ?? 0))}
        disabled={isLoading}
        upload={uploadExpenseAttachment}
        onChange={setAttachmentIds}
        onUploadingChange={setAttachmentsUploading}
      />

      <div className="mt-2 flex justify-end gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={attachmentsUploading}
          loadingLabel={expense ? "Saving..." : "Creating..."}
        >
          {expense ? "Save changes" : "Create expense"}
        </Button>
      </div>
    </form>
  );
}
