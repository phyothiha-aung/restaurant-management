import { zodResolver } from "@hookform/resolvers/zod";
import type {
  User,
  UserRole,
  UserStatus,
} from "@restaurant-management/shared";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { InputField, SelectField } from "../../../components/ui/FormField";
import { formatRole } from "../../../lib/user-display";
import { getManageableRoles } from "../user-options";
import { createUserFormSchema, type UserFormValues } from "../user-validation";

export interface UserFormSubmission {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
}

interface UserFormProps {
  actorRole: UserRole;
  user?: User;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (input: UserFormSubmission) => void;
}

const getDefaultValues = (
  manageableRoles: UserRole[],
  user?: User,
): UserFormValues => {
  const role = user?.role ?? manageableRoles[0] ?? "WAITER";
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role,
    status: user?.status ?? "PENDING",
  };
};

export function UserForm({
  actorRole,
  user,
  isLoading,
  onCancel,
  onSubmit,
}: UserFormProps) {
  const manageableRoles = useMemo(
    () => getManageableRoles(actorRole),
    [actorRole],
  );
  const schema = useMemo(
    () => createUserFormSchema(Boolean(user)),
    [user],
  );
  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(manageableRoles, user),
  });

  useEffect(() => {
    form.reset(getDefaultValues(manageableRoles, user));
  }, [form, manageableRoles, user]);

  const statusOptions: UserStatus[] =
    user?.status === "INACTIVE"
      ? ["INACTIVE", "ACTIVE", "PENDING"]
      : ["PENDING", "ACTIVE"];

  const submit = (values: UserFormValues) => {
    onSubmit({
      name: values.name.trim(),
      email: values.email.trim(),
      ...(values.password && { password: values.password }),
      role: values.role,
      status: values.status,
    });
  };

  return (
    <form
      className="grid gap-5"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
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
        placeholder={
          user
            ? "Leave blank to keep current password"
            : "At least 8 characters"
        }
        type="password"
        autoComplete="new-password"
        hint={
          user ? "Only enter a password when it should be changed." : undefined
        }
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      <div className="grid gap-5 sm:grid-cols-2 items-start">
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
      <div className="mt-2 flex justify-end gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={manageableRoles.length === 0}
          loadingLabel={user ? "Saving..." : "Creating..."}
        >
          {user ? "Save changes" : "Create user"}
        </Button>
      </div>
    </form>
  );
}
