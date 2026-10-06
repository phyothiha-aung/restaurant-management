import {
  ArrowLeft,
  Armchair,
  CalendarClock,
  CheckCircle2,
  Pencil,
  RefreshCw,
  UserRound,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import {
  useCancelOrder,
  useCompleteOrder,
  useOrder,
} from "../features/order/order-services";
import {
  formatMoney,
  formatOrderNumber,
  formatOrderStatus,
  orderStatusTone,
} from "../features/order/order-utils";
import { getApiErrorMessage } from "../lib/api-error";
import { canOperateOrders } from "../lib/user-display";
import { useAuthStore } from "../store/useAuthStore";
import { useAppConfig } from "../features/app-config/app-config-context";
import { formatTimestamp } from "../lib/date-format";

export function OrderDetailPage() {
  const { timeZone } = useAppConfig();
  const actor = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const idParam = Number(useParams().id);
  const orderId = Number.isInteger(idParam) && idParam > 0 ? idParam : null;
  const orderQuery = useOrder(orderId);
  const [action, setAction] = useState<"complete" | "cancel" | null>(null);
  const completeMutation = useCompleteOrder({ onSuccess: () => setAction(null) });
  const cancelMutation = useCancelOrder({ onSuccess: () => setAction(null) });

  if (!actor) return null;

  if (!orderId) {
    return <NotAvailable message="This order number is invalid." onBack={() => navigate("/orders")} />;
  }
  if (orderQuery.isPending) return <DetailSkeleton />;
  if (orderQuery.isError) {
    return (
      <NotAvailable
        message={getApiErrorMessage(orderQuery.error, "Could not load this order.")}
        onBack={() => navigate("/orders")}
        onRetry={() => void orderQuery.refetch()}
      />
    );
  }

  const order = orderQuery.data;
  const isOpen = order.status === "OPEN";
  const canOperate = canOperateOrders(actor.role);

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-ink"
          to="/orders"
        >
          <ArrowLeft size={16} /> Back to orders
        </Link>
        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-red">
              Order detail
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-bold">
                Order {formatOrderNumber(order.id)}
              </h1>
              <Badge tone={orderStatusTone(order.status)}>
                {formatOrderStatus(order.status)}
              </Badge>
            </div>
          </div>
          {canOperate && isOpen && (
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-bold text-ink hover:border-brand-gold hover:bg-brand-gold-soft"
                to={`/orders/${order.id}/edit`}
              >
                <Pencil size={16} /> Edit
              </Link>
              <Button variant="secondary" onClick={() => setAction("complete")}>
                <CheckCircle2 size={17} /> Complete
              </Button>
              <Button variant="danger" onClick={() => setAction("cancel")}>
                <XCircle size={17} /> Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-extrabold">Ordered items</h2>
          </div>
          <div className="divide-y divide-line">
            {order.items.map((item) => (
              <article className="p-5" key={item.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-ink">{item.productName}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {item.variantName} · {formatMoney(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="whitespace-nowrap font-extrabold">
                    {formatMoney(item.lineTotal)}
                  </p>
                </div>
                {item.addons.length > 0 && (
                  <ul className="mt-3 space-y-1 rounded-xl bg-surface p-3 text-xs text-muted">
                    {item.addons.map((addon) => (
                      <li className="flex justify-between gap-3" key={addon.addonId}>
                        <span>
                          + {addon.addonName} × {addon.quantity} per item
                        </span>
                        <span>{formatMoney(addon.totalAmount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-extrabold">Totals</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <TotalRow label="Subtotal" value={formatMoney(order.subtotal)} />
              <TotalRow
                label={order.discountType === "PERCENT"
                  ? `Discount (${Number(order.discountValue)}%)`
                  : "Discount"}
                value={`− ${formatMoney(order.discountAmount)}`}
              />
              <TotalRow
                label={`Tax (${Number(order.taxPercent)}%)`}
                value={formatMoney(order.taxAmount)}
              />
              <div className="border-t border-line pt-3">
                <TotalRow label="Total" value={formatMoney(order.totalAmount)} strong />
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="font-extrabold">Order information</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <InfoRow icon={<Armchair size={16} />} label="Order type" value={order.orderType === "DINE_IN" ? `Dine in · ${order.tableName}` : "Takeaway"} />
              <InfoRow icon={<UserRound size={16} />} label="Created by" value={order.createdBy.name} />
              <InfoRow icon={<UserRound size={16} />} label="Last updated by" value={order.updatedBy.name} />
              <InfoRow icon={<CalendarClock size={16} />} label="Created" value={formatTimestamp(order.createdAt, timeZone)} />
              <InfoRow icon={<CalendarClock size={16} />} label="Last updated" value={formatTimestamp(order.updatedAt, timeZone)} />
              {order.completedAt && (
                <InfoRow icon={<CheckCircle2 size={16} />} label="Completed" value={formatTimestamp(order.completedAt, timeZone)} />
              )}
              {order.cancelledAt && (
                <InfoRow icon={<XCircle size={16} />} label="Cancelled" value={formatTimestamp(order.cancelledAt, timeZone)} />
              )}
            </dl>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={action === "complete"}
        title="Complete this order?"
        description="The order will become immutable. Confirm that its items, discount, and total are correct."
        confirmLabel="Complete order"
        confirmVariant="secondary"
        loadingLabel="Completing..."
        isLoading={completeMutation.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() => completeMutation.mutate(order.id)}
      />
      <ConfirmDialog
        open={action === "cancel"}
        title="Cancel this order?"
        description="Cancellation is permanent and the order cannot be edited or completed afterward."
        confirmLabel="Cancel order"
        loadingLabel="Cancelling..."
        isLoading={cancelMutation.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() => cancelMutation.mutate(order.id)}
      />
    </div>
  );
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-base font-extrabold" : "text-muted"}`}>
      <dt>{label}</dt><dd className={strong ? "text-brand-red" : "font-bold text-ink"}>{value}</dd>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-brand-red">{icon}</span>
      <div><dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-0.5 font-semibold text-ink">{value}</dd></div>
    </div>
  );
}

function DetailSkeleton() {
  return <div className="animate-pulse space-y-5"><div className="h-20 rounded-2xl bg-line-soft" /><div className="grid gap-4 lg:grid-cols-[1fr_20rem]"><div className="h-96 rounded-2xl bg-line-soft" /><div className="h-80 rounded-2xl bg-line-soft" /></div></div>;
}

function NotAvailable({ message, onBack, onRetry }: { message: string; onBack: () => void; onRetry?: () => void }) {
  return (
    <Card className="grid min-h-80 place-items-center p-8 text-center">
      <div><RefreshCw className="mx-auto text-brand-red" /><h1 className="mt-4 text-xl font-extrabold">Order unavailable</h1><p className="mt-2 text-sm text-muted">{message}</p><div className="mt-5 flex justify-center gap-2">{onRetry && <Button variant="outline" onClick={onRetry}>Retry</Button>}<Button onClick={onBack}>Back to orders</Button></div></div>
    </Card>
  );
}
