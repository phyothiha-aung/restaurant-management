import type { ProductCategory } from "@restaurant-management/shared";
import { Plus, RefreshCw, Search, Tags } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import {
  ProductCategoryDrawer,
  type ProductCategoryDrawerMode,
} from "../features/product-category/components/ProductCategoryDrawer";
import { ProductCategoryList } from "../features/product-category/components/ProductCategoryList";
import {
  useDeactivateProductCategory,
  useProductCategories,
  useUpdateProductCategory,
} from "../features/product-category/product-category-services";
import { getApiErrorMessage } from "../lib/api-error";

const PAGE_LIMIT = 10;

interface DrawerState {
  mode: ProductCategoryDrawerMode;
  categoryId: number | null;
}

function CategorySearch({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    const timer = window.setTimeout(() => onSearch(value.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [onSearch, value]);

  return (
    <label className="relative flex-1">
      <span className="sr-only">Search product categories</span>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
      <input
        className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft"
        type="search"
        placeholder="Search name or description"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </label>
  );
}

const parsePage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export function ProductCategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const search = searchParams.get("search")?.trim() ?? "";
  const activeParam = searchParams.get("isActive");
  const isActive = activeParam === "true" ? true : activeParam === "false" ? false : undefined;
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ProductCategory | null>(null);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      ...(search && { search }),
      ...(isActive !== undefined && { isActive }),
    }),
    [isActive, page, search],
  );
  const categoriesQuery = useProductCategories(query);
  const closeDrawer = () => setDrawer(null);
  const deactivateMutation = useDeactivateProductCategory({
    onSuccess: (category) => {
      setDeactivateTarget(null);
      if (drawer?.categoryId === category.id) closeDrawer();
    },
  });
  const reactivateMutation = useUpdateProductCategory();

  const updateSearch = useCallback(
    (nextSearch: string) => {
      if (nextSearch === search) return;
      const next = new URLSearchParams(searchParams);
      if (nextSearch) next.set("search", nextSearch);
      else next.delete("search");
      next.delete("page");
      setSearchParams(next, { replace: true });
    },
    [search, searchParams, setSearchParams],
  );

  useEffect(() => {
    const totalPages = categoriesQuery.data?.meta.totalPages;
    if (!totalPages || page <= totalPages) return;
    const next = new URLSearchParams(searchParams);
    if (totalPages === 1) next.delete("page");
    else next.set("page", totalPages.toString());
    setSearchParams(next, { replace: true });
  }, [categoriesQuery.data?.meta.totalPages, page, searchParams, setSearchParams]);

  const updateStatus = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("isActive");
    else next.set("isActive", value);
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const updatePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete("page");
    else next.set("page", nextPage.toString());
    setSearchParams(next);
  };

  const openDrawer = (mode: ProductCategoryDrawerMode, categoryId: number | null = null) => {
    setDrawer({ mode, categoryId });
  };

  const categories = categoriesQuery.data?.data ?? [];
  const hasFilters = Boolean(search || activeParam);
  const pendingCategoryId =
    deactivateMutation.variables ?? reactivateMutation.variables?.id ?? null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Menu setup"
        title="Product Categories"
        description="Organize restaurant-wide menu products into clear, reusable categories."
        action={
          <Button onClick={() => openDrawer("create")}>
            <Plus size={17} /> Add category
          </Button>
        }
      />

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <CategorySearch key={search} initialValue={search} onSearch={updateSearch} />
        <label>
          <span className="sr-only">Filter by status</span>
          <select
            className="min-h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm font-semibold text-ink outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft sm:w-44"
            value={activeParam ?? "all"}
            onChange={(event) => updateStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
      </Card>

      <Card className="overflow-hidden">
        {categoriesQuery.isPending ? (
          <ListSkeleton />
        ) : categoriesQuery.isError ? (
          <ErrorState
            message={getApiErrorMessage(categoriesQuery.error, "Could not load product categories.")}
            onRetry={() => void categoriesQuery.refetch()}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onCreate={() => openDrawer("create")}
            onClearFilters={() => setSearchParams({}, { replace: true })}
          />
        ) : (
          <>
            <ProductCategoryList
              categories={categories}
              pendingCategoryId={pendingCategoryId}
              onView={(category) => openDrawer("view", category.id)}
              onEdit={(category) => openDrawer("edit", category.id)}
              onDeactivate={setDeactivateTarget}
              onReactivate={(category) =>
                reactivateMutation.mutate({ id: category.id, input: { isActive: true } })
              }
            />
            <Pagination
              currentPage={categoriesQuery.data.meta.currentPage}
              totalPages={categoriesQuery.data.meta.totalPages}
              totalItems={categoriesQuery.data.meta.totalItems}
              itemName="category"
              disabled={categoriesQuery.isFetching}
              onPageChange={updatePage}
            />
          </>
        )}
      </Card>

      <ProductCategoryDrawer
        open={drawer !== null}
        mode={drawer?.mode ?? "view"}
        categoryId={drawer?.categoryId ?? null}
        onClose={closeDrawer}
        onEdit={() =>
          setDrawer((current) => current ? { ...current, mode: "edit" } : current)
        }
        onRequestDeactivate={setDeactivateTarget}
      />

      <ConfirmDialog
        open={deactivateTarget !== null}
        title="Deactivate product category?"
        description={deactivateTarget
          ? `${deactivateTarget.name} will be hidden from active category choices. Existing records remain unchanged.`
          : ""}
        confirmLabel="Deactivate category"
        isLoading={deactivateMutation.isPending}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) deactivateMutation.mutate(deactivateTarget.id);
        }}
      />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4" aria-label="Loading product categories">
      <div className="h-11 rounded-xl bg-line-soft" />
      {[1, 2, 3, 4].map((item) => <div className="h-20 rounded-xl bg-line-soft" key={item} />)}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-red-soft text-brand-red">
          <RefreshCw size={21} />
        </div>
        <h2 className="mt-4 text-lg font-extrabold">Categories could not be loaded</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
        <Button className="mt-5" variant="outline" onClick={onRetry}>
          <RefreshCw size={16} /> Retry
        </Button>
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onCreate,
  onClearFilters,
}: {
  hasFilters: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-gold-soft text-brand-gold-dark">
          <Tags size={22} />
        </div>
        <h2 className="mt-4 text-lg font-extrabold">
          {hasFilters ? "No matching categories" : "No product categories yet"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {hasFilters
            ? "Try changing or clearing the current filters."
            : "Create the first category for the restaurant menu."}
        </p>
        {hasFilters ? (
          <Button className="mt-5" variant="outline" onClick={onClearFilters}>Clear filters</Button>
        ) : (
          <Button className="mt-5" onClick={onCreate}><Plus size={16} /> Add category</Button>
        )}
      </div>
    </div>
  );
}
