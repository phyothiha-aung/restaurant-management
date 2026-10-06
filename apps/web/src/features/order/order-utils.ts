import type { DiscountType, OrderStatus } from "@restaurant-management/shared";

export const ORDER_STATUSES: OrderStatus[] = [
  "OPEN",
  "COMPLETED",
  "CANCELLED",
];

export const isOrderStatus = (value: string | null): value is OrderStatus =>
  ORDER_STATUSES.includes(value as OrderStatus);

export const formatOrderStatus = (status: OrderStatus) =>
  status.charAt(0) + status.slice(1).toLowerCase();

export const formatOrderNumber = (id: number) =>
  `#${id.toString().padStart(5, "0")}`;

export const orderStatusTone = (status: OrderStatus) => {
  if (status === "COMPLETED") return "success" as const;
  if (status === "CANCELLED") return "red" as const;
  return "gold" as const;
};

export const formatMoney = (value: string | number) =>
  `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value))} MMK`;

export const toMinorUnits = (value: string) => {
  const [whole = "0", fraction = ""] = value.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  return Number.isSafeInteger(minor) ? minor : 0;
};

export const percentToBasisPoints = (value: string) => {
  const [whole = "0", fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
};

export const calculateOrderTotals = (
  subtotal: number,
  discountType: DiscountType | null,
  discountValue: string,
  taxPercent: string,
) => {
  const discountAmount =
    discountType === "FIXED_AMOUNT"
      ? Math.min(subtotal, toMinorUnits(discountValue || "0"))
      : discountType === "PERCENT"
        ? Math.round((subtotal * percentToBasisPoints(discountValue || "0")) / 10_000)
        : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(
    (discountedSubtotal * percentToBasisPoints(taxPercent || "0")) / 10_000,
  );
  return {
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount: discountedSubtotal + taxAmount,
  };
};

export const minorToMoney = (minor: number) => (minor / 100).toFixed(2);

export const isValidDecimal = (value: string, maximum = 999_999_999_999.99) =>
  /^\d{1,12}(?:\.\d{1,2})?$/.test(value) && Number(value) <= maximum;

export const isValidPercent = (value: string) =>
  /^\d{1,3}(?:\.\d{1,2})?$/.test(value) && Number(value) <= 100;
