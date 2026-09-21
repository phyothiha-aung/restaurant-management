import type { User } from "@restaurant-management/shared";
import { Drawer } from "../../../components/ui/Drawer";
import { useUpdateProfile } from "../profile-services";
import { ProfileForm } from "./ProfileForm";

interface ProfileDrawerProps {
  open: boolean;
  user: User;
  onClose: () => void;
}

export function ProfileDrawer({ open, user, onClose }: ProfileDrawerProps) {
  const updateMutation = useUpdateProfile({ onSuccess: onClose });

  const handleClose = () => {
    if (!updateMutation.isPending) onClose();
  };

  return (
    <Drawer
      open={open}
      title="Edit profile"
      description="Update your display name or choose a new password."
      onClose={handleClose}
    >
      <ProfileForm
        user={user}
        isLoading={updateMutation.isPending}
        onCancel={handleClose}
        onSubmit={(input) => updateMutation.mutate(input)}
      />
    </Drawer>
  );
}
