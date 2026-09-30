import type { Addon, Product } from "@restaurant-management/shared";
import { Boxes, Plus, RefreshCw, Search, Tags } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { AddonDrawer, ProductDrawer, type DrawerMode } from "../features/catalog/components/CatalogDrawers";
import { AddonList, ProductList } from "../features/catalog/components/CatalogLists";
import {
  useAddons,
  useDeactivateAddon,
  useDeactivateProduct,
  useProducts,
  useUpdateAddon,
  useUpdateProduct,
} from "../features/catalog/catalog-services";
import { useProductCategories } from "../features/product-category/product-category-services";
import { getApiErrorMessage } from "../lib/api-error";
import { managementRoles } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";

const LIMIT = 10;
type Tab = "products" | "addons";
interface DrawerState { mode: DrawerMode; id: number | null }
const pageValue = (value: string | null) => { const page = Number(value); return Number.isInteger(page) && page > 0 ? page : 1; };
const categoryValue = (value: string | null) => { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : undefined; };

export function CatalogPage() {
  const actor = useAuthStore((state) => state.user)!;
  const canManage = managementRoles.includes(actor.role);
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "addons" ? "addons" : "products";
  const page = pageValue(params.get("page"));
  const search = params.get("search")?.trim() ?? "";
  const status = params.get("isActive");
  const isActive = status === "true" ? true : status === "false" ? false : undefined;
  const categoryId = tab === "products" ? categoryValue(params.get("categoryId")) : undefined;
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [productTarget, setProductTarget] = useState<Product | null>(null);
  const [addonTarget, setAddonTarget] = useState<Addon | null>(null);
  const query = useMemo(() => ({ page, limit: LIMIT, ...(search && { search }), ...(isActive !== undefined && { isActive }), ...(categoryId && { categoryId }) }), [categoryId, isActive, page, search]);
  const products = useProducts(query);
  const addons = useAddons(query);
  const addonOptions = useAddons({ page: 1, limit: 100, isActive: true });
  const categories = useProductCategories({ page: 1, limit: 100 });
  const activeQuery = tab === "products" ? products : addons;
  const closeDrawer = () => setDrawer(null);
  const deactivateProduct = useDeactivateProduct({ onSuccess: () => { setProductTarget(null); closeDrawer(); } });
  const updateProduct = useUpdateProduct();
  const deactivateAddon = useDeactivateAddon({ onSuccess: () => { setAddonTarget(null); closeDrawer(); } });
  const updateAddon = useUpdateAddon();

  const setFilter = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value); else next.delete(key);
    next.delete("page"); setParams(next, { replace: true });
  };
  const changeTab = (nextTab: Tab) => setParams(nextTab === "addons" ? { tab: "addons" } : {}, { replace: true });
  const updateSearch = useCallback((value: string) => setFilter("search", value || undefined), [params]); // eslint-disable-line react-hooks/exhaustive-deps
  const updatePage = (nextPage: number) => { const next = new URLSearchParams(params); if (nextPage <= 1) next.delete("page"); else next.set("page", String(nextPage)); setParams(next); };
  useEffect(() => {
    const total = activeQuery.data?.meta.totalPages; if (!total || page <= total) return;
    const next = new URLSearchParams(params); if (total === 1) next.delete("page"); else next.set("page", String(total)); setParams(next, { replace: true });
  }, [activeQuery.data?.meta.totalPages, page, params, setParams]);

  const data = activeQuery.data?.data ?? [];
  const hasFilters = Boolean(search || status || categoryId);
  const pendingId = tab === "products" ? deactivateProduct.variables ?? updateProduct.variables?.id ?? null : deactivateAddon.variables ?? updateAddon.variables?.id ?? null;
  const open = (mode: DrawerMode, id: number | null = null) => setDrawer({ mode, id });

  return <div className="space-y-7">
    <PageHeader eyebrow="Menu setup" title="Catalog" description="Manage one central product menu and reusable add-ons for every branch." action={canManage ? <Button onClick={() => open("create")}><Plus size={17} /> Add {tab === "products" ? "product" : "add-on"}</Button> : undefined} />
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line">
      <div className="flex gap-1"><TabButton active={tab === "products"} onClick={() => changeTab("products")}>Products</TabButton><TabButton active={tab === "addons"} onClick={() => changeTab("addons")}>Add-ons</TabButton></div>
      {canManage && <Link className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-brand-red hover:underline" to="/product-categories"><Tags size={16} /> Manage categories</Link>}
    </div>
    <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
      <SearchBox key={`${tab}-${search}`} value={search} onSearch={updateSearch} placeholder={tab === "products" ? "Search product name, code, or description" : "Search add-on name"} />
      {tab === "products" && <select className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold" value={categoryId ?? "all"} onChange={(event) => setFilter("categoryId", event.target.value)}><option value="all">All categories</option>{(categories.data?.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>}
      <select className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold" value={status ?? "all"} onChange={(event) => setFilter("isActive", event.target.value)}><option value="all">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select>
    </Card>
    <Card className="overflow-hidden">{activeQuery.isPending ? <Skeleton /> : activeQuery.isError ? <ErrorState message={getApiErrorMessage(activeQuery.error, `Could not load ${tab}.`)} onRetry={() => void activeQuery.refetch()} /> : data.length === 0 ? <Empty tab={tab} filtered={hasFilters} canManage={canManage} onCreate={() => open("create")} onClear={() => setParams(tab === "addons" ? { tab: "addons" } : {}, { replace: true })} /> : <>{tab === "products" ? <ProductList products={data as Product[]} canManage={canManage} pendingId={pendingId} onView={(v) => open("view", v.id)} onEdit={(v) => open("edit", v.id)} onDeactivate={setProductTarget} onReactivate={(v) => updateProduct.mutate({ id: v.id, input: { isActive: true } })} /> : <AddonList addons={data as Addon[]} canManage={canManage} pendingId={pendingId} onView={(v) => open("view", v.id)} onEdit={(v) => open("edit", v.id)} onDeactivate={setAddonTarget} onReactivate={(v) => updateAddon.mutate({ id: v.id, input: { isActive: true } })} />}<Pagination currentPage={activeQuery.data.meta.currentPage} totalPages={activeQuery.data.meta.totalPages} totalItems={activeQuery.data.meta.totalItems} itemName={tab === "products" ? "product" : "add-on"} disabled={activeQuery.isFetching} onPageChange={updatePage} /></>}</Card>

    {tab === "products" ? <ProductDrawer open={drawer !== null} mode={drawer?.mode ?? "view"} productId={drawer?.id ?? null} canManage={canManage} categories={categories.data?.data ?? []} addons={addonOptions.data?.data ?? []} onClose={closeDrawer} onEdit={() => setDrawer((v) => v ? { ...v, mode: "edit" } : v)} onDeactivate={setProductTarget} /> : <AddonDrawer open={drawer !== null} mode={drawer?.mode ?? "view"} addonId={drawer?.id ?? null} canManage={canManage} onClose={closeDrawer} onEdit={() => setDrawer((v) => v ? { ...v, mode: "edit" } : v)} onDeactivate={setAddonTarget} />}
    <ConfirmDialog open={productTarget !== null} title="Deactivate product?" description={productTarget ? `${productTarget.name} will disappear from the active menu at every branch. Its variants and add-on assignments remain stored.` : ""} confirmLabel="Deactivate product" isLoading={deactivateProduct.isPending} onCancel={() => setProductTarget(null)} onConfirm={() => productTarget && deactivateProduct.mutate(productTarget.id)} />
    <ConfirmDialog open={addonTarget !== null} title="Deactivate add-on?" description={addonTarget ? `${addonTarget.name} will disappear from active menus. Its ${addonTarget.productCount} product assignment${addonTarget.productCount === 1 ? "" : "s"} will remain stored.` : ""} confirmLabel="Deactivate add-on" isLoading={deactivateAddon.isPending} onCancel={() => setAddonTarget(null)} onConfirm={() => addonTarget && deactivateAddon.mutate(addonTarget.id)} />
  </div>;
}

function SearchBox({ value, placeholder, onSearch }: { value: string; placeholder: string; onSearch: (value: string) => void }) { const [local, setLocal] = useState(value); useEffect(() => { const timer = window.setTimeout(() => onSearch(local.trim()), 300); return () => clearTimeout(timer); }, [local, onSearch]); return <label className="relative flex-1"><span className="sr-only">Search catalog</span><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} /><input className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft" type="search" value={local} placeholder={placeholder} onChange={(event) => setLocal(event.target.value)} /></label>; }
function TabButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) { return <button className={`border-b-2 px-4 py-3 text-sm font-extrabold ${active ? "border-brand-red text-brand-red" : "border-transparent text-muted"}`} onClick={onClick}>{children}</button>; }
function Skeleton() { return <div className="animate-pulse space-y-3 p-4">{[1,2,3,4].map((i) => <div className="h-20 rounded-xl bg-line-soft" key={i} />)}</div>; }
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="grid min-h-72 place-items-center p-8 text-center"><div><RefreshCw className="mx-auto text-brand-red" /><p className="mt-3 text-sm text-muted">{message}</p><Button className="mt-4" variant="outline" onClick={onRetry}>Retry</Button></div></div>; }
function Empty({ tab, filtered, canManage, onCreate, onClear }: { tab: Tab; filtered: boolean; canManage: boolean; onCreate: () => void; onClear: () => void }) { return <div className="grid min-h-72 place-items-center p-8 text-center"><div><Boxes className="mx-auto text-brand-gold-dark" /><h2 className="mt-3 font-extrabold">{filtered ? `No matching ${tab}` : `No ${tab} yet`}</h2><p className="mt-2 text-sm text-muted">{filtered ? "Try changing the current filters." : `The central ${tab} catalog is empty.`}</p>{filtered ? <Button className="mt-4" variant="outline" onClick={onClear}>Clear filters</Button> : canManage && <Button className="mt-4" onClick={onCreate}><Plus size={16} /> Add {tab === "products" ? "product" : "add-on"}</Button>}</div></div>; }
