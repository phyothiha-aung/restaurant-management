import type { Branch } from "@restaurant-management/shared";
import { Edit3, Power, PowerOff } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { getApiErrorMessage } from "../../../lib/api-error";
import type { CreateBranchInput } from "../branch-api";
import { useBranch, useCreateBranch, useUpdateBranch } from "../branch-services";
import { BranchDetails } from "./BranchDetails";
import { BranchForm } from "./BranchForm";

export type BranchDrawerMode = "create" | "view" | "edit";

interface BranchDrawerProps {
  open: boolean;
  mode: BranchDrawerMode;
  branchId: number | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRequestDeactivate: (branch: Branch) => void;
}

export function BranchDrawer({
  open,
  mode,
  branchId,
  canManage,
  onClose,
  onEdit,
  onRequestDeactivate,
}: BranchDrawerProps) {
  const detail = useBranch(mode === "create" || !open ? null : branchId);
  const createMutation = useCreateBranch({ onSuccess: onClose });
  const updateMutation = useUpdateBranch({ onSuccess: onClose });
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const branch = detail.data;

  const title =
    mode === "create" ? "Add branch" : mode === "edit" ? "Edit branch" : "Branch details";
  const description =
    mode === "create"
      ? "Create a new Ann Htike restaurant location."
      : mode === "edit"
        ? "Update this branch's contact details and availability."
        : "Review the branch and its assigned staff count.";

  const handleSubmit = (input: CreateBranchInput) => {
    if (mode === "create") {
      createMutation.mutate(input);
      return;
    }

    if (branchId) updateMutation.mutate({ id: branchId, input });
  };

  const handleClose = () => {
    if (!isSaving) onClose();
  };

  const footer =
    mode === "view" && branch && canManage ? (
      <div className="flex flex-wrap justify-end gap-3">
        {branch.isActive ? (
          <Button variant="danger" onClick={() => onRequestDeactivate(branch)}>
            <PowerOff size={16} /> Deactivate
          </Button>
        ) : (
          <Button
            variant="secondary"
            isLoading={updateMutation.isPending}
            loadingLabel="Reactivating..."
            onClick={() => updateMutation.mutate({ id: branch.id, input: { isActive: true } })}
          >
            <Power size={16} /> Reactivate
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
        <BranchForm
          isLoading={createMutation.isPending}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      ) : detail.isPending ? (
        <BranchDrawerSkeleton />
      ) : detail.isError ? (
        <div className="rounded-2xl border border-danger/20 bg-brand-red-soft p-5">
          <p className="font-bold text-danger">Could not load this branch</p>
          <p className="mt-1 text-sm text-muted">
            {getApiErrorMessage(detail.error, "Please try again.")}
          </p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => void detail.refetch()}>
            Retry
          </Button>
        </div>
      ) : branch && mode === "edit" ? (
        <BranchForm
          branch={branch}
          isLoading={updateMutation.isPending}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      ) : branch ? (
        <BranchDetails branch={branch} />
      ) : null}
    </Drawer>
  );
}

function BranchDrawerSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading branch details">
      <div className="h-28 rounded-2xl bg-line-soft" />
      {[1, 2, 3, 4].map((item) => (
        <div className="h-16 rounded-xl bg-line-soft" key={item} />
      ))}
    </div>
  );
}
