import type { ProductCategory } from "@restaurant-management/shared";
import { Edit3, Eye, MoreHorizontal, Power, PowerOff, Tags } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";

interface ProductCategoryListProps {
  categories: ProductCategory[];
  pendingCategoryId: number | null;
  onView: (category: ProductCategory) => void;
  onEdit: (category: ProductCategory) => void;
  onDeactivate: (category: ProductCategory) => void;
  onReactivate: (category: ProductCategory) => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export function ProductCategoryList({
  categories,
  pendingCategoryId,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
}: ProductCategoryListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted">
              <th className="px-5 py-3.5">Category</th>
              <th className="px-4 py-3.5">Description</th>
              <th className="px-4 py-3.5">Order</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Updated</th>
              <th className="px-5 py-3.5 text-right">
                <span className="sr-only">Actions</span>
                <MoreHorizontal className="ml-auto" size={17} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((category) => {
              const isPending = pendingCategoryId === category.id;
              return (
                <tr className="transition hover:bg-surface" key={category.id}>
                  <td className="px-5 py-4">
                    <button className="text-left" onClick={() => onView(category)}>
                      <span className="block text-sm font-extrabold text-ink">{category.name}</span>
                    </button>
                  </td>
                  <td className="max-w-80 px-4 py-4 text-xs text-muted">
                    <span className="block truncate">{category.description ?? "No description"}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-ink">{category.sortOrder}</td>
                  <td className="px-4 py-4">
                    <Badge tone={category.isActive ? "success" : "neutral"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                    {dateFormatter.format(new Date(category.updatedAt))}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <IconButton label={`View ${category.name}`} onClick={() => onView(category)}>
                        <Eye size={16} />
                      </IconButton>
                      <IconButton label={`Edit ${category.name}`} onClick={() => onEdit(category)}>
                        <Edit3 size={16} />
                      </IconButton>
                      <IconButton
                        label={`${category.isActive ? "Deactivate" : "Reactivate"} ${category.name}`}
                        disabled={isPending}
                        onClick={() => category.isActive ? onDeactivate(category) : onReactivate(category)}
                      >
                        {category.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {categories.map((category) => {
          const isPending = pendingCategoryId === category.id;
          return (
            <article className="rounded-2xl border border-line bg-white p-4" key={category.id}>
              <div className="flex items-start justify-between gap-3">
                <button className="min-w-0 text-left" onClick={() => onView(category)}>
                  <h3 className="truncate font-extrabold text-ink">{category.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    {category.description ?? "No description"}
                  </p>
                </button>
                <Badge tone={category.isActive ? "success" : "neutral"}>
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-4 grid gap-2 text-xs text-muted">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <Tags className="shrink-0 text-brand-red" size={14} /> Sort order {category.sortOrder}
                </p>
                <p>Updated {dateFormatter.format(new Date(category.updatedAt))}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                <Button size="sm" variant="ghost" onClick={() => onView(category)}>
                  <Eye size={15} /> View
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onEdit(category)}>
                  <Edit3 size={15} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant={category.isActive ? "ghost" : "secondary"}
                  disabled={isPending}
                  onClick={() => category.isActive ? onDeactivate(category) : onReactivate(category)}
                >
                  {category.isActive ? <PowerOff size={15} /> : <Power size={15} />}
                  {category.isActive ? "Deactivate" : "Reactivate"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function IconButton({
  label,
  disabled,
  children,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-line-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
