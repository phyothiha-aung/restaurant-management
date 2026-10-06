import { ClipboardList, Plus, RefreshCw } from "lucide-react";
import type { OrderType } from "@restaurant-management/shared";
import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { useDiningTables } from "../features/dining-table/dining-table-services";
import { OrderList } from "../features/order/components/OrderList";
import { useOrders } from "../features/order/order-services";
import { isOrderStatus } from "../features/order/order-utils";
import { getApiErrorMessage } from "../lib/api-error";
import { canOperateOrders } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";

const PAGE_LIMIT = 10;

const parsePositiveInt = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const parseDate = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? undefined
    : value;
};

export function OrdersPage() {
  const actor = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const page = parsePositiveInt(params.get("page")) ?? 1;
  const statusParam = params.get("status");
  const status = isOrderStatus(statusParam) ? statusParam : undefined;
  const orderTypeParam = params.get("orderType");
  const orderType: OrderType | undefined =
    orderTypeParam === "DINE_IN" || orderTypeParam === "TAKEAWAY"
      ? orderTypeParam
      : undefined;
  const tableId = parsePositiveInt(params.get("tableId"));
  const dateFrom = parseDate(params.get("dateFrom"));
  const parsedDateTo = parseDate(params.get("dateTo"));
  const dateTo = dateFrom && parsedDateTo && dateFrom > parsedDateTo
    ? undefined
    : parsedDateTo;
  const canOperate = actor ? canOperateOrders(actor.role) : false;

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      ...(status && { status }),
      ...(orderType && { orderType }),
      ...(tableId && { tableId }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    }),
    [dateFrom, dateTo, orderType, page, status, tableId],
  );
  const ordersQuery = useOrders(query);
  const tablesQuery = useDiningTables({ page: 1, limit: 100 });

  useEffect(() => {
    const totalPages = ordersQuery.data?.meta.totalPages;
    if (!totalPages || page <= totalPages) return;
    const next = new URLSearchParams(params);
    if (totalPages <= 1) next.delete("page");
    else next.set("page", String(totalPages));
    setParams(next, { replace: true });
  }, [ordersQuery.data?.meta.totalPages, page, params, setParams]);

  if (!actor) return null;

  const setFilter = (
    key: "status" | "orderType" | "tableId" | "dateFrom" | "dateTo",
    value: string,
  ) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    if (key === "dateFrom" && value && dateTo && value > dateTo)
      next.delete("dateTo");
    if (key === "dateTo" && value && dateFrom && value < dateFrom)
      next.delete("dateFrom");
    next.delete("page");
    setParams(next, { replace: true });
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    if (nextPage <= 1) next.delete("page");
    else next.set("page", String(nextPage));
    setParams(next);
  };

  const orders = ordersQuery.data?.data ?? [];
  const hasFilters = Boolean(status || orderType || tableId || dateFrom || dateTo);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales workspace"
        title="Orders"
        description="Create orders and review their complete sales history."
        action={
          canOperate ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red px-4 text-sm font-bold text-white shadow-sm transition hover:bg-brand-red-dark"
              to="/orders/new"
            >
              <Plus size={17} /> New order
            </Link>
          ) : undefined
        }
      />

      <Card className="grid items-end gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
        <FilterSelect
          label="Order status"
          value={status ?? "all"}
          onChange={(value) => setFilter("status", value)}
        >
          <option value="all">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </FilterSelect>
        <FilterSelect
          label="Order type"
          value={orderType ?? "all"}
          onChange={(value) => setFilter("orderType", value)}
        >
          <option value="all">All order types</option>
          <option value="DINE_IN">Dine in</option>
          <option value="TAKEAWAY">Takeaway</option>
        </FilterSelect>
        <FilterSelect
          label="Table"
          value={tableId?.toString() ?? "all"}
          disabled={tablesQuery.isPending || tablesQuery.isError}
          onChange={(value) => setFilter("tableId", value)}
        >
          <option value="all">All tables</option>
          {(tablesQuery.data?.data ?? []).map((table) => (
            <option value={table.id} key={table.id}>{table.name}</option>
          ))}
        </FilterSelect>
        <DateInput
          label="Created from"
          value={dateFrom ?? ""}
          max={dateTo}
          onChange={(value) => setFilter("dateFrom", value)}
        />
        <DateInput
          label="Created to"
          value={dateTo ?? ""}
          min={dateFrom}
          onChange={(value) => setFilter("dateTo", value)}
        />
      </Card>

      <Card className="overflow-hidden">
        {ordersQuery.isPending ? (
          <LoadingState />
        ) : ordersQuery.isError ? (
          <ErrorState
            message={getApiErrorMessage(ordersQuery.error, "Could not load orders.")}
            onRetry={() => void ordersQuery.refetch()}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            filtered={hasFilters}
            canOperate={canOperate}
            onClear={() => setParams({}, { replace: true })}
          />
        ) : (
          <>
            <OrderList orders={orders} canOperate={canOperate} />
            <Pagination
              currentPage={ordersQuery.data.meta.currentPage}
              totalPages={ordersQuery.data.meta.totalPages}
              totalItems={ordersQuery.data.meta.totalItems}
              itemName="order"
              disabled={ordersQuery.isFetching}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  disabled,
  children,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[0.68rem] font-extrabold uppercase tracking-wide text-muted">
        {label}
      </span>
      <select
        className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft disabled:bg-line-soft"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function DateInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[0.68rem] font-extrabold uppercase tracking-wide text-muted">
        {label}
      </span>
      <input
        className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft"
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-3 p-4" aria-label="Loading orders">
      {[1, 2, 3, 4, 5].map((item) => (
        <div className="h-20 rounded-xl bg-line-soft" key={item} />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div className="max-w-md">
        <RefreshCw className="mx-auto text-brand-red" size={23} />
        <h2 className="mt-4 text-lg font-extrabold">Orders could not be loaded</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <Button className="mt-5" variant="outline" onClick={onRetry}>
          <RefreshCw size={16} /> Retry
        </Button>
      </div>
    </div>
  );
}

function EmptyState({
  filtered,
  canOperate,
  onClear,
}: {
  filtered: boolean;
  canOperate: boolean;
  onClear: () => void;
}) {
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div className="max-w-md">
        <ClipboardList className="mx-auto text-brand-gold-dark" size={26} />
        <h2 className="mt-4 text-lg font-extrabold">
          {filtered ? "No matching orders" : "No orders yet"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {filtered
            ? "Try changing or clearing the current filters."
            : "New orders will appear here as staff create them."}
        </p>
        {filtered ? (
          <Button className="mt-5" variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        ) : canOperate ? (
          <Link
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-red px-4 text-sm font-bold text-white"
            to="/orders/new"
          >
            <Plus size={16} /> Create first order
          </Link>
        ) : null}
      </div>
    </div>
  );
}
