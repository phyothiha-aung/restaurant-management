import type { ProductCategory } from "@restaurant-management/shared";
import { Badge } from "../../../components/ui/Badge";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function ProductCategoryDetails({ category }: { category: ProductCategory }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-ink">{category.name}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
              {category.description ?? "No description"}
            </p>
          </div>
          <Badge tone={category.isActive ? "success" : "neutral"}>
            {category.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Detail label="Sort order" value={category.sortOrder.toString()} />
        <Detail label="Created" value={dateTimeFormatter.format(new Date(category.createdAt))} />
        <Detail label="Last updated" value={dateTimeFormatter.format(new Date(category.updatedAt))} />
      </dl>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
