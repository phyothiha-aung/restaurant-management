import { zodResolver } from "@hookform/resolvers/zod";
import type { Branch } from "@restaurant-management/shared";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { InputField, TextareaField } from "../../../components/ui/FormField";
import type { CreateBranchInput } from "../branch-api";
import { BranchFormSchema, type BranchFormValues } from "../branch-validation";

interface BranchFormProps {
  branch?: Branch;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateBranchInput) => void;
}

const getDefaultValues = (branch?: Branch): BranchFormValues => ({
  name: branch?.name ?? "",
  branchCode: branch?.branchCode ?? "",
  address: branch?.address ?? "",
  phone: branch?.phone ?? "",
  isActive: branch?.isActive ?? true,
});

export function BranchForm({ branch, isLoading, onCancel, onSubmit }: BranchFormProps) {
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(BranchFormSchema),
    defaultValues: getDefaultValues(branch),
  });

  useEffect(() => {
    form.reset(getDefaultValues(branch));
  }, [branch, form]);

  const submit = (values: BranchFormValues) => {
    onSubmit({
      name: values.name.trim(),
      branchCode: values.branchCode.trim() || null,
      address: values.address.trim() || null,
      phone: values.phone.trim() || null,
      isActive: branch?.isActive ? true : values.isActive,
    });
  };

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <InputField
        label="Branch name"
        placeholder="Downtown branch"
        autoFocus
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />
      <InputField
        label="Branch code"
        placeholder="ANN-001"
        hint="Optional internal code. It must be unique when provided."
        error={form.formState.errors.branchCode?.message}
        {...form.register("branchCode")}
      />
      <TextareaField
        label="Address"
        placeholder="Street, township, city"
        rows={4}
        error={form.formState.errors.address?.message}
        {...form.register("address")}
      />
      <InputField
        label="Phone"
        placeholder="09 123 456 789"
        type="tel"
        error={form.formState.errors.phone?.message}
        {...form.register("phone")}
      />

      <label className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4">
        <span>
          <span className="block text-sm font-bold text-ink">Active branch</span>
          <span className="mt-1 block text-xs leading-5 text-muted">
            {branch?.isActive
              ? "Use the Deactivate action to disable this branch safely."
              : "Active branches can be assigned to staff accounts."}
          </span>
        </span>
        <input
          className="h-5 w-5 shrink-0 accent-brand-red disabled:cursor-not-allowed disabled:opacity-60"
          type="checkbox"
          disabled={isLoading || branch?.isActive}
          {...form.register("isActive")}
        />
      </label>

      <div className="mt-2 flex justify-end gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          loadingLabel={branch ? "Saving..." : "Creating..."}
        >
          {branch ? "Save changes" : "Create branch"}
        </Button>
      </div>
    </form>
  );
}
