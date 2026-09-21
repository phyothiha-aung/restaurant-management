import type { Branch } from "@restaurant-management/shared";
import {
  Edit3,
  Eye,
  MapPin,
  MoreHorizontal,
  Phone,
  Power,
  PowerOff,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";

interface BranchListProps {
  branches: Branch[];
  canManage: boolean;
  pendingBranchId: number | null;
  onView: (branch: Branch) => void;
  onEdit: (branch: Branch) => void;
  onDeactivate: (branch: Branch) => void;
  onReactivate: (branch: Branch) => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export function BranchList({
  branches,
  canManage,
  pendingBranchId,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
}: BranchListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
              <th className="px-5 py-3.5">Branch</th>
              <th className="px-4 py-3.5">Contact</th>
              <th className="px-4 py-3.5">Users</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Updated</th>
              <th className="px-5 py-3.5 text-right">
                <span className="sr-only">Actions</span>
                <MoreHorizontal className="ml-auto" size={17} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {branches.map((branch) => {
              const isPending = pendingBranchId === branch.id;
              return (
                <tr className="transition hover:bg-surface" key={branch.id}>
                  <td className="px-5 py-4">
                    <button className="text-left" onClick={() => onView(branch)}>
                      <span className="block text-sm font-extrabold text-ink">{branch.name}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {branch.branchCode ?? "No branch code"}
                      </span>
                    </button>
                  </td>
                  <td className="max-w-64 px-4 py-4 text-xs text-muted">
                    <span className="block truncate">{branch.address ?? "No address"}</span>
                    <span className="mt-1 block">{branch.phone ?? "No phone"}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-ink">{branch.userCount}</td>
                  <td className="px-4 py-4">
                    <Badge tone={branch.isActive ? "success" : "neutral"}>
                      {branch.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                    {dateFormatter.format(new Date(branch.updatedAt))}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <IconButton label={`View ${branch.name}`} onClick={() => onView(branch)}>
                        <Eye size={16} />
                      </IconButton>
                      {canManage && (
                        <>
                          <IconButton label={`Edit ${branch.name}`} onClick={() => onEdit(branch)}>
                            <Edit3 size={16} />
                          </IconButton>
                          <IconButton
                            label={`${branch.isActive ? "Deactivate" : "Reactivate"} ${branch.name}`}
                            disabled={isPending}
                            onClick={() =>
                              branch.isActive ? onDeactivate(branch) : onReactivate(branch)
                            }
                          >
                            {branch.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                          </IconButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {branches.map((branch) => {
          const isPending = pendingBranchId === branch.id;
          return (
            <article className="rounded-2xl border border-line bg-white p-4" key={branch.id}>
              <div className="flex items-start justify-between gap-3">
                <button className="min-w-0 text-left" onClick={() => onView(branch)}>
                  <h3 className="truncate font-extrabold text-ink">{branch.name}</h3>
                  <p className="mt-1 text-xs text-muted">{branch.branchCode ?? "No branch code"}</p>
                </button>
                <Badge tone={branch.isActive ? "success" : "neutral"}>
                  {branch.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-4 grid gap-2 text-xs text-muted">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 shrink-0" size={14} />
                  <span>{branch.address ?? "No address"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="shrink-0" size={14} /> {branch.phone ?? "No phone"}
                </p>
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <Users className="shrink-0 text-brand-red" size={14} /> {branch.userCount}{" "}
                  {branch.userCount === 1 ? "assigned user" : "assigned users"}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                <Button size="sm" variant="ghost" onClick={() => onView(branch)}>
                  <Eye size={15} /> View
                </Button>
                {canManage && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => onEdit(branch)}>
                      <Edit3 size={15} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={branch.isActive ? "ghost" : "secondary"}
                      disabled={isPending}
                      onClick={() =>
                        branch.isActive ? onDeactivate(branch) : onReactivate(branch)
                      }
                    >
                      {branch.isActive ? <PowerOff size={15} /> : <Power size={15} />}
                      {branch.isActive ? "Deactivate" : "Reactivate"}
                    </Button>
                  </>
                )}
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
