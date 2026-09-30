import type { User, UserStatus } from "@restaurant-management/shared";
import { Badge } from "../../../components/ui/Badge";
import { formatRole } from "../../../lib/user-display";

interface UserDetailsProps {
  user: User;
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusTone: Record<UserStatus, "success" | "gold" | "neutral"> = {
  ACTIVE: "success",
  PENDING: "gold",
  INACTIVE: "neutral",
};

export function UserDetails({ user }: UserDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-ink">{user.name}</h3>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
          </div>
          <Badge tone={statusTone[user.status]}>{user.status}</Badge>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Detail label="Role" value={formatRole(user.role)} />
        <Detail label="Branch" value={user.branch?.name ?? "Restaurant-wide"} />
        <Detail
          label="Last login"
          value={user.lastLoginAt ? dateTimeFormatter.format(new Date(user.lastLoginAt)) : "Never"}
        />
        <Detail label="Created" value={dateTimeFormatter.format(new Date(user.createdAt))} />
        <Detail label="Last updated" value={dateTimeFormatter.format(new Date(user.updatedAt))} />
        <Detail
          label="Verified"
          value={user.verifiedAt ? dateTimeFormatter.format(new Date(user.verifiedAt)) : "Not verified"}
        />
      </dl>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
