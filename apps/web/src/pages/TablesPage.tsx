import type {
  DiningTable,
  DiningTableStatus,
} from "@restaurant-management/shared";
import {
  Armchair,
  Edit3,
  Eye,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import {
  DiningTableDrawer,
  type DiningTableDrawerMode,
} from "../features/dining-table/components/DiningTableDrawer";
import {
  useDeactivateDiningTable,
  useDiningTables,
  useUpdateDiningTable,
} from "../features/dining-table/dining-table-services";
import { getApiErrorMessage } from "../lib/api-error";
import { canManageUsers } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";

const statuses: DiningTableStatus[] = ["AVAILABLE", "OCCUPIED", "INACTIVE"];
const statusTone = { AVAILABLE: "success", OCCUPIED: "red", INACTIVE: "neutral" } as const;
const parsePage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export function TablesPage() {
  const actor = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const page = parsePage(params.get("page"));
  const search = params.get("search")?.trim() ?? "";
  const statusParam = params.get("status");
  const status = statuses.includes(statusParam as DiningTableStatus)
    ? (statusParam as DiningTableStatus)
    : undefined;
  const [drawer, setDrawer] = useState<{ mode: DiningTableDrawerMode; id: number | null } | null>(null);
  const [target, setTarget] = useState<DiningTable | null>(null);
  const canManage = actor ? canManageUsers(actor.role) : false;
  const query = useMemo(
    () => ({ page, limit: 10, ...(search && { search }), ...(status && { status }) }),
    [page, search, status],
  );
  const tablesQuery = useDiningTables(query);
  const deactivate = useDeactivateDiningTable({ onSuccess: () => setTarget(null) });
  const reactivate = useUpdateDiningTable();

  const updateSearch = useCallback((value: string) => {
    const next = new URLSearchParams(params);
    if (value.trim()) next.set("search", value.trim()); else next.delete("search");
    next.delete("page");
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    const totalPages = tablesQuery.data?.meta.totalPages;
    if (!totalPages || page <= totalPages) return;
    const next = new URLSearchParams(params);
    if (totalPages === 1) next.delete("page"); else next.set("page", String(totalPages));
    setParams(next, { replace: true });
  }, [page, params, setParams, tablesQuery.data?.meta.totalPages]);

  if (!actor) return null;
  const tables = tablesQuery.data?.data ?? [];
  const setFilter = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("status"); else next.set("status", value);
    next.delete("page");
    setParams(next, { replace: true });
  };
  const setPage = (value: number) => {
    const next = new URLSearchParams(params);
    if (value <= 1) next.delete("page"); else next.set("page", String(value));
    setParams(next);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Dining room"
        title="Tables"
        description="See availability and manage restaurant seating."
        action={canManage ? <Button onClick={() => setDrawer({ mode: "create", id: null })}><Plus size={17} /> Add table</Button> : undefined}
      />
      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_14rem]">
        <DebouncedSearch value={search} onSearch={updateSearch} />
        <select className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft" value={status ?? "all"} onChange={(event) => setFilter(event.target.value)} aria-label="Filter table status">
          <option value="all">All tables</option>
          <option value="AVAILABLE">Available</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </Card>
      <Card className="overflow-hidden">
        {tablesQuery.isPending ? <div className="grid animate-pulse gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map((item) => <div className="h-40 rounded-2xl bg-line-soft" key={item} />)}</div>
        : tablesQuery.isError ? <div className="grid min-h-72 place-items-center p-8 text-center"><div><p className="font-extrabold text-brand-red">Could not load tables</p><p className="mt-2 text-sm text-muted">{getApiErrorMessage(tablesQuery.error, "Please try again.")}</p><Button className="mt-4" variant="outline" onClick={() => void tablesQuery.refetch()}><RefreshCw size={16} /> Retry</Button></div></div>
        : tables.length === 0 ? <div className="grid min-h-72 place-items-center p-8 text-center"><div><Armchair className="mx-auto text-brand-gold-dark" size={34} /><h2 className="mt-4 font-extrabold">{search || status ? "No tables match these filters" : "No tables yet"}</h2>{canManage && !search && !status && <Button className="mt-4" onClick={() => setDrawer({ mode: "create", id: null })}><Plus size={16} /> Add first table</Button>}</div></div>
        : <><div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{tables.map((table) => <article className="rounded-2xl border border-line bg-white p-5" key={table.id}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gold-soft text-brand-gold-dark"><Armchair size={19} /></span><div className="min-w-0"><h2 className="truncate font-extrabold">{table.name}</h2><p className="mt-0.5 text-xs text-muted">{table.capacity ? `${table.capacity} seats` : "Capacity not set"}</p></div></div><Badge tone={statusTone[table.status]}>{table.status}</Badge></div>{table.openOrder ? <Link className="mt-4 flex items-center justify-between rounded-xl bg-brand-red-soft p-3 text-sm font-bold text-brand-red" to={`/orders/${table.openOrder.id}`}><span>Order #{table.openOrder.id}</span><span>{table.openOrder.totalAmount} MMK</span></Link> : <p className="mt-4 rounded-xl bg-surface p-3 text-sm text-muted">{table.isActive ? "Ready for a dine-in order" : "Unavailable for new orders"}</p>}<div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3"><Button size="sm" variant="ghost" onClick={() => setDrawer({ mode: "view", id: table.id })}><Eye size={15} /> View</Button>{canManage && <><Button size="sm" variant="ghost" onClick={() => setDrawer({ mode: "edit", id: table.id })}><Edit3 size={15} /> Edit</Button>{table.isActive ? <Button size="sm" variant="ghost" disabled={Boolean(table.openOrder)} onClick={() => setTarget(table)}><PowerOff size={15} /> Deactivate</Button> : <Button size="sm" variant="ghost" disabled={reactivate.isPending} onClick={() => reactivate.mutate({ id: table.id, input: { isActive: true } })}><Power size={15} /> Reactivate</Button>}</>}</div></article>)}</div><Pagination currentPage={tablesQuery.data.meta.currentPage} totalPages={tablesQuery.data.meta.totalPages} totalItems={tablesQuery.data.meta.totalItems} itemName="table" disabled={tablesQuery.isFetching} onPageChange={setPage} /></>}
      </Card>
      <DiningTableDrawer open={drawer !== null} mode={drawer?.mode ?? "view"} tableId={drawer?.id ?? null} canManage={canManage} onClose={() => setDrawer(null)} onEdit={() => setDrawer((value) => value ? { ...value, mode: "edit" } : value)} onDeactivate={setTarget} />
      <ConfirmDialog open={target !== null} title="Deactivate this table?" description={target ? `${target.name} will no longer be available for new dine-in orders.` : ""} confirmLabel="Deactivate table" isLoading={deactivate.isPending} onCancel={() => setTarget(null)} onConfirm={() => target && deactivate.mutate(target.id)} />
    </div>
  );
}

function DebouncedSearch({ value: initial, onSearch }: { value: string; onSearch: (value: string) => void }) {
  const [value, setValue] = useState(initial);
  useEffect(() => { const timer = window.setTimeout(() => onSearch(value), 300); return () => window.clearTimeout(timer); }, [onSearch, value]);
  return <label className="relative"><span className="sr-only">Search tables</span><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} /><input className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft" type="search" placeholder="Search table name" value={value} onChange={(event) => setValue(event.target.value)} /></label>;
}
