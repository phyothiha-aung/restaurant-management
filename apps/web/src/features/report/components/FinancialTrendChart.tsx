import type { FinancialReportDailyPoint } from "@restaurant-management/shared";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateOnly } from "../../../lib/date-format";
import { formatMoney } from "../../order/order-utils";

export function FinancialTrendChart({ data }: { data: FinancialReportDailyPoint[] }) {
  const points = data.map((point) => ({
    ...point,
    label: formatDateOnly(point.date, { month: "short", day: "numeric" }),
    netSalesValue: Number(point.netSales),
    expensesValue: Number(point.expenses),
    profitValue: Number(point.profit),
  }));

  return (
    <div className="h-80 w-full" role="img" aria-label="Daily net sales, expenses, and profit trend">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 12, right: 14, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e5e0dc" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#746d6e" }} minTickGap={28} />
          <YAxis
            width={72}
            tick={{ fontSize: 11, fill: "#746d6e" }}
            tickFormatter={(value) => new Intl.NumberFormat(undefined, { notation: "compact" }).format(value)}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value))}
            labelStyle={{ color: "#292324", fontWeight: 700 }}
          />
          <Legend />
          <Line type="monotone" dataKey="netSalesValue" name="Net sales" stroke="#c8102e" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="expensesValue" name="Expenses" stroke="#d8a72e" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="profitValue" name="Profit" stroke="#217a4a" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
