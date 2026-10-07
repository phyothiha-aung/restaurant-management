import type { UpdateRestaurantSettingsInput } from "@restaurant-management/shared";
import { Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { RestaurantSettingsForm } from "../features/settings/components/RestaurantSettingsForm";
import {
  useRestaurantSettings,
  useUpdateRestaurantSettings,
} from "../features/settings/settings-services";
import { useAppConfig } from "../features/app-config/app-config-context";
import { formatTimestamp } from "../lib/date-format";
import { getApiErrorMessage } from "../lib/api-error";
import { canEditRestaurantSettings } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";

export function SettingsPage() {
  const actor = useAuthStore((state) => state.user);
  const { timeZone } = useAppConfig();
  const query = useRestaurantSettings();
  const mutation = useUpdateRestaurantSettings();
  const [pending, setPending] = useState<UpdateRestaurantSettingsInput | null>(null);
  const canEdit = Boolean(actor && canEditRestaurantSettings(actor.role));

  const submit = (input: UpdateRestaurantSettingsInput) => {
    if (query.data && input.timeZone !== query.data.timeZone) {
      setPending(input);
      return;
    }
    mutation.mutate(input);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Restaurant settings"
        description="Manage shared restaurant identity, business time, and receipt defaults."
      />

      {query.isPending ? (
        <Card className="h-96 animate-pulse bg-line-soft" />
      ) : query.isError || !query.data ? (
        <Card className="grid min-h-72 place-items-center p-8 text-center">
          <div>
            <h2 className="font-extrabold">Could not load restaurant settings</h2>
            <p className="mt-2 text-sm text-muted">
              {getApiErrorMessage(query.error, "Check the API connection and try again.")}
            </p>
            <Button className="mt-5" variant="outline" onClick={() => void query.refetch()}>
              <RefreshCw size={16} /> Retry
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {!canEdit && (
            <div className="flex gap-3 rounded-2xl border border-brand-gold/40 bg-brand-gold-soft p-4 text-sm text-gold-ink">
              <ShieldCheck className="mt-0.5 shrink-0" size={18} />
              <p>You can view these settings. Only an owner, administrator, or superadmin can change them.</p>
            </div>
          )}
          <Card className="p-5 sm:p-7">
            <RestaurantSettingsForm
              settings={query.data}
              canEdit={canEdit}
              isLoading={mutation.isPending}
              onSubmit={submit}
            />
          </Card>
          <Card className="flex flex-col gap-3 p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-muted">
              <Clock3 size={16} />
              Last updated {formatTimestamp(query.data.updatedAt, timeZone)}
            </div>
            <p className="font-semibold text-ink">
              {query.data.updatedBy ? `By ${query.data.updatedBy.name}` : "Initialized by the system"}
            </p>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={pending !== null}
        title="Change restaurant timezone?"
        description="This takes effect immediately. Reports, business-day boundaries, and order date filters will use the new timezone; stored timestamps will not be changed."
        confirmLabel="Change timezone"
        confirmVariant="primary"
        isLoading={mutation.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          mutation.mutate(pending, { onSuccess: () => setPending(null) });
        }}
      />
    </div>
  );
}
