import type { Expense } from "@restaurant-management/shared";
import { Plus, ReceiptText, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { useBranches } from "../features/branch/branch-services";
import {
  ExpenseDrawer,
  type ExpenseDrawerMode,
} from "../features/expense/components/ExpenseDrawer";
import { ExpenseList } from "../features/expense/components/ExpenseList";
import { VoidExpenseDialog } from "../features/expense/components/VoidExpenseDialog";
import {
  EXPENSE_CATEGORIES,
  formatExpenseCategory,
  isExpenseCategory,
  isExpenseStatus,
} from "../features/expense/expense-options";
import {
  useExpenses,
  useVoidExpense,
} from "../features/expense/expense-services";
import { isValidExpenseDate } from "../features/expense/expense-validation";
import { getApiErrorMessage } from "../lib/api-error";
import { useAuthStore } from "../store/useAuthStore";

const PAGE_LIMIT = 10;

interface DrawerState {
  mode: ExpenseDrawerMode;
  expenseId: number | null;
}

function ExpenseSearch({
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
    <label className="relative md:col-span-2 xl:col-span-1">
      <span className="sr-only">Search expenses</span>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
      <input
        className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft"
        type="search"
        placeholder="Search title or description"
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

const parseBranchId = (value: string | null) => {
  const branchId = Number(value);
  return Number.isInteger(branchId) && branchId > 0 ? branchId : undefined;
};

const parseDate = (value: string | null) =>
  value && isValidExpenseDate(value) ? value : undefined;

export function ExpensesPage() {
  const actor = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const search = searchParams.get("search")?.trim() ?? "";
  const categoryParam = searchParams.get("category");
  const statusParam = searchParams.get("status");
  const branchParam = searchParams.get("branchId");
  const category = isExpenseCategory(categoryParam) ? categoryParam : undefined;
  const status = isExpenseStatus(statusParam) ? statusParam : "ACTIVE";
  const branchId = parseBranchId(branchParam);
  const dateFrom = parseDate(searchParams.get("dateFrom"));
  const parsedDateTo = parseDate(searchParams.get("dateTo"));
  const dateTo = dateFrom && parsedDateTo && dateFrom > parsedDateTo
    ? undefined
    : parsedDateTo;
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [voidTarget, setVoidTarget] = useState<Expense | null>(null);
  const isBranchManager = actor?.role === "BRANCH_MANAGER";

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      status,
      ...(search && { search }),
      ...(category && { category }),
      ...(!isBranchManager && branchId && { branchId }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    }),
    [branchId, category, dateFrom, dateTo, isBranchManager, page, search, status],
  );
  const expensesQuery = useExpenses(query);
  const branchesQuery = useBranches({ page: 1, limit: 100 });
  const branches = branchesQuery.data?.data ?? [];

  const closeDrawer = () => setDrawer(null);
  const voidMutation = useVoidExpense({
    onSuccess: (expense) => {
      setVoidTarget(null);
      if (drawer?.expenseId === expense.id) closeDrawer();
    },
  });

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
    const totalPages = expensesQuery.data?.meta.totalPages;
    if (!totalPages || page <= totalPages) return;
    const next = new URLSearchParams(searchParams);
    if (totalPages === 1) next.delete("page");
    else next.set("page", totalPages.toString());
    setSearchParams(next, { replace: true });
  }, [expensesQuery.data?.meta.totalPages, page, searchParams, setSearchParams]);

  if (!actor) return null;

  const updateFilter = (
    key: "category" | "status" | "branchId" | "dateFrom" | "dateTo",
    value: string,
  ) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all" || (key === "status" && value === "ACTIVE")) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key === "dateFrom" && value && dateTo && value > dateTo) next.delete("dateTo");
    if (key === "dateTo" && value && dateFrom && value < dateFrom) next.delete("dateFrom");
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const updatePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete("page");
    else next.set("page", nextPage.toString());
    setSearchParams(next);
  };

  const openDrawer = (mode: ExpenseDrawerMode, expenseId: number | null = null) => {
    setDrawer({ mode, expenseId });
  };

  const hasFilters = Boolean(
    search || category || status === "VOIDED" || (!isBranchManager && branchId) || dateFrom || dateTo,
  );
  const expenses = expensesQuery.data?.data ?? [];
  const pendingExpenseId = voidMutation.variables?.id ?? null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Financial tracking"
        title="Expenses"
        description="Record and review restaurant spending with permanent audit history."
        action={
          <Button onClick={() => openDrawer("create")}>
            <Plus size={17} /> Add expense
          </Button>
        }
      />

      <Card className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        <ExpenseSearch key={search} initialValue={search} onSearch={updateSearch} />
        <FilterSelect
          label="Filter by status"
          value={status}
          onChange={(value) => updateFilter("status", value)}
        >
          <option value="ACTIVE">Active expenses</option>
          <option value="VOIDED">Voided expenses</option>
        </FilterSelect>
        <FilterSelect
          label="Filter by category"
          value={category ?? "all"}
          onChange={(value) => updateFilter("category", value)}
        >
          <option value="all">All categories</option>
          {EXPENSE_CATEGORIES.map((item) => (
            <option value={item} key={item}>{formatExpenseCategory(item)}</option>
          ))}
        </FilterSelect>
        {!isBranchManager && (
          <FilterSelect
            label="Filter by branch"
            value={branchId?.toString() ?? "all"}
            disabled={branchesQuery.isPending || branchesQuery.isError}
            onChange={(value) => updateFilter("branchId", value)}
          >
            <option value="all">
              {branchesQuery.isError ? "Branches unavailable" : "All branches"}
            </option>
            {branches.map((branch) => (
              <option value={branch.id} key={branch.id}>
                {branch.name}{branch.isActive ? "" : " (Inactive)"}
              </option>
            ))}
          </FilterSelect>
        )}
        <DateFilter
          label="Expense date from"
          value={dateFrom ?? ""}
          max={dateTo}
          onChange={(value) => updateFilter("dateFrom", value)}
        />
        <DateFilter
          label="Expense date to"
          value={dateTo ?? ""}
          min={dateFrom}
          onChange={(value) => updateFilter("dateTo", value)}
        />
      </Card>

      <Card className="overflow-hidden">
        {expensesQuery.isPending ? (
          <ExpenseListSkeleton />
        ) : expensesQuery.isError ? (
          <ExpenseError
            message={getApiErrorMessage(expensesQuery.error, "Could not load expenses.")}
            onRetry={() => void expensesQuery.refetch()}
          />
        ) : expenses.length === 0 ? (
          <ExpenseEmptyState
            hasFilters={hasFilters}
            onCreate={() => openDrawer("create")}
            onClearFilters={() => setSearchParams({}, { replace: true })}
          />
        ) : (
          <>
            <ExpenseList
              expenses={expenses}
              pendingExpenseId={pendingExpenseId}
              onView={(expense) => openDrawer("view", expense.id)}
              onEdit={(expense) => openDrawer("edit", expense.id)}
              onVoid={setVoidTarget}
            />
            <Pagination
              currentPage={expensesQuery.data.meta.currentPage}
              totalPages={expensesQuery.data.meta.totalPages}
              totalItems={expensesQuery.data.meta.totalItems}
              itemName="expense"
              disabled={expensesQuery.isFetching}
              onPageChange={updatePage}
            />
          </>
        )}
      </Card>

      <ExpenseDrawer
        open={drawer !== null}
        mode={drawer?.mode ?? "view"}
        expenseId={drawer?.expenseId ?? null}
        actor={actor}
        branches={branches}
        branchesLoading={branchesQuery.isPending}
        onClose={closeDrawer}
        onEdit={() =>
          setDrawer((current) => current ? { ...current, mode: "edit" } : current)
        }
        onRequestVoid={setVoidTarget}
      />

      <VoidExpenseDialog
        expense={voidTarget}
        isLoading={voidMutation.isPending}
        onCancel={() => setVoidTarget(null)}
        onConfirm={(reason) => {
          if (voidTarget) voidMutation.mutate({ id: voidTarget.id, reason });
        }}
      />
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
    <label>
      <span className="sr-only">{label}</span>
      <select
        className="min-h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm font-semibold text-ink outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft disabled:cursor-not-allowed disabled:bg-line-soft disabled:text-muted"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function DateFilter({
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
    <label className="grid gap-1">
      <span className="text-[0.68rem] font-extrabold uppercase tracking-wide text-muted">
        {label.replace("Expense date ", "")}
      </span>
      <input
        className="min-h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm font-semibold text-ink outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft"
        type="date"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ExpenseListSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4" aria-label="Loading expenses">
      <div className="h-11 rounded-xl bg-line-soft" />
      {[1, 2, 3, 4].map((item) => (
        <div className="h-20 rounded-xl bg-line-soft" key={item} />
      ))}
    </div>
  );
}

function ExpenseError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-red-soft text-brand-red">
          <RefreshCw size={21} />
        </div>
        <h2 className="mt-4 text-lg font-extrabold">Expenses could not be loaded</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
        <Button className="mt-5" variant="outline" onClick={onRetry}>
          <RefreshCw size={16} /> Retry
        </Button>
      </div>
    </div>
  );
}

function ExpenseEmptyState({
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
          <ReceiptText size={22} />
        </div>
        <h2 className="mt-4 text-lg font-extrabold">
          {hasFilters ? "No matching expenses" : "No expenses recorded yet"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {hasFilters
            ? "Try changing or clearing the current filters."
            : "Record the first expense to begin tracking restaurant spending."}
        </p>
        {hasFilters ? (
          <Button className="mt-5" variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : (
          <Button className="mt-5" onClick={onCreate}>
            <Plus size={16} /> Add expense
          </Button>
        )}
      </div>
    </div>
  );
}
