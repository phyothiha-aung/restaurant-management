import { UserPlus, Users } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";

export function UsersPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="People"
        title="Users"
        description="Manage staff accounts, roles, branch assignments, and account status."
        action={
          <Button>
            <UserPlus size={17} /> Add user
          </Button>
        }
      />
      <Card className="grid min-h-72 place-items-center p-8 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-gold-soft text-brand-gold-dark">
            <Users size={22} />
          </div>
          <h2 className="mt-4 text-lg font-extrabold">User management UI is next</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This page is ready for the searchable, filtered user list and account forms.
          </p>
        </div>
      </Card>
    </div>
  );
}
