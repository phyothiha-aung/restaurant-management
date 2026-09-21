import type { Branch } from "@restaurant-management/shared";
import { Building2, CalendarClock, MapPin, Phone, Users } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";

interface BranchDetailsProps {
  branch: Branch;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function BranchDetails({ branch }: BranchDetailsProps) {
  const details = [
    { icon: Building2, label: "Branch code", value: branch.branchCode ?? "Not set" },
    { icon: MapPin, label: "Address", value: branch.address ?? "Not set" },
    { icon: Phone, label: "Phone", value: branch.phone ?? "Not set" },
    {
      icon: Users,
      label: "Assigned users",
      value: `${branch.userCount} ${branch.userCount === 1 ? "user" : "users"}`,
    },
    {
      icon: CalendarClock,
      label: "Last updated",
      value: dateFormatter.format(new Date(branch.updatedAt)),
    },
  ];

  return (
    <div>
      <div className="flex items-start justify-between gap-4 rounded-2xl bg-surface p-5">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-brand-red">
            Branch
          </p>
          <h3 className="mt-2 text-xl font-extrabold">{branch.name}</h3>
        </div>
        <Badge tone={branch.isActive ? "success" : "neutral"}>
          {branch.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
      <dl className="mt-5 divide-y divide-line rounded-2xl border border-line">
        {details.map(({ icon: Icon, label, value }) => (
          <div className="flex gap-3 px-4 py-4" key={label}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-red-soft text-brand-red">
              <Icon size={17} />
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-muted">{label}</dt>
              <dd className="mt-1 break-words text-sm font-bold text-ink">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
