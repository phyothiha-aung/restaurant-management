import type { User } from "@restaurant-management/shared";
import { RefreshCw, Search, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { useBranches } from "../features/branch/branch-services";
import {
  UserDrawer,
  type UserDrawerMode,
} from "../features/user/components/UserDrawer";
import { UserList } from "../features/user/components/UserList";
import {
  getManageableRoles,
  isUserRole,
  isUserStatus,
} from "../features/user/user-options";
import {
  useDeactivateUser,
  useUpdateUser,
  useUsers,
} from "../features/user/user-services";
import { getApiErrorMessage } from "../lib/api-error";
import { formatRole } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";

const PAGE_LIMIT = 10;

interface DrawerState {
  mode: UserDrawerMode;
  userId: number | null;
}

interface UserSearchProps {
  initialValue: string;
  onSearch: (value: string) => void;
}

function UserSearch({ initialValue, onSearch }: UserSearchProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timer = window.setTimeout(() => onSearch(value.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [onSearch, value]);

  return (
    <label className="relative md:col-span-2 xl:col-span-1">
      <span className="sr-only">Search users</span>
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        size={17}
      />
      <input
        className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft"
        type="search"
        placeholder="Search name or email"
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

export function UsersPage() {
  const actor = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const search = searchParams.get("search")?.trim() ?? "";
  const roleParam = searchParams.get("role");
  const statusParam = searchParams.get("status");
  const branchParam = searchParams.get("branchId");
  const role = isUserRole(roleParam) ? roleParam : undefined;
  const status = isUserStatus(statusParam) ? statusParam : undefined;
  const branchId = parseBranchId(branchParam);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);

  const manageableRoles = useMemo(
    () => (actor ? getManageableRoles(actor.role) : []),
    [actor],
  );
  const query = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      ...(search && { search }),
      ...(role && { role }),
      ...(status && { status }),
      ...(branchId && { branchId }),
    }),
    [branchId, page, role, search, status],
  );
  const usersQuery = useUsers(query);
  const branchesQuery = useBranches({ page: 1, limit: 100 });
  const branches = branchesQuery.data?.data ?? [];

  const closeDrawer = () => setDrawer(null);
  const deactivateMutation = useDeactivateUser({
    onSuccess: (updatedUser) => {
      setDeactivateTarget(null);
      if (drawer?.userId === updatedUser.id) closeDrawer();
    },
  });
  const reactivateMutation = useUpdateUser();

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
    const totalPages = usersQuery.data?.meta.totalPages;
    if (!totalPages || page <= totalPages) return;
    const next = new URLSearchParams(searchParams);
    if (totalPages === 1) next.delete("page");
    else next.set("page", totalPages.toString());
    setSearchParams(next, { replace: true });
  }, [page, searchParams, setSearchParams, usersQuery.data?.meta.totalPages]);

  if (!actor) return null;

  const updateFilter = (key: "role" | "status" | "branchId", value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const updatePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete("page");
    else next.set("page", nextPage.toString());
    setSearchParams(next);
  };

  const openDrawer = (mode: UserDrawerMode, userId: number | null = null) => {
    setDrawer({ mode, userId });
  };

  const hasFilters = Boolean(search || role || status || branchId);
  const users = usersQuery.data?.data ?? [];
  const pendingUserId =
    deactivateMutation.variables ?? reactivateMutation.variables?.id ?? null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="People"
        title="Users"
        description="Manage staff accounts, roles, branch assignments, and account status."
        action={
          <Button onClick={() => openDrawer("create")}>
            <UserPlus size={17} /> Add user
          </Button>
        }
      />

      <Card className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        <UserSearch key={search} initialValue={search} onSearch={updateSearch} />
        <FilterSelect
          label="Filter by role"
          value={role ?? "all"}
          onChange={(value) => updateFilter("role", value)}
        >
          <option value="all">All roles</option>
          {manageableRoles.map((item) => (
            <option value={item} key={item}>{formatRole(item)}</option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Filter by status"
          value={status ?? "all"}
          onChange={(value) => updateFilter("status", value)}
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="INACTIVE">Inactive</option>
        </FilterSelect>
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
      </Card>

      <Card className="overflow-hidden">
        {usersQuery.isPending ? (
          <UserListSkeleton />
        ) : usersQuery.isError ? (
          <UserError
            message={getApiErrorMessage(usersQuery.error, "Could not load users.")}
            onRetry={() => void usersQuery.refetch()}
          />
        ) : users.length === 0 ? (
          <UserEmptyState
            hasFilters={hasFilters}
            onCreate={() => openDrawer("create")}
            onClearFilters={() => setSearchParams({}, { replace: true })}
          />
        ) : (
          <>
            <UserList
              users={users}
              pendingUserId={pendingUserId}
              onView={(user) => openDrawer("view", user.id)}
              onEdit={(user) => openDrawer("edit", user.id)}
              onDeactivate={setDeactivateTarget}
              onReactivate={(user) =>
                reactivateMutation.mutate({ id: user.id, input: { status: "ACTIVE" } })
              }
            />
            <Pagination
              currentPage={usersQuery.data.meta.currentPage}
              totalPages={usersQuery.data.meta.totalPages}
              totalItems={usersQuery.data.meta.totalItems}
              itemName="user"
              disabled={usersQuery.isFetching}
              onPageChange={updatePage}
            />
          </>
        )}
      </Card>

      <UserDrawer
        open={drawer !== null}
        mode={drawer?.mode ?? "view"}
        userId={drawer?.userId ?? null}
        actorRole={actor.role}
        branches={branches}
        branchesLoading={branchesQuery.isPending}
        onClose={closeDrawer}
        onEdit={() =>
          setDrawer((current) => current ? { ...current, mode: "edit" } : current)
        }
        onRequestDeactivate={setDeactivateTarget}
      />

      <ConfirmDialog
        open={deactivateTarget !== null}
        title="Deactivate user?"
        description={
          deactivateTarget
            ? `${deactivateTarget.name} will immediately lose access, and all refresh tokens for this account will be revoked.`
            : ""
        }
        confirmLabel="Deactivate user"
        isLoading={deactivateMutation.isPending}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) deactivateMutation.mutate(deactivateTarget.id);
        }}
      />
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, disabled, children, onChange }: FilterSelectProps) {
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

function UserListSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4" aria-label="Loading users">
      <div className="h-11 rounded-xl bg-line-soft" />
      {[1, 2, 3, 4].map((item) => (
        <div className="h-20 rounded-xl bg-line-soft" key={item} />
      ))}
    </div>
  );
}

function UserError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-red-soft text-brand-red">
          <RefreshCw size={21} />
        </div>
        <h2 className="mt-4 text-lg font-extrabold">Users could not be loaded</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
        <Button className="mt-5" variant="outline" onClick={onRetry}>
          <RefreshCw size={16} /> Retry
        </Button>
      </div>
    </div>
  );
}

function UserEmptyState({
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
          <Users size={22} />
        </div>
        <h2 className="mt-4 text-lg font-extrabold">
          {hasFilters ? "No matching users" : "No manageable users yet"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {hasFilters
            ? "Try changing or clearing the current filters."
            : "Create the first staff account available to your role."}
        </p>
        {hasFilters ? (
          <Button className="mt-5" variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : (
          <Button className="mt-5" onClick={onCreate}>
            <UserPlus size={16} /> Add user
          </Button>
        )}
      </div>
    </div>
  );
}
