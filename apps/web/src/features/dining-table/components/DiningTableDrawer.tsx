import { zodResolver } from "@hookform/resolvers/zod";
import type { DiningTable } from "@restaurant-management/shared";
import { Edit3, ExternalLink, Power, PowerOff } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { InputField } from "../../../components/ui/FormField";
import { getApiErrorMessage } from "../../../lib/api-error";
import { formatOrderNumber } from "../../order/order-utils";
import {
  useCreateDiningTable,
  useDiningTable,
  useUpdateDiningTable,
} from "../dining-table-services";
import {
  DiningTableFormSchema,
  type DiningTableFormValues,
} from "../dining-table-validation";

export type DiningTableDrawerMode = "create" | "view" | "edit";

interface Props {
  open: boolean;
  mode: DiningTableDrawerMode;
  tableId: number | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDeactivate: (table: DiningTable) => void;
}

const defaults = (table?: DiningTable): DiningTableFormValues => ({
  name: table?.name ?? "",
  capacity: table?.capacity?.toString() ?? "",
  sortOrder: table?.sortOrder.toString() ?? "0",
  isActive: table?.isActive ?? true,
});

export function DiningTableDrawer({
  open,
  mode,
  tableId,
  canManage,
  onClose,
  onEdit,
  onDeactivate,
}: Props) {
  const detail = useDiningTable(mode === "create" || !open ? null : tableId);
  const createMutation = useCreateDiningTable({ onSuccess: onClose });
  const updateMutation = useUpdateDiningTable({ onSuccess: onClose });
  const table = detail.data;
  const form = useForm<DiningTableFormValues>({
    resolver: zodResolver(DiningTableFormSchema),
    defaultValues: defaults(table),
  });

  useEffect(() => form.reset(defaults(table)), [form, table]);

  const saving = createMutation.isPending || updateMutation.isPending;
  const submit = (values: DiningTableFormValues) => {
    const input = {
      name: values.name.trim(),
      capacity: values.capacity ? Number(values.capacity) : null,
      sortOrder: Number(values.sortOrder),
      isActive: values.isActive,
    };
    if (mode === "create") createMutation.mutate(input);
    else if (tableId) updateMutation.mutate({ id: tableId, input });
  };

  const footer =
    mode === "view" && table && canManage ? (
      <div className="flex flex-wrap justify-end gap-2">
        {table.isActive ? (
          <Button variant="danger" onClick={() => onDeactivate(table)}>
            <PowerOff size={16} /> Deactivate
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() =>
              updateMutation.mutate({ id: table.id, input: { isActive: true } })
            }
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
      title={
        mode === "create"
          ? "Add table"
          : mode === "edit"
            ? "Edit table"
            : "Table details"
      }
      description="Manage seating and live table availability."
      footer={footer}
      onClose={() => !saving && onClose()}
    >
      {mode !== "create" && detail.isPending ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div className="h-16 rounded-xl bg-line-soft" key={item} />
          ))}
        </div>
      ) : mode !== "create" && detail.isError ? (
        <div className="rounded-2xl bg-brand-red-soft p-5">
          <p className="font-bold text-brand-red">Could not load this table</p>
          <p className="mt-1 text-sm text-muted">
            {getApiErrorMessage(detail.error, "Please try again.")}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void detail.refetch()}>
            Retry
          </Button>
        </div>
      ) : mode === "view" && table ? (
        <TableDetails table={table} />
      ) : (
        <form className="grid gap-5" onSubmit={form.handleSubmit(submit)}>
          <InputField
            label="Table name"
            placeholder="Table 1 or VIP Room"
            autoFocus
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <InputField
              label="Seat capacity"
              hint="Optional, from 1 to 100."
              inputMode="numeric"
              error={form.formState.errors.capacity?.message}
              {...form.register("capacity")}
            />
            <InputField
              label="Display order"
              inputMode="numeric"
              error={form.formState.errors.sortOrder?.message}
              {...form.register("sortOrder")}
            />
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-line p-4 text-sm font-semibold">
            <input
              className="h-4 w-4 accent-brand-red"
              type="checkbox"
              {...form.register("isActive")}
            />
            Available for new dine-in orders
          </label>
          <div className="mt-2 flex justify-end gap-3 border-t border-line pt-5">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} loadingLabel="Saving...">
              {mode === "create" ? "Create table" : "Save changes"}
            </Button>
          </div>
        </form>
      )}
    </Drawer>
  );
}

const statusTone = {
  AVAILABLE: "success",
  OCCUPIED: "red",
  INACTIVE: "neutral",
} as const;

function TableDetails({ table }: { table: DiningTable }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-ink">{table.name}</h3>
            <p className="mt-1 text-sm text-muted">
              {table.capacity ? `${table.capacity} seats` : "Capacity not set"}
            </p>
          </div>
          <Badge tone={statusTone[table.status]}>{table.status}</Badge>
        </div>
      </div>
      {table.openOrder ? (
        <div className="rounded-2xl border border-brand-gold bg-brand-gold-soft p-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
            Current order
          </p>
          <Link
            className="mt-2 inline-flex items-center gap-2 font-extrabold text-brand-red"
            to={`/orders/${table.openOrder.id}`}
          >
            Order {formatOrderNumber(table.openOrder.id)} <ExternalLink size={15} />
          </Link>
        </div>
      ) : (
        <p className="rounded-xl border border-line p-4 text-sm text-muted">
          No open order is assigned to this table.
        </p>
      )}
      <dl className="grid gap-4 sm:grid-cols-2">
        <Detail label="Display order" value={String(table.sortOrder)} />
        <Detail
          label="Last updated"
          value={new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(table.updatedAt))}
        />
      </dl>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}
