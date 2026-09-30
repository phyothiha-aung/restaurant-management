import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@restaurant-management/shared";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { InputField } from "../../../components/ui/FormField";
import type { UpdateProfileInput } from "../profile-api";
import {
  ProfileFormSchema,
  type ProfileFormValues,
} from "../profile-validation";

interface ProfileFormProps {
  user: User;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (input: UpdateProfileInput) => void;
}

const getDefaultValues = (user: User): ProfileFormValues => ({
  name: user.name,
  password: "",
  confirmPassword: "",
});

export function ProfileForm({
  user,
  isLoading,
  onCancel,
  onSubmit,
}: ProfileFormProps) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: getDefaultValues(user),
  });

  useEffect(() => {
    form.reset(getDefaultValues(user));
  }, [form, user]);

  const submit = (values: ProfileFormValues) => {
    onSubmit({
      name: values.name.trim(),
      ...(values.password && { password: values.password }),
    });
  };

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <InputField
        label="Full name"
        placeholder="Your name"
        autoFocus
        autoComplete="name"
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />

      <div className="rounded-xl border border-brand-gold/40 bg-brand-gold-soft p-4 text-xs leading-5 text-gold-ink">
        Leave the password fields blank to keep your current password. Changing it revokes all
        refresh tokens, so you will need to sign in again after the current access token expires.
      </div>

      <InputField
        label="New password"
        placeholder="Leave blank to keep current password"
        type="password"
        autoComplete="new-password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      <InputField
        label="Confirm new password"
        placeholder="Enter the new password again"
        type="password"
        autoComplete="new-password"
        error={form.formState.errors.confirmPassword?.message}
        {...form.register("confirmPassword")}
      />

      <div className="mt-2 flex justify-end gap-3 border-t border-line pt-5">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          loadingLabel="Saving..."
        >
          Save changes
        </Button>
      </div>
    </form>
  );
}
