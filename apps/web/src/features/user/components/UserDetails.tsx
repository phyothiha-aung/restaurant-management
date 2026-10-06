import type { User, UserStatus } from "@restaurant-management/shared";
import { Badge } from "../../../components/ui/Badge";
import { formatRole } from "../../../lib/user-display";
import { useAppConfig } from "../../app-config/app-config-context";
import { formatTimestamp } from "../../../lib/date-format";

interface UserDetailsProps {
  user: User;
}

const statusTone: Record<UserStatus, "success" | "gold" | "neutral"> = {
  ACTIVE: "success",
  PENDING: "gold",
  INACTIVE: "neutral",
};

export function UserDetails({ user }: UserDetailsProps) {
  const { timeZone } = useAppConfig();
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
        <Detail
          label="Last login"
          value={user.lastLoginAt ? formatTimestamp(user.lastLoginAt, timeZone) : "Never"}
        />
        <Detail label="Created" value={formatTimestamp(user.createdAt, timeZone)} />
        <Detail label="Last updated" value={formatTimestamp(user.updatedAt, timeZone)} />
        <Detail
          label="Verified"
          value={user.verifiedAt ? formatTimestamp(user.verifiedAt, timeZone) : "Not verified"}
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
