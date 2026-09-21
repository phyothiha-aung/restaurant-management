import type { Branch } from "@restaurant-management/shared";
import { Building2, Plus, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import {
  BranchDrawer,
  type BranchDrawerMode,
} from "../features/branch/components/BranchDrawer";
import { BranchList } from "../features/branch/components/BranchList";
import {
  useBranches,
  useDeactivateBranch,
  useUpdateBranch,
} from "../features/branch/branch-services";
import { getApiErrorMessage } from "../lib/api-error";
import { canManageBranches } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";

const PAGE_LIMIT = 10;

interface DrawerState {
  mode: BranchDrawerMode;
  branchId: number | null;
}

interface BranchSearchProps {
  initialValue: string;
  onSearch: (value: string) => void;
}

function BranchSearch({ initialValue, onSearch }: BranchSearchProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timer = window.setTimeout(() => onSearch(value.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [onSearch, value]);

  return (
    <label className="relative flex-1">
      <span className="sr-only">Search branches</span>
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        size={17}
      />
      <input
        className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft"
        type="search"
        placeholder="Search name, code, address, or phone"
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

export function BranchesPage() {
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const search = searchParams.get("search")?.trim() ?? "";
  const activeParam = searchParams.get("isActive");
  const isActive = activeParam === "true" ? true : activeParam === "false" ? false : undefined;
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Branch | null>(null);

  const canManage = user ? canManageBranches(user.role) : false;
  const query = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      ...(search && { search }),
      ...(isActive !== undefined && { isActive }),
    }),
    [isActive, page, search],
  );
  const branchesQuery = useBranches(query);

  const closeDrawer = () => setDrawer(null);
  const deactivateMutation = useDeactivateBranch({
    onSuccess: (branch) => {
      setDeactivateTarget(null);
      if (drawer?.branchId === branch.id) closeDrawer();
    },
  });
  const reactivateMutation = useUpdateBranch();

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
    const totalPages = branchesQuery.data?.meta.totalPages;
    if (!totalPages || page <= totalPages) return;

    const next = new URLSearchParams(searchParams);
    if (totalPages === 1) next.delete("page");
    else next.set("page", totalPages.toString());
    setSearchParams(next, { replace: true });
  }, [branchesQuery.data?.meta.totalPages, page, searchParams, setSearchParams]);

  if (!user) return null;

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

  const openDrawer = (mode: BranchDrawerMode, branchId: number | null = null) => {
    setDrawer({ mode, branchId });
  };

  const hasFilters = Boolean(search || activeParam);
  const branches = branchesQuery.data?.data ?? [];
  const pendingBranchId =
    deactivateMutation.variables ?? reactivateMutation.variables?.id ?? null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Locations"
        title={user.branchId ? "My Branch" : "Branches"}
        description={
          user.branchId
            ? "View the restaurant branch assigned to your account."
            : "Manage Ann Htike restaurant locations, availability, and assigned staff."
        }
        action={
          canManage ? (
            <Button onClick={() => openDrawer("create")}>
              <Plus size={17} /> Add branch
            </Button>
          ) : undefined
        }
      />

      {canManage && (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <BranchSearch key={search} initialValue={search} onSearch={updateSearch} />
          <label>
            <span className="sr-only">Filter by status</span>
            <select
              className="min-h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm font-semibold text-ink outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft sm:w-40"
              value={activeParam ?? "all"}
              onChange={(event) => updateStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
        </Card>
      )}

      <Card className="overflow-hidden">
        {branchesQuery.isPending ? (
          <BranchListSkeleton />
        ) : branchesQuery.isError ? (
          <BranchError
            message={getApiErrorMessage(branchesQuery.error, "Could not load branches.")}
            onRetry={() => void branchesQuery.refetch()}
          />
        ) : branches.length === 0 ? (
          <BranchEmptyState
            canManage={canManage}
            hasFilters={hasFilters}
            onCreate={() => openDrawer("create")}
            onClearFilters={() => {
              setSearchParams({}, { replace: true });
            }}
          />
        ) : (
          <>
            <BranchList
              branches={branches}
              canManage={canManage}
              pendingBranchId={pendingBranchId}
              onView={(branch) => openDrawer("view", branch.id)}
              onEdit={(branch) => openDrawer("edit", branch.id)}
              onDeactivate={setDeactivateTarget}
              onReactivate={(branch) =>
                reactivateMutation.mutate({ id: branch.id, input: { isActive: true } })
              }
            />
            <Pagination
              currentPage={branchesQuery.data.meta.currentPage}
              totalPages={branchesQuery.data.meta.totalPages}
              totalItems={branchesQuery.data.meta.totalItems}
              itemName="branch"
              disabled={branchesQuery.isFetching}
              onPageChange={updatePage}
            />
          </>
        )}
      </Card>

      <BranchDrawer
        open={drawer !== null}
        mode={drawer?.mode ?? "view"}
        branchId={drawer?.branchId ?? null}
        canManage={canManage}
        onClose={closeDrawer}
        onEdit={() =>
          setDrawer((current) =>
            current ? { ...current, mode: "edit" } : current,
          )
        }
        onRequestDeactivate={setDeactivateTarget}
      />

      <ConfirmDialog
        open={deactivateTarget !== null}
        title="Deactivate branch?"
        description={
          deactivateTarget
            ? `${deactivateTarget.name} has ${deactivateTarget.userCount} assigned ${
                deactivateTarget.userCount === 1 ? "user" : "users"
              }. They will lose access and their refresh tokens will be revoked.`
            : ""
        }
        confirmLabel="Deactivate branch"
        isLoading={deactivateMutation.isPending}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) deactivateMutation.mutate(deactivateTarget.id);
        }}
      />
    </div>
  );
}

function BranchListSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4" aria-label="Loading branches">
      <div className="h-11 rounded-xl bg-line-soft" />
      {[1, 2, 3, 4].map((item) => (
        <div className="h-20 rounded-xl bg-line-soft" key={item} />
      ))}
    </div>
  );
}

interface BranchErrorProps {
  message: string;
  onRetry: () => void;
}

function BranchError({ message, onRetry }: BranchErrorProps) {
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-red-soft text-brand-red">
          <RefreshCw size={21} />
        </div>
        <h2 className="mt-4 text-lg font-extrabold">Branches could not be loaded</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
        <Button className="mt-5" variant="outline" onClick={onRetry}>
          <RefreshCw size={16} /> Retry
        </Button>
      </div>
    </div>
  );
}

interface BranchEmptyStateProps {
  canManage: boolean;
  hasFilters: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
}

function BranchEmptyState({
  canManage,
  hasFilters,
  onCreate,
  onClearFilters,
}: BranchEmptyStateProps) {
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-gold-soft text-brand-gold-dark">
          <Building2 size={22} />
        </div>
        <h2 className="mt-4 text-lg font-extrabold">
          {hasFilters ? "No matching branches" : "No branches yet"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {hasFilters
            ? "Try changing or clearing the current filters."
            : canManage
              ? "Add the first Ann Htike restaurant location to get started."
              : "No branch is currently assigned to your account."}
        </p>
        {hasFilters ? (
          <Button className="mt-5" variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : canManage ? (
          <Button className="mt-5" onClick={onCreate}>
            <Plus size={16} /> Add branch
          </Button>
        ) : null}
      </div>
    </div>
  );
}
