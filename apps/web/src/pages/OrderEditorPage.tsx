import { RefreshCw } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { OrderEditor } from "../features/order/components/OrderEditor";
import { useOrder } from "../features/order/order-services";
import { getApiErrorMessage } from "../lib/api-error";

export function OrderEditorPage() {
  const navigate = useNavigate();
  const params = useParams();
  const editing = params.id !== undefined;
  const parsed = Number(params.id);
  const orderId = editing && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  const orderQuery = useOrder(orderId);

  if (!editing) return <OrderEditor />;
  if (!orderId) return <Navigate to="/orders" replace />;
  if (orderQuery.isPending) return <div className="animate-pulse space-y-5"><div className="h-20 rounded-2xl bg-line-soft" /><div className="h-[35rem] rounded-2xl bg-line-soft" /></div>;
  if (orderQuery.isError) return <Card className="grid min-h-80 place-items-center p-8 text-center"><div><RefreshCw className="mx-auto text-brand-red" /><h1 className="mt-4 text-xl font-extrabold">Order unavailable</h1><p className="mt-2 text-sm text-muted">{getApiErrorMessage(orderQuery.error, "Could not load this order.")}</p><div className="mt-5 flex gap-2"><Button variant="outline" onClick={() => void orderQuery.refetch()}>Retry</Button><Button onClick={() => navigate("/orders")}>Back to orders</Button></div></div></Card>;
  if (orderQuery.data.status !== "OPEN") return <Navigate to={`/orders/${orderQuery.data.id}`} replace />;
  return <OrderEditor order={orderQuery.data} />;
}
