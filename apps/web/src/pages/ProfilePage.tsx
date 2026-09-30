import {
  Building2,
  Edit3,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { ProfileDrawer } from "../features/profile/components/ProfileDrawer";
import { useProfile } from "../features/profile/profile-services";
import { getApiErrorMessage } from "../lib/api-error";
import { formatRole } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";

export function ProfilePage() {
  const storedUser = useAuthStore((state) => state.user);
  const profileQuery = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const user = profileQuery.data ?? storedUser;

  if (!user) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Your account identity and current restaurant access."
        action={
          <div className="flex items-center gap-3">
            <Badge tone={user.status === "ACTIVE" ? "success" : "neutral"}>
              {user.status}
            </Badge>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 size={16} /> Edit profile
            </Button>
          </div>
        }
      />

      {profileQuery.isError && (
        <div className="flex flex-col gap-3 rounded-2xl border border-danger/20 bg-brand-red-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-danger">Profile refresh failed</p>
            <p className="mt-1 text-xs text-muted">
              {getApiErrorMessage(
                profileQuery.error,
                "Showing your last saved profile information.",
              )}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void profileQuery.refetch()}>
            <RefreshCw size={15} /> Retry
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="h-24 bg-brand-red" />
        <div className="px-6 pb-7 sm:px-8">
          <div className="-mt-10 grid h-20 w-20 place-items-center rounded-2xl border-4 border-white bg-brand-gold text-2xl font-extrabold text-gold-ink shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-4 font-heading text-2xl font-bold">{user.name}</h2>
          <p className="mt-1 text-sm text-muted">{formatRole(user.role)}</p>

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

      <ProfileDrawer open={isEditing} user={user} onClose={() => setIsEditing(false)} />
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
    <div className="flex items-center gap-3 rounded-xl border border-line-soft bg-surface p-4">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-brand-red">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className="truncate text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}
