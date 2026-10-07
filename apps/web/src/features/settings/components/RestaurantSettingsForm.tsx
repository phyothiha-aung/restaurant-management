import { zodResolver } from "@hookform/resolvers/zod";
import type {
  RestaurantSettings,
  UpdateRestaurantSettingsInput,
} from "@restaurant-management/shared";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import {
  InputField,
  SelectField,
  TextareaField,
} from "../../../components/ui/FormField";
import {
  RestaurantSettingsFormSchema,
  type RestaurantSettingsFormValues,
} from "../settings-validation";

interface Props {
  settings: RestaurantSettings;
  canEdit: boolean;
  isLoading: boolean;
  onSubmit: (input: UpdateRestaurantSettingsInput) => void;
}

const defaults = (settings: RestaurantSettings): RestaurantSettingsFormValues => ({
  name: settings.name,
  address: settings.address ?? "",
  phone: settings.phone ?? "",
  taxId: settings.taxId ?? "",
  timeZone: settings.timeZone,
  receiptFooter: settings.receiptFooter ?? "",
  receiptPaperWidth: settings.receiptPaperWidth,
});

const blankToNull = (value: string) => value.trim() || null;

export function RestaurantSettingsForm({
  settings,
  canEdit,
  isLoading,
  onSubmit,
}: Props) {
  const form = useForm<RestaurantSettingsFormValues>({
    resolver: zodResolver(RestaurantSettingsFormSchema),
    defaultValues: defaults(settings),
  });
  const timeZones = useMemo(() => {
    const intl = Intl as typeof Intl & {
      supportedValuesOf?: (key: "timeZone") => string[];
    };
    return intl.supportedValuesOf?.("timeZone") ?? [settings.timeZone];
  }, [settings.timeZone]);

  useEffect(() => form.reset(defaults(settings)), [form, settings]);

  const submit = (values: RestaurantSettingsFormValues) =>
    onSubmit({
      name: values.name.trim(),
      address: blankToNull(values.address),
      phone: blankToNull(values.phone),
      taxId: blankToNull(values.taxId),
      timeZone: values.timeZone.trim(),
      receiptFooter: blankToNull(values.receiptFooter),
      receiptPaperWidth: values.receiptPaperWidth,
    });

  return (
    <form className="grid gap-6" onSubmit={form.handleSubmit(submit)} noValidate>
      <SettingsSection
        title="Restaurant identity"
        description="These details will be available to receipts and other customer-facing documents."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Restaurant name"
            disabled={!canEdit}
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />
          <InputField
            label="Phone"
            disabled={!canEdit}
            placeholder="Optional"
            error={form.formState.errors.phone?.message}
            {...form.register("phone")}
          />
          <InputField
            className="sm:col-span-2"
            label="Tax or business ID"
            disabled={!canEdit}
            placeholder="Optional"
            error={form.formState.errors.taxId?.message}
            {...form.register("taxId")}
          />
        </div>
        <TextareaField
          label="Address"
          disabled={!canEdit}
          placeholder="Optional"
          error={form.formState.errors.address?.message}
          {...form.register("address")}
        />
      </SettingsSection>

      <SettingsSection
        title="Business time"
        description="Reports and date filters use this timezone instead of the device timezone."
      >
        <InputField
          label="IANA timezone"
          list="restaurant-timezones"
          disabled={!canEdit}
          hint="Example: Asia/Yangon"
          error={form.formState.errors.timeZone?.message}
          {...form.register("timeZone")}
        />
        <datalist id="restaurant-timezones">
          {timeZones.map((zone) => <option value={zone} key={zone} />)}
        </datalist>
      </SettingsSection>

      <SettingsSection
        title="Receipt defaults"
        description="Shared receipt content and the default thermal-paper width. Printer connection settings remain device-specific."
      >
        <SelectField
          label="Paper width"
          disabled={!canEdit}
          error={form.formState.errors.receiptPaperWidth?.message}
          {...form.register("receiptPaperWidth", { valueAsNumber: true })}
        >
          <option value={80}>80 mm</option>
          <option value={58}>58 mm</option>
        </SelectField>
        <TextareaField
          label="Receipt footer"
          disabled={!canEdit}
          placeholder="For example: Thank you for dining with us."
          error={form.formState.errors.receiptFooter?.message}
          {...form.register("receiptFooter")}
        />
      </SettingsSection>

      {canEdit && (
        <div className="flex justify-end border-t border-line pt-5">
          <Button
            type="submit"
            isLoading={isLoading}
            loadingLabel="Saving settings..."
            disabled={!form.formState.isDirty}
          >
            Save settings
          </Button>
        </div>
      )}
    </form>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 border-b border-line pb-6 last:border-0 last:pb-0">
      <div>
        <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}
