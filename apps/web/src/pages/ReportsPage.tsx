import type { FinancialReport } from "@restaurant-management/shared";
import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Percent,
  ReceiptText,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { useAppConfig } from "../features/app-config/app-config-context";
import { FinancialTrendChart } from "../features/report/components/FinancialTrendChart";
import { useFinancialReport } from "../features/report/report-services";
import {
  addCalendarDays,
  currentMonthRange,
  currentWeekRange,
  isCalendarDate,
  isValidReportRange,
} from "../features/report/report-utils";
import { formatExpenseCategory } from "../features/expense/expense-options";
import { formatMoney } from "../features/order/order-utils";
import { getApiErrorMessage } from "../lib/api-error";
import { formatDateOnly, getBusinessDate } from "../lib/date-format";

type Preset = "today" | "week" | "month" | "30-days";

export function ReportsPage() {
  const { timeZone } = useAppConfig();
  const [params, setParams] = useSearchParams();
  const today = useMemo(() => getBusinessDate(timeZone), [timeZone]);
  const fallback = currentMonthRange(today);
  const rawFrom = params.get("dateFrom");
  const rawTo = params.get("dateTo");
  const validRange =
    isCalendarDate(rawFrom) &&
    isCalendarDate(rawTo) &&
    isValidReportRange(rawFrom, rawTo);
  const dateFrom = validRange ? rawFrom : fallback.dateFrom;
  const dateTo = validRange ? rawTo : fallback.dateTo;
  const query = useFinancialReport({ dateFrom, dateTo });

  useEffect(() => {
    if (rawFrom === dateFrom && rawTo === dateTo) return;
    setParams({ dateFrom, dateTo }, { replace: true });
  }, [dateFrom, dateTo, rawFrom, rawTo, setParams]);

  const setRange = (from: string, to: string) => {
    if (!isValidReportRange(from, to)) return;
    setParams({ dateFrom: from, dateTo: to });
  };

  const applyPreset = (preset: Preset) => {
    if (preset === "today") setRange(today, today);
    else if (preset === "week") {
      const range = currentWeekRange(today);
      setRange(range.dateFrom, range.dateTo);
    } else if (preset === "month") {
      const range = currentMonthRange(today);
      setRange(range.dateFrom, range.dateTo);
    } else setRange(addCalendarDays(today, -29), today);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Financial performance"
        title="Reports"
        description="Track completed sales, operating expenses, and profit for Ann Htike."
      />

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <PresetButton label="Today" onClick={() => applyPreset("today")} />
          <PresetButton label="This week" onClick={() => applyPreset("week")} />
          <PresetButton label="This month" onClick={() => applyPreset("month")} />
          <PresetButton label="Last 30 days" onClick={() => applyPreset("30-days")} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DateField
            label="Date from"
            value={dateFrom}
            max={dateTo}
            onChange={(value) => isCalendarDate(value) && setRange(value, dateTo)}
          />
          <DateField
            label="Date to"
            value={dateTo}
            min={dateFrom}
            onChange={(value) => isCalendarDate(value) && setRange(dateFrom, value)}
          />
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted">
          <CalendarDays size={14} /> Business dates use {timeZone}.
        </p>
      </Card>

      {query.isPending ? (
        <ReportSkeleton />
      ) : query.isError ? (
        <ReportError
          message={getApiErrorMessage(query.error, "Could not load the financial report.")}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <ReportContent report={query.data} />
      )}
    </div>
  );
}

function ReportContent({ report }: { report: FinancialReport }) {
  const profit = Number(report.summary.profit);
  const hasActivity =
    report.summary.completedOrderCount > 0 || Number(report.summary.expenses) > 0;
  const maxExpense = Math.max(
    ...report.expensesByCategory.map((item) => Number(item.amount)),
    1,
  );

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard icon={CircleDollarSign} label="Net sales" value={formatMoney(report.summary.netSales)} note={`Gross ${formatMoney(report.summary.grossSales)} · Discounts ${formatMoney(report.summary.discounts)}`} />
        <MetricCard icon={ReceiptText} label="Expenses" value={formatMoney(report.summary.expenses)} note="Active expense records" tone="gold" />
        <MetricCard icon={profit >= 0 ? TrendingUp : TrendingDown} label={profit >= 0 ? "Profit" : "Loss"} value={formatMoney(report.summary.profit)} note={report.summary.profitMargin === null ? "No sales margin yet" : `${report.summary.profitMargin}% margin`} tone={profit >= 0 ? "success" : "danger"} />
        <MetricCard icon={Percent} label="Collected tax" value={formatMoney(report.summary.collectedTax)} note="Excluded from revenue" />
        <MetricCard icon={ClipboardList} label="Completed orders" value={report.summary.completedOrderCount.toLocaleString()} note={`Collected ${formatMoney(report.summary.collectedTotal)}`} />
        <MetricCard icon={CircleDollarSign} label="Average order" value={formatMoney(report.summary.averageOrderValue)} note="Net sales per completed order" />
      </section>

      {!hasActivity && (
        <Card className="p-8 text-center">
          <p className="font-extrabold text-ink">No financial activity in this period</p>
          <p className="mt-2 text-sm text-muted">Complete an order or record an expense to populate the report.</p>
        </Card>
      )}

      <Card className="p-5">
        <div className="mb-4">
          <h2 className="font-extrabold text-ink">Daily financial trend</h2>
          <p className="mt-1 text-sm text-muted">Net sales exclude collected tax.</p>
        </div>
        <FinancialTrendChart data={report.daily} />
        <DailyTable report={report} />
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-extrabold text-ink">Expenses by category</h2>
          <div className="mt-5 space-y-4">
            {report.expensesByCategory.map((item) => (
              <div key={item.category}>
                <div className="mb-1.5 flex justify-between gap-4 text-sm">
                  <span className="font-semibold text-ink">{formatExpenseCategory(item.category)}</span>
                  <span className="font-bold text-ink">{formatMoney(item.amount)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line-soft">
                  <div className="h-full rounded-full bg-brand-gold" style={{ width: `${(Number(item.amount) / maxExpense) * 100}%` }} />
                </div>
              </div>
            ))}
            {report.expensesByCategory.length === 0 && <EmptyBreakdown text="No expenses in this period." />}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-extrabold text-ink">Sales by order type</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {report.salesByOrderType.map((item) => (
              <div className="rounded-2xl border border-line bg-surface p-4" key={item.orderType}>
                <p className="text-xs font-extrabold uppercase tracking-wide text-muted">{item.orderType === "DINE_IN" ? "Dine in" : "Takeaway"}</p>
                <p className="mt-2 text-xl font-extrabold text-brand-red">{formatMoney(item.netSales)}</p>
                <p className="mt-1 text-xs text-muted">{item.completedOrderCount} completed order{item.completedOrderCount === 1 ? "" : "s"}</p>
              </div>
            ))}
            {report.salesByOrderType.length === 0 && <EmptyBreakdown text="No completed orders in this period." />}
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="border-b border-line p-5">
          <h2 className="font-extrabold text-ink">Top-selling products</h2>
          <p className="mt-1 text-sm text-muted">Gross item sales include selected add-ons and exclude order-level discounts.</p>
        </div>
        {report.topProducts.length === 0 ? (
          <EmptyBreakdown text="No product sales in this period." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3">Product</th><th className="px-4 py-3 text-right">Quantity</th><th className="px-5 py-3 text-right">Gross item sales</th></tr></thead>
              <tbody className="divide-y divide-line">{report.topProducts.map((item, index) => <tr key={item.productId}><td className="px-5 py-4 font-bold text-ink"><span className="mr-3 text-muted">#{index + 1}</span>{item.name}</td><td className="px-4 py-4 text-right text-muted">{item.quantity.toLocaleString()}</td><td className="px-5 py-4 text-right font-bold text-ink">{formatMoney(item.grossSales)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function DailyTable({ report }: { report: FinancialReport }) {
  return (
    <details className="mt-4 border-t border-line pt-4">
      <summary className="cursor-pointer text-sm font-bold text-brand-red">View daily values</summary>
      <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-line">
        <table className="w-full min-w-160 text-left text-xs"><thead className="sticky top-0 bg-surface text-muted"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2 text-right">Orders</th><th className="px-3 py-2 text-right">Net sales</th><th className="px-3 py-2 text-right">Expenses</th><th className="px-3 py-2 text-right">Profit</th></tr></thead><tbody className="divide-y divide-line">{report.daily.map((point) => <tr key={point.date}><td className="px-3 py-2 font-semibold">{formatDateOnly(point.date)}</td><td className="px-3 py-2 text-right">{point.completedOrderCount}</td><td className="px-3 py-2 text-right">{formatMoney(point.netSales)}</td><td className="px-3 py-2 text-right">{formatMoney(point.expenses)}</td><td className="px-3 py-2 text-right font-bold">{formatMoney(point.profit)}</td></tr>)}</tbody></table>
      </div>
    </details>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone = "red" }: { icon: typeof CircleDollarSign; label: string; value: string; note: string; tone?: "red" | "gold" | "success" | "danger" }) {
  const colors = tone === "gold" ? "bg-brand-gold-soft text-brand-gold-dark" : tone === "success" ? "bg-success-soft text-success" : tone === "danger" ? "bg-brand-red-soft text-danger" : "bg-brand-red-soft text-brand-red";
  return <Card className="p-5"><div className={`grid h-10 w-10 place-items-center rounded-xl ${colors}`}><Icon size={19} /></div><p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-muted">{label}</p><p className="mt-1 text-2xl font-extrabold text-ink">{value}</p><p className="mt-2 text-xs text-muted">{note}</p></Card>;
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button size="sm" variant="outline" onClick={onClick}>{label}</Button>;
}

function DateField({ label, value, min, max, onChange }: { label: string; value: string; min?: string; max?: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-xs font-bold text-muted"><span>{label}</span><input className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft" type="date" value={value} min={min} max={max} onChange={(event) => onChange(event.target.value)} /></label>;
}

function EmptyBreakdown({ text }: { text: string }) {
  return <p className="p-5 text-center text-sm text-muted">{text}</p>;
}

function ReportSkeleton() {
  return <div className="animate-pulse space-y-4"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div className="h-36 rounded-2xl bg-line-soft" key={index} />)}</div><div className="h-96 rounded-2xl bg-line-soft" /></div>;
}

function ReportError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <Card className="grid min-h-72 place-items-center p-8 text-center"><div><RefreshCw className="mx-auto text-brand-red" /><h2 className="mt-4 font-extrabold text-ink">Report unavailable</h2><p className="mt-2 text-sm text-muted">{message}</p><Button className="mt-5" variant="outline" onClick={onRetry}>Retry</Button></div></Card>;
}
