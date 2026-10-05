import type { MenuProduct } from "@restaurant-management/shared";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { formatMoney } from "../order-utils";

export interface CartAddon {
  addonId: number;
  name: string;
  unitPrice: string;
  quantity: number;
  maxQuantity: number;
  available: boolean;
  originalQuantity?: number;
}

export interface CartItem {
  clientKey: string;
  id?: number;
  productVariantId: number;
  productName: string;
  variantName: string;
  unitPrice: string;
  quantity: number;
  addons: CartAddon[];
}

interface OrderItemConfiguratorProps {
  product: MenuProduct | null;
  item?: CartItem;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}

export function OrderItemConfigurator({
  product,
  item,
  onClose,
  onAdd,
}: OrderItemConfiguratorProps) {
  if (!product) return null;
  return (
    <OrderItemConfiguratorDialog
      key={`${product.id}-${item?.clientKey ?? "new"}`}
      product={product}
      item={item}
      onClose={onClose}
      onAdd={onAdd}
    />
  );
}

function OrderItemConfiguratorDialog({
  product,
  item,
  onClose,
  onAdd,
}: {
  product: MenuProduct;
  item?: CartItem;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [variantId, setVariantId] = useState<number | null>(
    item?.productVariantId ?? product.variants[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [addons, setAddons] = useState<Record<number, number>>(() =>
    Object.fromEntries(item?.addons.map((addon) => [addon.addonId, addon.quantity]) ?? []),
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  const variant = useMemo(
    () => product?.variants.find((entry) => entry.id === variantId),
    [product, variantId],
  );
  const addonOptions = useMemo(() => {
    const options = product.addons.map((addon) => ({
      id: addon.id,
      name: addon.name,
      unitPrice: addon.unitPrice,
      maxQuantity: Math.max(
        addon.maxQuantity,
        item?.addons.find((entry) => entry.addonId === addon.id)?.originalQuantity ?? 0,
      ),
      available: true,
      originalQuantity: item?.addons.find((entry) => entry.addonId === addon.id)?.originalQuantity,
    }));
    for (const existing of item?.addons ?? []) {
      if (options.some((option) => option.id === existing.addonId)) continue;
      options.push({
        id: existing.addonId,
        name: existing.name,
        unitPrice: existing.unitPrice,
        maxQuantity: existing.originalQuantity ?? existing.quantity,
        available: false,
        originalQuantity: existing.originalQuantity ?? existing.quantity,
      });
    }
    return options;
  }, [item, product.addons]);

  const toggleAddon = (addonId: number) => {
    setAddons((current) => {
      const next = { ...current };
      if (next[addonId]) delete next[addonId];
      else next[addonId] = 1;
      return next;
    });
  };

  const submit = () => {
    if (!variant) return;
    onAdd({
      clientKey: item?.clientKey ?? crypto.randomUUID(),
      ...(item?.id && { id: item.id }),
      productVariantId: variant.id,
      productName: product.name,
      variantName: variant.name,
      unitPrice: variant.price,
      quantity,
      addons: addonOptions
        .filter((addon) => addons[addon.id])
        .map((addon) => ({
          addonId: addon.id,
          name: addon.name,
          unitPrice: addon.unitPrice,
          quantity: addons[addon.id],
          maxQuantity: addon.maxQuantity,
          available: addon.available,
          originalQuantity: addon.originalQuantity,
        })),
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/45"
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
    >
      <div className="flex items-start justify-between border-b border-line p-5">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-brand-red">Add to order</p>
          <h2 className="mt-1 text-xl font-extrabold" id={titleId}>{item ? `Customize ${product.name}` : product.name}</h2>
          {product.description && <p className="mt-1 text-sm text-muted">{product.description}</p>}
        </div>
        <Button className="h-9 w-9 px-0" size="sm" variant="ghost" aria-label="Close" onClick={onClose}><X size={18} /></Button>
      </div>

      <div className="max-h-[65vh] space-y-6 overflow-y-auto p-5">
        <fieldset>
          <legend className="text-sm font-extrabold">Choose a variant</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {product.variants.filter((entry) => !item || entry.id === item.productVariantId).map((entry) => (
              <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${variantId === entry.id ? "border-brand-red bg-brand-red-soft" : "border-line hover:border-brand-gold"}`} key={entry.id}>
                <span className="flex items-center gap-2"><input type="radio" name="variant" checked={variantId === entry.id} onChange={() => setVariantId(entry.id)} /><span className="text-sm font-bold">{entry.name}</span></span>
                <span className="text-xs font-extrabold">{formatMoney(entry.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {addonOptions.length > 0 && (
          <fieldset>
            <legend className="text-sm font-extrabold">Add-ons</legend>
            <div className="mt-3 space-y-2">
              {addonOptions.map((addon) => {
                const selected = Boolean(addons[addon.id]);
                return (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-line p-3" key={addon.id}>
                    <label className="flex min-w-0 cursor-pointer items-center gap-3">
                      <input type="checkbox" checked={selected} onChange={() => toggleAddon(addon.id)} />
                      <span><span className="block text-sm font-bold">{addon.name}</span><span className="text-xs text-muted">+ {formatMoney(addon.unitPrice)} each{addon.available ? "" : " · unavailable, retain or reduce"}</span></span>
                    </label>
                    {selected && (
                      <QuantityControl value={addons[addon.id]} max={addon.maxQuantity} onChange={(value) => setAddons((current) => ({ ...current, [addon.id]: value }))} label={`${addon.name} quantity`} />
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        )}

        <div>
          <p className="text-sm font-extrabold">Item quantity</p>
          <div className="mt-2"><QuantityControl value={quantity} max={999} onChange={setQuantity} label="Item quantity" /></div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-line p-5">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={!variant} onClick={submit}><ShoppingCart size={17} /> {item ? "Update item" : "Add item"}</Button>
      </div>
    </dialog>
  );
}

export function QuantityControl({ value, max, label, onChange }: { value: number; max: number; label: string; onChange: (value: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-white">
      <button className="grid h-9 w-9 place-items-center text-muted disabled:opacity-35" type="button" aria-label={`Decrease ${label}`} disabled={value <= 1} onClick={() => onChange(value - 1)}><Minus size={14} /></button>
      <span className="min-w-8 text-center text-sm font-extrabold" aria-label={label}>{value}</span>
      <button className="grid h-9 w-9 place-items-center text-muted disabled:opacity-35" type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={14} /></button>
    </div>
  );
}
