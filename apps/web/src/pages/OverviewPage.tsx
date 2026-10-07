import {
  ArrowRight,
  ChartNoAxesCombined,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  UserPlus,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { canManageUsers, formatRole } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";
import { useProfile } from "../features/profile/profile-services";
import { getApiErrorMessage } from "../lib/api-error";
import { useAppConfig } from "../features/app-config/app-config-context";

export function OverviewPage() {
  const storedUser = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const profileQuery = useProfile();
  const user = profileQuery.data ?? storedUser;
  const navigate = useNavigate();
  const { restaurantName } = useAppConfig();

  useEffect(() => {
    if (profileQuery.data && token) {
      setAuth(profileQuery.data, token);
    }
  }, [profileQuery.data, setAuth, token]);

  if (!user) return null;

  const firstName = user.name.trim().split(/\s+/)[0];
  const managesUsers = canManageUsers(user.role);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description={`Everything you need to get started with your ${restaurantName} workspace.`}
        action={<Badge tone="gold">{formatRole(user.role)}</Badge>}
      />

      {profileQuery.isError && (
        <div className="flex flex-col gap-3 rounded-2xl border border-danger/20 bg-brand-red-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-danger">
              Session check unavailable
            </p>
            <p className="mt-1 text-xs text-muted">
              {getApiErrorMessage(
                profileQuery.error,
                "Could not reach the server. Your saved session is still shown.",
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void profileQuery.refetch()}
          >
            <RefreshCw size={15} /> Retry
          </Button>
        </div>
      )}

      <section className="relative overflow-hidden rounded-2xl bg-brand-red p-6 text-white shadow-card sm:p-8">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-34 border-brand-gold/20" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-brand-gold-pale">
            Your workspace
          </p>
          <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">
            {restaurantName} restaurant operations
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
            Manage orders, the central menu, team access, and restaurant records from one place.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-ink">Quick actions</h2>
            <p className="mt-1 text-sm text-muted">Go directly to your most useful areas.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {managesUsers && (
            <ActionCard
              icon={UserPlus}
              title="Manage users"
              description="Add staff and maintain access roles."
              onClick={() => navigate("/users")}
            />
          )}
          <ActionCard
            icon={ShoppingCart}
            title="Manage orders"
            description="Create orders and review restaurant sales."
            onClick={() => navigate("/orders")}
          />
          <ActionCard
            icon={Users}
            title="My profile"
            description="Review your account and personal information."
            onClick={() => navigate("/profile")}
          />
          {managesUsers && (
            <ActionCard
              icon={UtensilsCrossed}
              title="Manage catalog"
              description="Maintain products, variants, and reusable add-ons."
              onClick={() => navigate("/catalog")}
            />
          )}
          {managesUsers && (
            <ActionCard
              icon={ReceiptText}
              title="Manage expenses"
              description="Record and review restaurant operating costs."
              onClick={() => navigate("/expenses")}
            />
          )}
          {managesUsers && (
            <ActionCard
              icon={ChartNoAxesCombined}
              title="View reports"
              description="Review sales, expenses, and profit performance."
              onClick={() => navigate("/reports")}
            />
          )}
        </div>
      </section>
    </div>
  );
}

interface ActionCardProps {
  icon: typeof Users;
  title: string;
  description: string;
  onClick: () => void;
}

function ActionCard({ icon: Icon, title, description, onClick }: ActionCardProps) {
  return (
    <button className="text-left" onClick={onClick}>
      <Card className="group h-full p-5 transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-lg">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-red-soft text-brand-red">
          <Icon size={19} aria-hidden="true" />
        </div>
        <h3 className="mt-5 font-extrabold text-ink">{title}</h3>
        <p className="mt-1.5 text-sm leading-5 text-muted">{description}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-red">
          Open <ArrowRight className="transition group-hover:translate-x-1" size={14} />
        </span>
      </Card>
    </button>
  );
}
