import type { Branch, User, UserRole } from "@restaurant-management/shared";
import { Edit3, Power, PowerOff } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { getApiErrorMessage } from "../../../lib/api-error";
import {
  useCreateUser,
  useUpdateUser,
  useUser,
} from "../user-services";
import { UserDetails } from "./UserDetails";
import { UserForm, type UserFormSubmission } from "./UserForm";

export type UserDrawerMode = "create" | "view" | "edit";

interface UserDrawerProps {
  open: boolean;
  mode: UserDrawerMode;
  userId: number | null;
  actorRole: UserRole;
  branches: Branch[];
  branchesLoading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRequestDeactivate: (user: User) => void;
}

export function UserDrawer({
  open,
  mode,
  userId,
  actorRole,
  branches,
  branchesLoading,
  onClose,
  onEdit,
  onRequestDeactivate,
}: UserDrawerProps) {
  const detail = useUser(mode === "create" || !open ? null : userId);
  const createMutation = useCreateUser({ onSuccess: onClose });
  const updateMutation = useUpdateUser({ onSuccess: onClose });
  const user = detail.data;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const title = mode === "create" ? "Add user" : mode === "edit" ? "Edit user" : "User details";
  const description =
    mode === "create"
      ? "Create a staff account and assign its access level."
      : mode === "edit"
        ? "Update account details, access, and branch assignment."
        : "Review this account's access and recent activity.";

  const handleSubmit = (input: UserFormSubmission) => {
    if (mode === "create") {
      if (!input.password) return;
      createMutation.mutate({ ...input, password: input.password });
      return;
    }

    if (userId) updateMutation.mutate({ id: userId, input });
  };

  const handleClose = () => {
    if (!isSaving) onClose();
  };

  const footer = mode === "view" && user ? (
    <div className="flex flex-wrap justify-end gap-3">
      {user.status === "INACTIVE" ? (
        <Button
          variant="secondary"
          isLoading={updateMutation.isPending}
          loadingLabel="Reactivating..."
          onClick={() => updateMutation.mutate({ id: user.id, input: { status: "ACTIVE" } })}
        >
          <Power size={16} /> Reactivate
        </Button>
      ) : (
        <Button variant="danger" onClick={() => onRequestDeactivate(user)}>
          <PowerOff size={16} /> Deactivate
        </Button>
      )}
      <Button variant="outline" onClick={onEdit}>
        <Edit3 size={16} /> Edit
      </Button>
    </div>
  ) : undefined;

  return (
    <Drawer
      open={open}
      title={title}
      description={description}
      footer={footer}
      onClose={handleClose}
    >
      {mode === "create" ? (
        <UserForm
          actorRole={actorRole}
          branches={branches}
          branchesLoading={branchesLoading}
          isLoading={createMutation.isPending}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      ) : detail.isPending ? (
        <UserDrawerSkeleton />
      ) : detail.isError ? (
        <div className="rounded-2xl border border-danger/20 bg-brand-red-soft p-5">
          <p className="font-bold text-danger">Could not load this user</p>
          <p className="mt-1 text-sm text-muted">
            {getApiErrorMessage(detail.error, "Please try again.")}
          </p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => void detail.refetch()}>
            Retry
          </Button>
        </div>
      ) : user && mode === "edit" ? (
        <UserForm
          actorRole={actorRole}
          branches={branches}
          branchesLoading={branchesLoading}
          user={user}
          isLoading={updateMutation.isPending}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      ) : user ? (
        <UserDetails user={user} />
      ) : null}
    </Drawer>
  );
}

function UserDrawerSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading user details">
      <div className="h-28 rounded-2xl bg-line-soft" />
      {[1, 2, 3, 4].map((item) => (
        <div className="h-16 rounded-xl bg-line-soft" key={item} />
      ))}
    </div>
  );
}
