import type {
  DiscountType,
  MenuProduct,
  Order,
  OrderType,
} from "@restaurant-management/shared";
import {
  AlertCircle,
  ArrowLeft,
  Armchair,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useNavigate } from "react-router";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useAuthStore } from "../../../store/useAuthStore";
import { useDiningTables } from "../../dining-table/dining-table-services";
import {
  useCreateOrder,
  useOrderMenu,
  useUpdateOrder,
} from "../order-services";
import { useAppConfig } from "../../app-config/app-config-context";
import {
  calculateOrderTotals,
  formatMoney,
  formatOrderNumber,
  isValidDecimal,
  isValidPercent,
  minorToMoney,
  toMinorUnits,
} from "../order-utils";
import {
  OrderItemConfigurator,
  QuantityControl,
  type CartItem,
} from "./OrderItemConfigurator";

interface OrderEditorProps {
  order?: Order;
}

export function OrderEditor({ order }: OrderEditorProps) {
  const actor = useAuthStore((state) => state.user);
  const { restaurantLogoUrl } = useAppConfig();
  const navigate = useNavigate();
  const menuQuery = useOrderMenu();
  const tablesQuery = useDiningTables({ status: "AVAILABLE" });
  const [cart, setCart] = useState<CartItem[]>(() =>
    order ? cartFromOrder(order) : [],
  );
  const [orderType, setOrderType] = useState<OrderType>(
    order?.orderType ?? "TAKEAWAY",
  );
  const [tableId, setTableId] = useState(order?.tableId?.toString() ?? "");
  const [discountType, setDiscountType] = useState<DiscountType | null>(
    order?.discountType ?? null,
  );
  const [discountValue, setDiscountValue] = useState(
    order?.discountValue ?? "0",
  );
  const [taxPercent, setTaxPercent] = useState(order?.taxPercent ?? "0");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [configuration, setConfiguration] = useState<{
    product: MenuProduct;
    item?: CartItem;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialSnapshot] = useState(() =>
    snapshot(
      order ? cartFromOrder(order) : [],
      order?.orderType ?? "TAKEAWAY",
      order?.tableId?.toString() ?? "",
      order?.discountType ?? null,
      order?.discountValue ?? "0",
      order?.taxPercent ?? "0",
    ),
  );
  const allowNavigation = useRef(false);

  const currentSnapshot = snapshot(
    cart,
    orderType,
    tableId,
    discountType,
    discountValue,
    taxPercent,
  );
  const isDirty = initialSnapshot !== currentSnapshot;
  const blocker = useBlocker(() => isDirty && !allowNavigation.current);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const createMutation = useCreateOrder();
  const updateMutation = useUpdateOrder();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const subtotal = cart.reduce((sum, item) => {
    const addons = item.addons.reduce(
      (addonSum, addon) =>
        addonSum + toMinorUnits(addon.unitPrice) * addon.quantity,
      0,
    );
    return sum + (toMinorUnits(item.unitPrice) + addons) * item.quantity;
  }, 0);
  const totals = calculateOrderTotals(
    subtotal,
    discountType,
    discountValue,
    taxPercent,
  );

  const effectiveCategoryId =
    categoryId !== null &&
    (menuQuery.data ?? []).some((product) => product.category.id === categoryId)
      ? categoryId
      : null;
  const filteredMenu = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    return (menuQuery.data ?? []).filter(
      (product) =>
        (effectiveCategoryId === null ||
          product.category.id === effectiveCategoryId) &&
        (!normalized ||
          product.name.toLocaleLowerCase().includes(normalized) ||
          product.code?.toLocaleLowerCase().includes(normalized)),
    );
  }, [effectiveCategoryId, menuQuery.data, search]);
  const menuCategories = useMemo(() => {
    const values = new Map<number, string>();
    for (const product of menuQuery.data ?? [])
      values.set(product.category.id, product.category.name);
    return [...values.entries()];
  }, [menuQuery.data]);
  const categories = useMemo(() => {
    const groups = new Map<number, { name: string; products: MenuProduct[] }>();
    for (const product of filteredMenu) {
      const group = groups.get(product.category.id) ?? {
        name: product.category.name,
        products: [],
      };
      group.products.push(product);
      groups.set(product.category.id, group);
    }
    return [...groups.entries()];
  }, [filteredMenu]);

  if (!actor) return null;

  const addItem = (item: CartItem) => {
    setCart((current) => {
      if (item.id) {
        return current.map((entry) =>
          entry.clientKey === item.clientKey ? item : entry,
        );
      }
      const signature = itemSignature(item);
      const withoutEdited = current.filter(
        (entry) => entry.clientKey !== item.clientKey,
      );
      const match = withoutEdited.find(
        (entry) => !entry.id && itemSignature(entry) === signature,
      );
      if (!match) return [...withoutEdited, item];
      return withoutEdited.map((entry) =>
        entry.clientKey === match.clientKey
          ? { ...entry, quantity: entry.quantity + item.quantity }
          : entry,
      );
    });
    setConfiguration(null);
    setError(null);
  };

  const updateItem = (key: string, updater: (item: CartItem) => CartItem) =>
    setCart((current) =>
      current.map((item) => (item.clientKey === key ? updater(item) : item)),
    );

  const save = async () => {
    setError(null);
    if (cart.length === 0)
      return setError("Add at least one item before saving the order.");
    if (orderType === "DINE_IN" && !tableId)
      return setError("Choose an available table for this dine-in order.");
    if (!isValidPercent(taxPercent))
      return setError(
        "Tax must be between 0 and 100 with at most two decimal places.",
      );
    if (discountType && !isValidDecimal(discountValue))
      return setError(
        "Enter a valid discount with at most two decimal places.",
      );
    if (discountType === "PERCENT" && !isValidPercent(discountValue))
      return setError("Percentage discount must be between 0 and 100.");
    if (
      discountType === "FIXED_AMOUNT" &&
      toMinorUnits(discountValue) > subtotal
    )
      return setError("Fixed discount cannot exceed the subtotal.");

    const items = cart.map((item) => ({
      ...(item.id && { id: item.id }),
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      addons: item.addons.map((addon) => ({
        addonId: addon.addonId,
        quantity: addon.quantity,
      })),
    }));
    const discount = discountType
      ? { type: discountType, value: discountValue }
      : null;
    try {
      const saved = order
        ? await updateMutation.mutateAsync({
            id: order.id,
            input: {
              orderType,
              tableId: orderType === "DINE_IN" ? Number(tableId) : null,
              items,
              discount,
              taxPercent,
            },
          })
        : await createMutation.mutateAsync({
            orderType,
            tableId: orderType === "DINE_IN" ? Number(tableId) : null,
            items: items.map(({ id: _id, ...item }) => item),
            discount,
            taxPercent,
          });
      allowNavigation.current = true;
      navigate(`/orders/${saved.id}`, { replace: true });
    } catch {
      // Mutation hooks surface the API message and the editor remains open.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-ink"
          to={order ? `/orders/${order.id}` : "/orders"}
        >
          <ArrowLeft size={16} /> {order ? "Back to order" : "Back to orders"}
        </Link>
        <div className="mt-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-red">
            Point of sale
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold">
            {order ? `Edit order ${formatOrderNumber(order.id)}` : "New order"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Choose menu items, configure options, and save an open order.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="overflow-hidden">
          <div className="space-y-3 border-b border-line p-4">
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                size={17}
              />
              <input
                className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft"
                type="search"
                value={search}
                placeholder="Search menu products"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {menuCategories.length > 0 && (
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                role="group"
                aria-label="Filter products by category"
              >
                <CategoryButton
                  active={effectiveCategoryId === null}
                  label="All"
                  onClick={() => setCategoryId(null)}
                />
                {menuCategories.map(([id, name]) => (
                  <CategoryButton
                    active={effectiveCategoryId === id}
                    label={name}
                    onClick={() => setCategoryId(id)}
                    key={id}
                  />
                ))}
              </div>
            )}
          </div>
          {menuQuery.isPending ? (
            <div className="grid animate-pulse gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  className="aspect-video rounded-xl bg-line-soft"
                  key={item}
                />
              ))}
            </div>
          ) : menuQuery.isError ? (
            <div className="grid min-h-64 place-items-center p-6 text-center">
              <div>
                <AlertCircle className="mx-auto text-brand-red" />
                <p className="mt-3 text-sm text-muted">
                  The menu could not be loaded.
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => void menuQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="grid min-h-64 place-items-center p-6 text-center text-sm text-muted">
              No active menu products match the selected category and search.
            </div>
          ) : (
            <div className="space-y-6 p-4 sm:p-5">
              {categories.map(([groupId, category]) => (
                <section key={groupId}>
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted">
                    {category.name}
                  </h2>
                  <div className="mt-3 grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {category.products.map((product) => (
                      <button
                        className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white text-left transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-card"
                        type="button"
                        key={product.id}
                        onClick={() => setConfiguration({ product })}
                      >
                        <ProductThumbnail
                          product={product}
                          fallbackUrl={restaurantLogoUrl ?? "/icon.jpg"}
                        />
                        <span className="flex flex-1 flex-col px-4 py-3">
                          <span className="line-clamp-1 block font-extrabold text-ink">
                            {product.name}
                          </span>
                          <span className="line-clamp-2 block text-xs leading-5 text-muted">
                            {product.description ?? ""}
                          </span>
                          <span className="mt-auto block pt-1.5 text-xs font-bold text-brand-red">
                            From{" "}
                            {formatMoney(product.variants[0]?.price ?? "0")}
                          </span>
                          <span className="mt-1 block text-[0.68rem] text-muted">
                            {product.variants.length} variant
                            {product.variants.length === 1 ? "" : "s"} ·{" "}
                            {product.addons.length} add-on
                            {product.addons.length === 1 ? "" : "s"}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </Card>

        <div className="xl:sticky xl:top-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-brand-red" size={19} />
                <h2 className="font-extrabold">Current order</h2>
              </div>
              <span className="text-xs font-bold text-muted">
                {cart.length} line{cart.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-3 border-b border-line bg-brand-gold-soft/50 p-4">
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="Order type"
              >
                {(["TAKEAWAY", "DINE_IN"] as OrderType[]).map((type) => (
                  <button
                    className={`min-h-10 rounded-xl border px-3 text-sm font-bold transition ${orderType === type ? "border-brand-red bg-brand-red text-white" : "border-line bg-white text-ink"}`}
                    type="button"
                    key={type}
                    onClick={() => {
                      setOrderType(type);
                      if (type === "TAKEAWAY") setTableId("");
                      setError(null);
                    }}
                  >
                    {type === "DINE_IN" ? "Dine in" : "Takeaway"}
                  </button>
                ))}
              </div>
              {orderType === "DINE_IN" && (
                <label className="grid gap-1.5">
                  <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-muted">
                    <Armchair size={14} /> Table
                  </span>
                  <select
                    className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft disabled:bg-line-soft"
                    value={tableId}
                    disabled={tablesQuery.isPending || tablesQuery.isError}
                    onChange={(event) => {
                      setTableId(event.target.value);
                      setError(null);
                    }}
                  >
                    <option value="">
                      {tablesQuery.isPending
                        ? "Loading tables..."
                        : tablesQuery.isError
                          ? "Tables unavailable"
                          : "Choose an available table"}
                    </option>
                    {order?.tableId &&
                      !tablesQuery.data?.some(
                        (table) => table.id === order.tableId,
                      ) && (
                        <option value={order.tableId}>
                          {order.tableName ??
                            order.table?.name ??
                            "Current table"}
                        </option>
                      )}
                    {(tablesQuery.data ?? []).map((table) => (
                      <option value={table.id} key={table.id}>
                        {table.name}
                        {table.capacity ? ` · ${table.capacity} seats` : ""}
                      </option>
                    ))}
                  </select>
                  {tablesQuery.isError && (
                    <button
                      className="justify-self-start text-xs font-bold text-brand-red hover:underline"
                      type="button"
                      onClick={() => void tablesQuery.refetch()}
                    >
                      Retry loading tables
                    </button>
                  )}
                </label>
              )}
            </div>
            {cart.length === 0 ? (
              <div className="grid min-h-44 place-items-center p-6 text-center">
                <div>
                  <ShoppingBag className="mx-auto text-brand-gold-dark" />
                  <p className="mt-3 text-sm font-bold">Your order is empty</p>
                  <p className="mt-1 text-xs text-muted">
                    Choose a product to add the first item.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-h-[45vh] divide-y divide-line overflow-y-auto">
                {cart.map((item) => {
                  const product = (menuQuery.data ?? []).find((entry) =>
                    entry.variants.some(
                      (variant) => variant.id === item.productVariantId,
                    ),
                  );
                  return (
                    <CartRow
                      key={item.clientKey}
                      item={item}
                      product={product}
                      onCustomize={
                        product
                          ? () => setConfiguration({ product, item })
                          : undefined
                      }
                      onRemove={() =>
                        setCart((current) =>
                          current.filter(
                            (entry) => entry.clientKey !== item.clientKey,
                          ),
                        )
                      }
                      onQuantity={(quantity) =>
                        updateItem(item.clientKey, (current) => ({
                          ...current,
                          quantity,
                        }))
                      }
                      onAddonQuantity={(addonId, quantity) =>
                        updateItem(item.clientKey, (current) => ({
                          ...current,
                          addons:
                            quantity === 0
                              ? current.addons.filter(
                                  (addon) => addon.addonId !== addonId,
                                )
                              : current.addons.map((addon) =>
                                  addon.addonId === addonId
                                    ? { ...addon, quantity }
                                    : addon,
                                ),
                        }))
                      }
                    />
                  );
                })}
              </div>
            )}

            <div className="space-y-4 border-t border-line bg-surface p-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wide text-muted">
                  Discount
                </span>
                <div className="grid grid-cols-[8rem_1fr] gap-2">
                  <select
                    className="min-h-10 rounded-xl border border-line bg-white px-2 text-xs font-bold"
                    value={discountType ?? "NONE"}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDiscountType(
                        value === "NONE" ? null : (value as DiscountType),
                      );
                      setDiscountValue("0");
                    }}
                  >
                    <option value="NONE">No discount</option>
                    <option value="FIXED_AMOUNT">Fixed amount</option>
                    <option value="PERCENT">Percent</option>
                  </select>
                  <input
                    className="min-h-10 min-w-0 rounded-xl border border-line bg-white px-3 text-sm font-semibold disabled:bg-line-soft"
                    inputMode="decimal"
                    disabled={!discountType}
                    value={discountValue}
                    onChange={(event) => setDiscountValue(event.target.value)}
                    aria-label="Discount value"
                  />
                </div>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wide text-muted">
                  Tax percent
                </span>
                <input
                  className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm font-semibold"
                  inputMode="decimal"
                  value={taxPercent}
                  onChange={(event) => setTaxPercent(event.target.value)}
                />
              </label>
              <dl className="space-y-2 border-t border-line pt-3 text-sm">
                <MoneyRow label="Subtotal" value={totals.subtotal} />
                <MoneyRow label="Discount" value={-totals.discountAmount} />
                <MoneyRow label="Tax" value={totals.taxAmount} />
                <div className="border-t border-line pt-2">
                  <MoneyRow label="Total" value={totals.totalAmount} strong />
                </div>
              </dl>
              {error && (
                <p
                  className="rounded-xl bg-brand-red-soft p-3 text-xs font-semibold text-brand-red"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <Button
                className="w-full"
                isLoading={isSaving}
                loadingLabel="Saving order..."
                disabled={cart.length === 0}
                onClick={() => void save()}
              >
                Save open order
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <OrderItemConfigurator
        product={configuration?.product ?? null}
        item={configuration?.item}
        onClose={() => setConfiguration(null)}
        onAdd={addItem}
      />
      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Leave without saving?"
        description="Your unsaved order changes will be lost."
        confirmLabel="Leave page"
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />
    </div>
  );
}

function CategoryButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-h-9 shrink-0 rounded-full border px-4 text-xs font-extrabold transition ${active ? "border-brand-red bg-brand-red text-white" : "border-line bg-white text-muted hover:border-brand-gold hover:text-ink"}`}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ProductThumbnail({
  product,
  fallbackUrl,
}: {
  product: MenuProduct;
  fallbackUrl: string;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !product.imageUrl || failed;
  return (
    <span className="aspect-video grid w-full shrink-0 place-items-center overflow-hidden bg-line-soft">
      <img
        className={
          showFallback
            ? "h-full w-full object-cover opacity-55"
            : "h-full w-full object-cover"
        }
        src={showFallback ? fallbackUrl : product.imageUrl!}
        alt=""
        loading="lazy"
        onError={(event) => {
          if (!showFallback) setFailed(true);
          else if (!event.currentTarget.src.endsWith("/icon.jpg"))
            event.currentTarget.src = "/icon.jpg";
        }}
      />
    </span>
  );
}

function CartRow({
  item,
  product,
  onCustomize,
  onRemove,
  onQuantity,
  onAddonQuantity,
}: {
  item: CartItem;
  product?: MenuProduct;
  onCustomize?: () => void;
  onRemove: () => void;
  onQuantity: (value: number) => void;
  onAddonQuantity: (addonId: number, value: number) => void;
}) {
  const lineMinor =
    (toMinorUnits(item.unitPrice) +
      item.addons.reduce(
        (sum, addon) => sum + toMinorUnits(addon.unitPrice) * addon.quantity,
        0,
      )) *
    item.quantity;
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold">{item.productName}</h3>
          <p className="mt-0.5 text-xs text-muted">
            {item.variantName} · {formatMoney(item.unitPrice)}
          </p>
          {onCustomize && (
            <button
              className="mt-1 text-xs font-bold text-brand-red hover:underline"
              type="button"
              onClick={onCustomize}
            >
              Customize
            </button>
          )}
        </div>
        <button
          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-brand-red-soft hover:text-brand-red"
          type="button"
          aria-label={`Remove ${item.productName}`}
          onClick={onRemove}
        >
          <Trash2 size={15} />
        </button>
      </div>
      {item.addons.length > 0 && (
        <div className="mt-3 space-y-2">
          {item.addons.map((addon) => {
            const active = product?.addons.find(
              (entry) => entry.id === addon.addonId,
            );
            const available = addon.available || Boolean(active);
            const increaseLimit = available
              ? Math.max(
                  addon.maxQuantity,
                  active?.maxQuantity ?? 1,
                  addon.originalQuantity ?? 1,
                )
              : (addon.originalQuantity ?? addon.quantity);
            return (
              <div
                className="flex items-center justify-between gap-2 text-xs"
                key={addon.addonId}
              >
                <div className="min-w-0">
                  <span className="block truncate text-muted">
                    + {addon.name}
                  </span>
                  {!available && (
                    <span className="text-[0.65rem] font-bold text-brand-red">
                      Unavailable · retain or reduce
                    </span>
                  )}
                </div>
                <div className="inline-flex items-center rounded-lg border border-line">
                  <button
                    className="grid h-7 w-7 place-items-center"
                    type="button"
                    aria-label={`Decrease ${addon.name}`}
                    onClick={() =>
                      onAddonQuantity(addon.addonId, addon.quantity - 1)
                    }
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center font-bold">
                    {addon.quantity}
                  </span>
                  <button
                    className="grid h-7 w-7 place-items-center disabled:opacity-30"
                    type="button"
                    disabled={addon.quantity >= increaseLimit}
                    aria-label={`Increase ${addon.name}`}
                    onClick={() =>
                      onAddonQuantity(addon.addonId, addon.quantity + 1)
                    }
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <QuantityControl
          value={item.quantity}
          max={999}
          label={`${item.productName} quantity`}
          onChange={onQuantity}
        />
        <span className="text-sm font-extrabold">
          {formatMoney(minorToMoney(lineMinor))}
        </span>
      </div>
    </article>
  );
}

function MoneyRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${strong ? "text-base font-extrabold" : "text-muted"}`}
    >
      <dt>{label}</dt>
      <dd className={strong ? "text-brand-red" : "font-bold text-ink"}>
        {value < 0 ? "− " : ""}
        {formatMoney(minorToMoney(Math.abs(value)))}
      </dd>
    </div>
  );
}

const itemSignature = (item: CartItem) =>
  `${item.productVariantId}:${[...item.addons]
    .sort((a, b) => a.addonId - b.addonId)
    .map((addon) => `${addon.addonId}-${addon.quantity}`)
    .join(",")}`;
const snapshot = (
  cart: CartItem[],
  orderType: OrderType,
  tableId: string,
  discountType: DiscountType | null,
  discountValue: string,
  taxPercent: string,
) =>
  JSON.stringify({
    cart,
    orderType,
    tableId,
    discountType,
    discountValue,
    taxPercent,
  });

const cartFromOrder = (order: Order): CartItem[] =>
  order.items.map((item) => ({
    clientKey: `existing-${item.id}`,
    id: item.id,
    productVariantId: item.productVariantId,
    productName: item.productName,
    variantName: item.variantName,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    addons: item.addons.map((addon) => ({
      addonId: addon.addonId,
      name: addon.addonName,
      unitPrice: addon.unitPrice,
      quantity: addon.quantity,
      maxQuantity: addon.quantity,
      available: false,
      originalQuantity: addon.quantity,
    })),
  }));
