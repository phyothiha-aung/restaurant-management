import { zodResolver } from "@hookform/resolvers/zod";
import type { Addon, Product, ProductCategory } from "@restaurant-management/shared";
import { Plus, PowerOff, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { InputField, SelectField, TextareaField } from "../../../components/ui/FormField";
import type { AddonAssignmentInput, CreateProductInput } from "../catalog-api";
import { ProductFormSchema, type ProductFormValues } from "../catalog-validation";
import { ProductImagePicker, type ProductImageChange } from "./ProductImagePicker";

interface SubmitValue { input: CreateProductInput; image: ProductImageChange }
interface Props {
  product?: Product;
  categories: ProductCategory[];
  addons: Addon[];
  currentImageUrl?: string;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (value: SubmitValue) => void;
}

const defaults = (product?: Product): ProductFormValues => ({
  name: product?.name ?? "",
  code: product?.code ?? "",
  description: product?.description ?? "",
  categoryId: product?.categoryId.toString() ?? "",
  sortOrder: (product?.sortOrder ?? 0).toString(),
  isActive: product?.isActive ?? true,
  variants: product?.variants.map((variant) => ({ ...variant, sortOrder: variant.sortOrder.toString() })) ?? [
    { name: "Regular", price: "", sortOrder: "0", isActive: true },
  ],
  addons: product?.addons
    .filter((addon) => addon.isActive)
    .map((addon) => ({ addonId: addon.id, maxQuantity: addon.maxQuantity, sortOrder: addon.sortOrder })) ?? [],
});

export function ProductForm({ product, categories, addons: addonOptions, currentImageUrl, isLoading, onCancel, onSubmit }: Props) {
  const form = useForm<ProductFormValues>({ resolver: zodResolver(ProductFormSchema), defaultValues: defaults(product) });
  const variants = useFieldArray({ control: form.control, name: "variants", keyName: "fieldKey" });
  const assignments = useFieldArray({ control: form.control, name: "addons", keyName: "fieldKey" });
  const inactiveAssignments = product?.addons.filter((addon) => !addon.isActive) ?? [];
  const [image, setImage] = useState<ProductImageChange>({ file: null, remove: false });
  const [formError, setFormError] = useState<string | null>(null);
  const handleImage = useCallback((value: ProductImageChange) => setImage(value), []);

  const availableCategories = categories.some((item) => item.id === product?.categoryId)
    ? categories
    : product ? [{ ...product.category, description: null, sortOrder: 0, createdAt: "", updatedAt: "" }, ...categories] : categories;
  const selected = new Map(assignments.fields.map((assignment, index) => [assignment.addonId, index]));
  const toggleAssignment = (addonId: number) => {
    const index = selected.get(addonId);
    if (index !== undefined) assignments.remove(index);
    else assignments.append({ addonId, maxQuantity: 1, sortOrder: assignments.fields.length });
  };

  const submit = (values: ProductFormValues) => {
    setFormError(null);
    const addons: AddonAssignmentInput[] = values.addons.map((assignment) => ({ ...assignment }));
    onSubmit({ input: {
      name: values.name.trim(), code: values.code.trim() || null,
      description: values.description.trim() || null, categoryId: Number(values.categoryId),
      sortOrder: Number(values.sortOrder), isActive: values.isActive,
      variants: values.variants.map((variant) => ({ ...variant, name: variant.name.trim(), price: variant.price.trim(), sortOrder: Number(variant.sortOrder) })),
      ...(!product || form.formState.dirtyFields.addons ? { addons } : {}),
    },
    image });
  };
  const invalid = () => setFormError("Review the highlighted fields before saving the product.");

  return (
    <form className="grid gap-6" onSubmit={form.handleSubmit(submit, invalid)} noValidate>
      {formError && <p className="rounded-xl border border-danger/20 bg-brand-red-soft p-3 text-sm font-semibold text-danger" role="alert">{formError}</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField label="Product name" autoFocus placeholder="Chicken noodle" error={form.formState.errors.name?.message} {...form.register("name")} />
        <InputField label="Code" placeholder="Optional code" error={form.formState.errors.code?.message} {...form.register("code")} />
      </div>
      <TextareaField label="Description" rows={3} placeholder="Optional menu description" error={form.formState.errors.description?.message} {...form.register("description")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Category" error={form.formState.errors.categoryId?.message} {...form.register("categoryId")}>
          <option value="">Select category</option>
          {availableCategories.map((category) => <option key={category.id} value={category.id} disabled={!category.isActive}>{category.name}{category.isActive ? "" : " (Inactive)"}</option>)}
        </SelectField>
        <InputField label="Sort order" type="number" min={0} step={1} error={form.formState.errors.sortOrder?.message} {...form.register("sortOrder")} />
      </div>

      <section className="grid gap-3 rounded-2xl border border-line p-4">
        <div className="flex items-center justify-between"><div><h3 className="font-bold text-ink">Variants</h3><p className="text-xs text-muted">Each product needs at least one active size or option.</p></div><Button size="sm" variant="outline" onClick={() => variants.append({ name: "", price: "", sortOrder: variants.fields.length.toString(), isActive: true })}><Plus size={14} /> Add variant</Button></div>
        {(form.formState.errors.variants?.message || form.formState.errors.variants?.root?.message) && <p className="text-xs font-semibold text-danger">{form.formState.errors.variants.message ?? form.formState.errors.variants.root?.message}</p>}
        {variants.fields.map((field, index) => {
          const existing = field.id !== undefined;
          return <div className="grid gap-3 rounded-xl bg-surface p-3 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end" key={field.fieldKey}>
            <input type="hidden" {...form.register(`variants.${index}.id`, { setValueAs: (value) => value === "" ? undefined : Number(value) })} />
            <InputField label="Name" placeholder="Regular" error={form.formState.errors.variants?.[index]?.name?.message} {...form.register(`variants.${index}.name`)} />
            <InputField label="Price (MMK)" inputMode="decimal" placeholder="0" error={form.formState.errors.variants?.[index]?.price?.message} {...form.register(`variants.${index}.price`)} />
            <InputField label="Order" type="number" min={0} error={form.formState.errors.variants?.[index]?.sortOrder?.message} {...form.register(`variants.${index}.sortOrder`)} />
            <div className="flex gap-1 pb-1">
              <label className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white" title="Active"><input className="h-4 w-4 accent-brand-red" type="checkbox" {...form.register(`variants.${index}.isActive`)} /></label>
              <button className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-brand-red-soft hover:text-danger" type="button" aria-label={existing ? "Deactivate variant" : "Remove variant"} onClick={() => existing ? form.setValue(`variants.${index}.isActive`, false, { shouldDirty: true, shouldValidate: true }) : variants.remove(index)}>{existing ? <PowerOff size={16} /> : <Trash2 size={16} />}</button>
            </div>
          </div>;
        })}
      </section>

      <section className="grid gap-3 rounded-2xl border border-line p-4">
        <div><h3 className="font-bold text-ink">Add-ons</h3><p className="text-xs text-muted">Select reusable add-ons and set product-specific limits.</p></div>
        {inactiveAssignments.length > 0 && <p className="rounded-lg bg-brand-gold-soft p-3 text-xs text-gold-ink">{inactiveAssignments.length} inactive assignment{inactiveAssignments.length === 1 ? " is" : "s are"} preserved until you change this section.</p>}
        <div className="grid gap-2">
          {addonOptions.map((addon) => {
            const assignmentIndex = selected.get(addon.id);
            const assigned = assignmentIndex !== undefined;
            return <div className="grid gap-3 rounded-xl bg-surface p-3 sm:grid-cols-[1fr_7rem_7rem] sm:items-center" key={addon.id}>
              <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" className="h-4 w-4 accent-brand-red" checked={assigned} onChange={() => toggleAssignment(addon.id)} /> <span>{addon.name}<span className="ml-2 text-xs font-normal text-muted">{Number(addon.unitPrice).toLocaleString()} MMK</span></span></label>
              {assigned && <><input type="hidden" {...form.register(`addons.${assignmentIndex}.addonId`, { valueAsNumber: true })} /><InputField label="Max qty" type="number" min={1} step={1} error={form.formState.errors.addons?.[assignmentIndex]?.maxQuantity?.message} {...form.register(`addons.${assignmentIndex}.maxQuantity`, { valueAsNumber: true })} /></>}
              {assigned && <InputField label="Order" type="number" min={0} step={1} error={form.formState.errors.addons?.[assignmentIndex]?.sortOrder?.message} {...form.register(`addons.${assignmentIndex}.sortOrder`, { valueAsNumber: true })} />}
            </div>;
          })}
          {form.formState.errors.addons?.root?.message && <p className="text-xs font-semibold text-danger">{form.formState.errors.addons.root.message}</p>}
          {addonOptions.length === 0 && <p className="text-sm text-muted">No active add-ons. Create them from the Add-ons tab.</p>}
        </div>
      </section>

      <ProductImagePicker key={product?.id ?? "new"} currentUrl={currentImageUrl} currentName={product?.image?.file.originalName} disabled={isLoading} onChange={handleImage} />
      <label className="flex items-center justify-between rounded-xl border border-line bg-surface p-4"><span><span className="block text-sm font-bold">Active product</span><span className="text-xs text-muted">Use Deactivate for an active product.</span></span><input className="h-5 w-5 accent-brand-red" type="checkbox" disabled={Boolean(product?.isActive)} {...form.register("isActive")} /></label>
      <div className="flex justify-end gap-3 border-t border-line pt-5"><Button variant="ghost" onClick={onCancel} disabled={isLoading}>Cancel</Button><Button type="submit" isLoading={isLoading} loadingLabel="Saving...">{product ? "Save changes" : "Create product"}</Button></div>
    </form>
  );
}
