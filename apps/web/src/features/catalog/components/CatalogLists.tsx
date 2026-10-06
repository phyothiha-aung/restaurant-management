import type { Addon, Product } from "@restaurant-management/shared";
import { Edit3, Eye, Image, MoreHorizontal, Power, PowerOff } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { useAppConfig } from "../../app-config/app-config-context";
import { formatTimestamp } from "../../../lib/date-format";

const money = (value: string) => `${Number(value).toLocaleString()} MMK`;

interface ProductListProps {
  products: Product[]; canManage: boolean; pendingId: number | null;
  onView: (value: Product) => void; onEdit: (value: Product) => void;
  onDeactivate: (value: Product) => void; onReactivate: (value: Product) => void;
}
export function ProductList({ products, canManage, pendingId, onView, onEdit, onDeactivate, onReactivate }: ProductListProps) {
  const { timeZone } = useAppConfig();
  return <>
    <div className="hidden overflow-x-auto md:block"><table className="w-full text-left"><thead><tr className="border-b border-line bg-surface text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-muted"><th className="px-5 py-3.5">Product</th><th className="px-4 py-3.5">Category</th><th className="px-4 py-3.5">Variants</th><th className="px-4 py-3.5">Add-ons</th><th className="px-4 py-3.5">Status</th><th className="px-4 py-3.5">Updated</th><th className="px-5 py-3.5 text-right"><MoreHorizontal className="ml-auto" size={17} /></th></tr></thead>
      <tbody className="divide-y divide-line">{products.map((product) => <tr className="hover:bg-surface" key={product.id}>
        <td className="px-5 py-4"><button className="text-left" onClick={() => onView(product)}><span className="flex items-center gap-2 text-sm font-extrabold text-ink">{product.name}{product.image && <Image size={14} className="text-brand-gold-dark" />}</span><span className="text-xs text-muted">{product.code ?? "No code"}</span></button></td>
        <td className="px-4 py-4 text-sm font-semibold">{product.category.name}</td>
        <td className="px-4 py-4 text-xs text-muted"><span className="block font-bold text-ink">{product.variants.length} variants</span>{product.variants.filter((v) => v.isActive).map((v) => money(v.price)).join(" · ") || "None active"}</td>
        <td className="px-4 py-4 text-sm font-bold">{product.addons.length}</td><td className="px-4 py-4"><Badge tone={product.isActive ? "success" : "neutral"}>{product.isActive ? "Active" : "Inactive"}</Badge></td><td className="px-4 py-4 text-xs text-muted">{formatTimestamp(product.updatedAt, timeZone, { dateStyle: "medium" })}</td>
        <td className="px-5 py-4"><div className="flex justify-end gap-1"><Icon label="View" onClick={() => onView(product)}><Eye size={16} /></Icon>{canManage && <><Icon label="Edit" onClick={() => onEdit(product)}><Edit3 size={16} /></Icon><Icon label={product.isActive ? "Deactivate" : "Reactivate"} disabled={pendingId === product.id} onClick={() => product.isActive ? onDeactivate(product) : onReactivate(product)}>{product.isActive ? <PowerOff size={16} /> : <Power size={16} />}</Icon></>}</div></td>
      </tr>)}</tbody></table></div>
    <div className="grid gap-3 p-3 md:hidden">{products.map((product) => <article className="rounded-2xl border border-line p-4" key={product.id}><div className="flex items-start justify-between gap-3"><button className="text-left" onClick={() => onView(product)}><h3 className="font-extrabold">{product.name}</h3><p className="text-xs text-muted">{product.category.name} · {product.code ?? "No code"}</p></button><Badge tone={product.isActive ? "success" : "neutral"}>{product.isActive ? "Active" : "Inactive"}</Badge></div><div className="mt-3 text-xs text-muted">{product.variants.length} variants · {product.addons.length} add-ons · Updated {formatTimestamp(product.updatedAt, timeZone, { dateStyle: "medium" })}</div><div className="mt-4 flex gap-2 border-t border-line pt-3"><Button size="sm" variant="ghost" onClick={() => onView(product)}><Eye size={15} /> View</Button>{canManage && <Button size="sm" variant="ghost" onClick={() => onEdit(product)}><Edit3 size={15} /> Edit</Button>}{canManage && <Button size="sm" variant="ghost" disabled={pendingId === product.id} onClick={() => product.isActive ? onDeactivate(product) : onReactivate(product)}>{product.isActive ? <PowerOff size={15} /> : <Power size={15} />}{product.isActive ? "Deactivate" : "Reactivate"}</Button>}</div></article>)}</div>
  </>;
}

interface AddonListProps { addons: Addon[]; canManage: boolean; pendingId: number | null; onView: (v: Addon) => void; onEdit: (v: Addon) => void; onDeactivate: (v: Addon) => void; onReactivate: (v: Addon) => void }
export function AddonList({ addons, canManage, pendingId, onView, onEdit, onDeactivate, onReactivate }: AddonListProps) {
  const { timeZone } = useAppConfig();
  return <div className="divide-y divide-line">{addons.map((addon) => <article className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5" key={addon.id}><button className="min-w-0 flex-1 text-left" onClick={() => onView(addon)}><span className="font-extrabold text-ink">{addon.name}</span><span className="mt-1 block text-xs text-muted">{money(addon.unitPrice)} · Used by {addon.productCount} product{addon.productCount === 1 ? "" : "s"}</span></button><Badge tone={addon.isActive ? "success" : "neutral"}>{addon.isActive ? "Active" : "Inactive"}</Badge><span className="text-xs text-muted">{formatTimestamp(addon.updatedAt, timeZone, { dateStyle: "medium" })}</span><div className="flex gap-1"><Icon label="View" onClick={() => onView(addon)}><Eye size={16} /></Icon>{canManage && <><Icon label="Edit" onClick={() => onEdit(addon)}><Edit3 size={16} /></Icon><Icon label={addon.isActive ? "Deactivate" : "Reactivate"} disabled={pendingId === addon.id} onClick={() => addon.isActive ? onDeactivate(addon) : onReactivate(addon)}>{addon.isActive ? <PowerOff size={16} /> : <Power size={16} />}</Icon></>}</div></article>)}</div>;
}

function Icon({ label, disabled, children, onClick }: { label: string; disabled?: boolean; children: ReactNode; onClick: () => void }) { return <button className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-line-soft hover:text-ink disabled:opacity-50" type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}>{children}</button>; }
