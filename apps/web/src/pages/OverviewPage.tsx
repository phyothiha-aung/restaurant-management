import { ArrowRight, Building2, Check, UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { canManageBranches, canManageUsers, formatRole } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";

export function OverviewPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  if (!user) return null;

  const firstName = user.name.trim().split(/\s+/)[0];
  const managesUsers = canManageUsers(user.role);
  const managesBranches = canManageBranches(user.role);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="Everything you need to get started with your Ann Htike workspace."
        action={<Badge tone="gold">{formatRole(user.role)}</Badge>}
      />

      <section className="relative overflow-hidden rounded-2xl bg-[var(--brand-red)] p-6 text-white shadow-[var(--shadow-card)] sm:p-8">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[34px] border-[var(--brand-gold)]/20" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#ffe6a0]">
            Your workspace
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-bold sm:text-3xl">
            {user.branch?.name ?? "Restaurant-wide access"}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
            {user.branch
              ? "View your branch details and keep your team information up to date."
              : "Manage restaurant branches, team access, and account information from one place."}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Quick actions</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Go directly to your most useful areas.</p>
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
            icon={Building2}
            title={user.branchId ? "View my branch" : "Manage branches"}
            description={
              user.branchId
                ? "Review your assigned branch information."
                : "Review restaurant locations and availability."
            }
            onClick={() => navigate("/branches")}
          />
          <ActionCard
            icon={Users}
            title="My profile"
            description="Review your account and personal information."
            onClick={() => navigate("/profile")}
          />
        </div>
      </section>

      {managesBranches && (
        <Card className="p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <Badge tone="red">Getting started</Badge>
              <h2 className="mt-3 text-lg font-extrabold">Restaurant setup checklist</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                A simple guide for preparing the Ann Htike workspace.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/branches")}>
              Review setup <ArrowRight size={15} />
            </Button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Confirm restaurant branches", "Add branch managers", "Add restaurant staff"].map(
              (item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-[var(--surface)] p-3.5 text-sm font-semibold"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--brand-gold-soft)] text-[var(--brand-gold-dark)]">
                    {index === 0 ? <Check size={15} /> : index + 1}
                  </span>
                  {item}
                </div>
              ),
            )}
          </div>
        </Card>
      )}
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
      <Card className="group h-full p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand-gold)] hover:shadow-lg">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-red-soft)] text-[var(--brand-red)]">
          <Icon size={19} aria-hidden="true" />
        </div>
        <h3 className="mt-5 font-extrabold text-[var(--ink)]">{title}</h3>
        <p className="mt-1.5 text-sm leading-5 text-[var(--muted)]">{description}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--brand-red)]">
          Open <ArrowRight className="transition group-hover:translate-x-1" size={14} />
        </span>
      </Card>
    </button>
  );
}
