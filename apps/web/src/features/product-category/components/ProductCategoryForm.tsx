import { zodResolver } from "@hookform/resolvers/zod";
import type { ProductCategory } from "@restaurant-management/shared";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { InputField, TextareaField } from "../../../components/ui/FormField";
import type { CreateProductCategoryInput } from "../product-category-api";
import {
  ProductCategoryFormSchema,
  type ProductCategoryFormValues,
} from "../product-category-validation";

interface ProductCategoryFormProps {
  category?: ProductCategory;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateProductCategoryInput) => void;
}

const getDefaultValues = (category?: ProductCategory): ProductCategoryFormValues => ({
  name: category?.name ?? "",
  description: category?.description ?? "",
  sortOrder: (category?.sortOrder ?? 0).toString(),
  isActive: category?.isActive ?? true,
});

export function ProductCategoryForm({
  category,
  isLoading,
  onCancel,
  onSubmit,
}: ProductCategoryFormProps) {
  const form = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(ProductCategoryFormSchema),
    defaultValues: getDefaultValues(category),
  });

  useEffect(() => {
    form.reset(getDefaultValues(category));
  }, [category, form]);

  const submit = (values: ProductCategoryFormValues) => {
    onSubmit({
      name: values.name.trim(),
      description: values.description.trim() || null,
      sortOrder: Number(values.sortOrder),
      isActive: category?.isActive ? true : values.isActive,
    });
  };

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <InputField
        label="Category name"
        placeholder="Noodles"
        autoFocus
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />
      <TextareaField
        label="Description"
        placeholder="Optional description shown to staff"
        rows={4}
        error={form.formState.errors.description?.message}
        {...form.register("description")}
      />
      <InputField
        label="Sort order"
        type="number"
        min={0}
        step={1}
        hint="Lower numbers appear first in category lists."
        error={form.formState.errors.sortOrder?.message}
        {...form.register("sortOrder")}
      />
      <label className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4">
        <span>
          <span className="block text-sm font-bold text-ink">Active category</span>
          <span className="mt-1 block text-xs leading-5 text-muted">
            {category?.isActive
              ? "Use Deactivate to hide this category safely."
              : "Active categories can be assigned to products."}
          </span>
        </span>
        <input
          className="h-5 w-5 shrink-0 accent-brand-red disabled:cursor-not-allowed disabled:opacity-60"
          type="checkbox"
          disabled={isLoading || category?.isActive}
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
          loadingLabel={category ? "Saving..." : "Creating..."}
        >
          {category ? "Save changes" : "Create category"}
        </Button>
      </div>
    </form>
  );
}
