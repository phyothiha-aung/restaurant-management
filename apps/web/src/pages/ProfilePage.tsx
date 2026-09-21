import { Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { formatRole } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Your account identity and current restaurant access."
        action={<Badge tone={user.status === "ACTIVE" ? "success" : "neutral"}>{user.status}</Badge>}
      />
      <Card className="overflow-hidden">
        <div className="h-24 bg-[var(--brand-red)]" />
        <div className="px-6 pb-7 sm:px-8">
          <div className="-mt-10 grid h-20 w-20 place-items-center rounded-2xl border-4 border-white bg-[var(--brand-gold)] text-2xl font-extrabold text-[#3b2b08] shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-heading)] text-2xl font-bold">{user.name}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{formatRole(user.role)}</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <ProfileDetail icon={Mail} label="Email" value={user.email ?? "Not available"} />
            <ProfileDetail icon={ShieldCheck} label="Role" value={formatRole(user.role)} />
            <ProfileDetail
              icon={Building2}
              label="Branch"
              value={user.branch?.name ?? "Restaurant-wide access"}
            />
            <ProfileDetail icon={UserRound} label="Account status" value={user.status} />
          </div>
        </div>
      </Card>
    </div>
  );
}

interface ProfileDetailProps {
  icon: typeof Mail;
  label: string;
  value: string;
}

function ProfileDetail({ icon: Icon, label, value }: ProfileDetailProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] p-4">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[var(--brand-red)]">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--muted)]">{label}</p>
        <p className="truncate text-sm font-bold text-[var(--ink)]">{value}</p>
      </div>
    </div>
  );
}
