import { zodResolver } from "@hookform/resolvers/zod";
import type {
  Branch,
  User,
  UserRole,
  UserStatus,
} from "@restaurant-management/shared";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import {
  InputField,
  SelectField,
} from "../../../components/ui/FormField";
import { formatRole } from "../../../lib/user-display";
import {
  getManageableRoles,
  isGlobalUserRole,
} from "../user-options";
import {
  createUserFormSchema,
  type UserFormValues,
} from "../user-validation";

export interface UserFormSubmission {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  branchId: number | null;
}

interface UserFormProps {
  actorRole: UserRole;
  branches: Branch[];
  branchesLoading: boolean;
  user?: User;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (input: UserFormSubmission) => void;
}

const getDefaultValues = (
  manageableRoles: UserRole[],
  branches: Branch[],
  user?: User,
): UserFormValues => {
  const role = user?.role ?? manageableRoles[0] ?? "WAITER";
  const firstActiveBranch = branches.find((branch) => branch.isActive);
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role,
    status: user?.status ?? "PENDING",
    branchId: user?.branchId?.toString() ??
      (!isGlobalUserRole(role) && firstActiveBranch
        ? firstActiveBranch.id.toString()
        : ""),
  };
};

export function UserForm({
  actorRole,
  branches,
  branchesLoading,
  user,
  isLoading,
  onCancel,
  onSubmit,
}: UserFormProps) {
  const manageableRoles = useMemo(() => getManageableRoles(actorRole), [actorRole]);
  const activeBranchIds = useMemo(
    () => new Set(branches.filter((branch) => branch.isActive).map((branch) => branch.id)),
    [branches],
  );
  const schema = useMemo(
    () => createUserFormSchema(Boolean(user), activeBranchIds),
    [activeBranchIds, user],
  );
  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(manageableRoles, branches, user),
  });
  const selectedRole = useWatch({ control: form.control, name: "role" });
  const needsBranch = !isGlobalUserRole(selectedRole);
  const availableBranches = branches.filter(
    (branch) => branch.isActive || branch.id === user?.branchId,
  );

  useEffect(() => {
    form.reset(getDefaultValues(manageableRoles, branches, user));
  }, [branches, form, manageableRoles, user]);

  useEffect(() => {
    if (!needsBranch) {
      form.setValue("branchId", "", { shouldValidate: false });
      return;
    }

    const current = Number(form.getValues("branchId"));
    if (!activeBranchIds.has(current) && activeBranchIds.size === 1) {
      form.setValue("branchId", [...activeBranchIds][0].toString(), {
        shouldValidate: true,
      });
    }
  }, [activeBranchIds, form, needsBranch]);

  const statusOptions: UserStatus[] = user?.status === "INACTIVE"
    ? ["INACTIVE", "ACTIVE", "PENDING"]
    : ["PENDING", "ACTIVE"];

  const submit = (values: UserFormValues) => {
    onSubmit({
      name: values.name.trim(),
      email: values.email.trim(),
      ...(values.password && { password: values.password }),
      role: values.role,
      status: values.status,
      branchId: isGlobalUserRole(values.role) ? null : Number(values.branchId),
    });
  };

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <InputField
        label="Full name"
        placeholder="Staff member name"
        autoFocus
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />
      <InputField
        label="Email address"
        placeholder="name@example.com"
        type="email"
        autoComplete="email"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <InputField
        label={user ? "New password" : "Password"}
        placeholder={user ? "Leave blank to keep current password" : "At least 8 characters"}
        type="password"
        autoComplete="new-password"
        hint={user ? "Only enter a password when it should be changed." : undefined}
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Role"
          error={form.formState.errors.role?.message}
          {...form.register("role")}
        >
          {manageableRoles.map((role) => (
            <option value={role} key={role}>
              {formatRole(role)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Status"
          hint={
            user && user.status !== "INACTIVE"
              ? "Use Deactivate to make this account inactive."
              : undefined
          }
          error={form.formState.errors.status?.message}
          {...form.register("status")}
        >
          {statusOptions.map((status) => (
            <option value={status} key={status}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </option>
          ))}
        </SelectField>
      </div>
      {needsBranch && (
        <SelectField
          label="Branch"
          disabled={branchesLoading || isLoading}
          hint={
            user?.branch && !user.branch.isActive
              ? "The current branch is inactive. Select an active branch or reactivate it first."
              : "Branch-scoped roles require an active branch."
          }
          error={form.formState.errors.branchId?.message}
          {...form.register("branchId")}
        >
          <option value="">Select a branch</option>
          {availableBranches.map((branch) => (
            <option value={branch.id} disabled={!branch.isActive} key={branch.id}>
              {branch.name}{branch.isActive ? "" : " (Inactive)"}
            </option>
          ))}
        </SelectField>
      )}

      <div className="mt-2 flex justify-end gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={branchesLoading || manageableRoles.length === 0}
          loadingLabel={user ? "Saving..." : "Creating..."}
        >
          {user ? "Save changes" : "Create user"}
        </Button>
      </div>
    </form>
  );
}
