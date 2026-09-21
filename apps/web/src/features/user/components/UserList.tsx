import type { User, UserStatus } from "@restaurant-management/shared";
import {
  Building2,
  Edit3,
  Eye,
  Mail,
  MoreHorizontal,
  Power,
  PowerOff,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { formatRole } from "../../../lib/user-display";

interface UserListProps {
  users: User[];
  pendingUserId: number | null;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
  onReactivate: (user: User) => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const statusTone: Record<UserStatus, "success" | "gold" | "neutral"> = {
  ACTIVE: "success",
  PENDING: "gold",
  INACTIVE: "neutral",
};

export function UserList({
  users,
  pendingUserId,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
}: UserListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
              <th className="px-5 py-3.5">User</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5">Branch</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Last login</th>
              <th className="px-4 py-3.5">Updated</th>
              <th className="px-5 py-3.5 text-right">
                <span className="sr-only">Actions</span>
                <MoreHorizontal className="ml-auto" size={17} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => {
              const isPending = pendingUserId === user.id;
              return (
                <tr className="transition hover:bg-surface" key={user.id}>
                  <td className="px-5 py-4">
                    <button className="text-left" onClick={() => onView(user)}>
                      <span className="block text-sm font-extrabold text-ink">{user.name}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {user.email ?? "No email"}
                      </span>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold text-ink">
                    {formatRole(user.role)}
                  </td>
                  <td className="max-w-48 px-4 py-4 text-xs text-muted">
                    <span className="block truncate">
                      {user.branch?.name ?? "Restaurant-wide"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={statusTone[user.status]}>{user.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                    {user.lastLoginAt ? dateFormatter.format(new Date(user.lastLoginAt)) : "Never"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                    {dateFormatter.format(new Date(user.updatedAt))}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <IconButton label={`View ${user.name}`} onClick={() => onView(user)}>
                        <Eye size={16} />
                      </IconButton>
                      <IconButton label={`Edit ${user.name}`} onClick={() => onEdit(user)}>
                        <Edit3 size={16} />
                      </IconButton>
                      <IconButton
                        label={`${user.status === "INACTIVE" ? "Reactivate" : "Deactivate"} ${user.name}`}
                        disabled={isPending}
                        onClick={() =>
                          user.status === "INACTIVE"
                            ? onReactivate(user)
                            : onDeactivate(user)
                        }
                      >
                        {user.status === "INACTIVE" ? (
                          <Power size={16} />
                        ) : (
                          <PowerOff size={16} />
                        )}
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {users.map((user) => {
          const isPending = pendingUserId === user.id;
          return (
            <article className="rounded-2xl border border-line bg-white p-4" key={user.id}>
              <div className="flex items-start justify-between gap-3">
                <button className="min-w-0 text-left" onClick={() => onView(user)}>
                  <h3 className="truncate font-extrabold text-ink">{user.name}</h3>
                  <p className="mt-1 truncate text-xs text-muted">{user.email ?? "No email"}</p>
                </button>
                <Badge tone={statusTone[user.status]}>{user.status}</Badge>
              </div>
              <div className="mt-4 grid gap-2 text-xs text-muted">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <ShieldCheck className="shrink-0 text-brand-red" size={14} />
                  {formatRole(user.role)}
                </p>
                <p className="flex items-center gap-2">
                  <Building2 className="shrink-0" size={14} />
                  {user.branch?.name ?? "Restaurant-wide"}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="shrink-0" size={14} />
                  Last login: {user.lastLoginAt ? dateFormatter.format(new Date(user.lastLoginAt)) : "Never"}
                </p>
                <p>Updated {dateFormatter.format(new Date(user.updatedAt))}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                <Button size="sm" variant="ghost" onClick={() => onView(user)}>
                  <Eye size={15} /> View
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onEdit(user)}>
                  <Edit3 size={15} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant={user.status === "INACTIVE" ? "secondary" : "ghost"}
                  disabled={isPending}
                  onClick={() =>
                    user.status === "INACTIVE" ? onReactivate(user) : onDeactivate(user)
                  }
                >
                  {user.status === "INACTIVE" ? <Power size={15} /> : <PowerOff size={15} />}
                  {user.status === "INACTIVE" ? "Reactivate" : "Deactivate"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

interface IconButtonProps {
  label: string;
  disabled?: boolean;
  children: ReactNode;
  onClick: () => void;
}

function IconButton({ label, disabled, children, onClick }: IconButtonProps) {
  return (
    <button
      className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-line-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
