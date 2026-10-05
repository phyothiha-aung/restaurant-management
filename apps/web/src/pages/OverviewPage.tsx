import { ArrowRight, ShoppingCart, UserPlus, Users, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { canManageUsers, formatRole } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";

export function OverviewPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  if (!user) return null;

  const firstName = user.name.trim().split(/\s+/)[0];
  const managesUsers = canManageUsers(user.role);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="Everything you need to get started with your Ann Htike workspace."
        action={<Badge tone="gold">{formatRole(user.role)}</Badge>}
      />

      <section className="relative overflow-hidden rounded-2xl bg-brand-red p-6 text-white shadow-card sm:p-8">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-34 border-brand-gold/20" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-brand-gold-pale">
            Your workspace
          </p>
          <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">
            Ann Htike restaurant operations
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
