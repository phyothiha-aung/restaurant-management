import { Building2, Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { canManageBranches } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";

export function BranchesPage() {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  const canManage = canManageBranches(user.role);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Locations"
        title={user.branchId ? "My Branch" : "Branches"}
        description={
          user.branchId
            ? "View the restaurant branch assigned to your account."
            : "Manage Ann Htike restaurant locations and availability."
        }
        action={
          canManage ? (
            <Button>
              <Plus size={17} /> Add branch
            </Button>
          ) : undefined
        }
      />
      <Card className="grid min-h-72 place-items-center p-8 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-red-soft)] text-[var(--brand-red)]">
            <Building2 size={22} />
          </div>
          <h2 className="mt-4 text-lg font-extrabold">Branch details are coming next</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            This page is prepared for branch information, search, status filters, and management forms.
          </p>
        </div>
      </Card>
    </div>
  );
}
