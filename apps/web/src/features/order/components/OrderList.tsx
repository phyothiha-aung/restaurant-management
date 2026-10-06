import type { OrderSummary } from "@restaurant-management/shared";
import { Armchair, CalendarDays, Eye, Pencil, ShoppingBag } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "../../../components/ui/Badge";
import { useAppConfig } from "../../app-config/app-config-context";
import { formatTimestamp } from "../../../lib/date-format";
import {
  formatMoney,
  formatOrderNumber,
  formatOrderStatus,
  orderStatusTone,
} from "../order-utils";

interface OrderListProps {
  orders: OrderSummary[];
  canOperate: boolean;
}

export function OrderList({ orders, canOperate }: OrderListProps) {
  const { timeZone } = useAppConfig();
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
              <th className="px-5 py-3.5">Order</th>
              <th className="px-4 py-3.5">Type / table</th>
              <th className="px-4 py-3.5">Created by</th>
              <th className="px-4 py-3.5 text-center">Items</th>
              <th className="px-4 py-3.5 text-right">Total</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5">Created</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((order) => (
              <tr className="transition hover:bg-surface" key={order.id}>
                <td className="px-5 py-4">
                  <Link
                    className="text-sm font-extrabold text-ink hover:text-brand-red"
                    to={`/orders/${order.id}`}
                  >
                    {formatOrderNumber(order.id)}
                  </Link>
                </td>
                <td className="max-w-44 px-4 py-4 text-xs text-muted">
                  <span className="block truncate font-semibold text-ink">
                    {order.orderType === "DINE_IN"
                      ? order.tableName
                      : "Takeaway"}
                  </span>
                  <span>
                    {order.orderType === "DINE_IN" ? "Dine in" : "No table"}
                  </span>
                </td>
                <td className="max-w-40 px-4 py-4 text-xs text-muted">
                  <span className="block truncate">{order.createdBy.name}</span>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-ink text-center">
                  {order.itemCount}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-extrabold text-ink text-right">
                  {formatMoney(order.totalAmount)}
                </td>
                <td className="px-4 py-4 items-center justify-center flex">
                  <Badge
                    tone={orderStatusTone(order.status)}
                    className="mt-1.5"
                  >
                    {formatOrderStatus(order.status)}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                  {formatTimestamp(order.createdAt, timeZone)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <Link
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-line-soft hover:text-ink"
                      to={`/orders/${order.id}`}
                      aria-label={`View order ${formatOrderNumber(order.id)}`}
                    >
                      <Eye size={16} />
                    </Link>
                    {canOperate && order.status === "OPEN" && (
                      <Link
                        className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-line-soft hover:text-ink"
                        to={`/orders/${order.id}/edit`}
                        aria-label={`Edit order ${formatOrderNumber(order.id)}`}
                      >
                        <Pencil size={16} />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {orders.map((order) => (
          <article
            className="rounded-2xl border border-line bg-white p-4"
            key={order.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  className="font-extrabold text-ink hover:text-brand-red"
                  to={`/orders/${order.id}`}
                >
                  Order {formatOrderNumber(order.id)}
                </Link>
                <p className="mt-1 text-lg font-extrabold text-brand-red">
                  {formatMoney(order.totalAmount)}
                </p>
              </div>
              <Badge tone={orderStatusTone(order.status)}>
                {formatOrderStatus(order.status)}
              </Badge>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-muted">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <Armchair size={14} />{" "}
                {order.orderType === "DINE_IN" ? order.tableName : "Takeaway"}
              </p>
              <p className="flex items-center gap-2">
                <ShoppingBag size={14} /> {order.itemCount} item
                {order.itemCount === 1 ? "" : "s"}
              </p>
              <p>Created by {order.createdBy.name}</p>
              <p className="flex items-center gap-2">
                <CalendarDays size={14} />
                {formatTimestamp(order.createdAt, timeZone)}
              </p>
            </div>
            <div className="mt-4 flex gap-2 border-t border-line pt-3">
              <Link
                className="inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold text-muted hover:bg-line-soft hover:text-ink"
                to={`/orders/${order.id}`}
              >
                <Eye size={15} /> View
              </Link>
              {canOperate && order.status === "OPEN" && (
                <Link
                  className="inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold text-muted hover:bg-line-soft hover:text-ink"
                  to={`/orders/${order.id}/edit`}
                >
                  <Pencil size={15} /> Edit
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
