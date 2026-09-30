import { zodResolver } from "@hookform/resolvers/zod";
import type { Addon } from "@restaurant-management/shared";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { InputField } from "../../../components/ui/FormField";
import type { CreateAddonInput } from "../catalog-api";
import { AddonFormSchema, type AddonFormValues } from "../catalog-validation";

export function AddonForm({ addon, isLoading, onCancel, onSubmit }: { addon?: Addon; isLoading: boolean; onCancel: () => void; onSubmit: (input: CreateAddonInput) => void }) {
  const form = useForm<AddonFormValues>({ resolver: zodResolver(AddonFormSchema), defaultValues: { name: addon?.name ?? "", unitPrice: addon?.unitPrice ?? "", isActive: addon?.isActive ?? true } });
  useEffect(() => form.reset({ name: addon?.name ?? "", unitPrice: addon?.unitPrice ?? "", isActive: addon?.isActive ?? true }), [addon, form]);
  return <form className="grid gap-5" onSubmit={form.handleSubmit((value) => onSubmit({ name: value.name.trim(), unitPrice: value.unitPrice.trim(), isActive: value.isActive }))} noValidate>
    <InputField label="Add-on name" autoFocus placeholder="Extra cheese" error={form.formState.errors.name?.message} {...form.register("name")} />
    <InputField label="Unit price (MMK)" inputMode="decimal" placeholder="0" error={form.formState.errors.unitPrice?.message} {...form.register("unitPrice")} />
    <label className="flex items-center justify-between rounded-xl border border-line bg-surface p-4"><span><span className="block text-sm font-bold">Active add-on</span><span className="text-xs text-muted">Use Deactivate for an active add-on.</span></span><input className="h-5 w-5 accent-brand-red" type="checkbox" disabled={Boolean(addon?.isActive)} {...form.register("isActive")} /></label>
    <div className="flex justify-end gap-3 border-t border-line pt-5"><Button variant="ghost" onClick={onCancel} disabled={isLoading}>Cancel</Button><Button type="submit" isLoading={isLoading} loadingLabel="Saving...">{addon ? "Save changes" : "Create add-on"}</Button></div>
  </form>;
}
