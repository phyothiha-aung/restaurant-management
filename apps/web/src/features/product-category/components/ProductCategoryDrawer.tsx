import type { ProductCategory } from "@restaurant-management/shared";
import { Edit3, Power, PowerOff } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { getApiErrorMessage } from "../../../lib/api-error";
import type { CreateProductCategoryInput } from "../product-category-api";
import {
  useCreateProductCategory,
  useProductCategory,
  useUpdateProductCategory,
} from "../product-category-services";
import { ProductCategoryDetails } from "./ProductCategoryDetails";
import { ProductCategoryForm } from "./ProductCategoryForm";

export type ProductCategoryDrawerMode = "create" | "view" | "edit";

interface ProductCategoryDrawerProps {
  open: boolean;
  mode: ProductCategoryDrawerMode;
  categoryId: number | null;
  onClose: () => void;
  onEdit: () => void;
  onRequestDeactivate: (category: ProductCategory) => void;
}

export function ProductCategoryDrawer({
  open,
  mode,
  categoryId,
  onClose,
  onEdit,
  onRequestDeactivate,
}: ProductCategoryDrawerProps) {
  const detail = useProductCategory(mode === "create" || !open ? null : categoryId);
  const createMutation = useCreateProductCategory({ onSuccess: onClose });
  const updateMutation = useUpdateProductCategory({ onSuccess: onClose });
  const category = detail.data;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const title = mode === "create"
    ? "Add product category"
    : mode === "edit"
      ? "Edit product category"
      : "Product category details";
  const description = mode === "create"
    ? "Create a restaurant-wide category for menu products."
    : mode === "edit"
      ? "Update the category name, description, and display order."
      : "Review this category's details and availability.";

  const handleSubmit = (input: CreateProductCategoryInput) => {
    if (mode === "create") {
      createMutation.mutate(input);
      return;
    }
    if (categoryId) updateMutation.mutate({ id: categoryId, input });
  };

  const handleClose = () => {
    if (!isSaving) onClose();
  };

  const footer = mode === "view" && category ? (
    <div className="flex flex-wrap justify-end gap-3">
      {category.isActive ? (
        <Button variant="danger" onClick={() => onRequestDeactivate(category)}>
          <PowerOff size={16} /> Deactivate
        </Button>
      ) : (
        <Button
          variant="secondary"
          isLoading={updateMutation.isPending}
          loadingLabel="Reactivating..."
          onClick={() => updateMutation.mutate({ id: category.id, input: { isActive: true } })}
        >
          <Power size={16} /> Reactivate
        </Button>
      )}
      <Button variant="outline" onClick={onEdit}>
        <Edit3 size={16} /> Edit
      </Button>
    </div>
  ) : undefined;

  return (
    <Drawer open={open} title={title} description={description} footer={footer} onClose={handleClose}>
      {mode === "create" ? (
        <ProductCategoryForm
          isLoading={createMutation.isPending}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      ) : detail.isPending ? (
        <DrawerSkeleton />
      ) : detail.isError ? (
        <div className="rounded-2xl border border-danger/20 bg-brand-red-soft p-5">
          <p className="font-bold text-danger">Could not load this category</p>
          <p className="mt-1 text-sm text-muted">
            {getApiErrorMessage(detail.error, "Please try again.")}
          </p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => void detail.refetch()}>
            Retry
          </Button>
        </div>
      ) : category && mode === "edit" ? (
        <ProductCategoryForm
          category={category}
          isLoading={updateMutation.isPending}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      ) : category ? (
        <ProductCategoryDetails category={category} />
      ) : null}
    </Drawer>
  );
}

function DrawerSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading category details">
      <div className="h-28 rounded-2xl bg-line-soft" />
      {[1, 2, 3].map((item) => <div className="h-16 rounded-xl bg-line-soft" key={item} />)}
    </div>
  );
}
