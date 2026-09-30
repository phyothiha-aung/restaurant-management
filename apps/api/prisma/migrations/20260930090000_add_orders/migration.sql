-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED_AMOUNT', 'PERCENT');

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "orders_amounts_check" CHECK (
        "subtotal" >= 0
        AND "discountValue" >= 0
        AND "discountAmount" >= 0
        AND "discountAmount" <= "subtotal"
        AND "taxPercent" >= 0
        AND "taxPercent" <= 100
        AND "taxAmount" >= 0
        AND "totalAmount" >= 0
    ),
    CONSTRAINT "orders_discount_check" CHECK (
        ("discountType" IS NULL AND "discountValue" = 0 AND "discountAmount" = 0)
        OR
        ("discountType" = 'FIXED_AMOUNT' AND "discountValue" <= "subtotal" AND "discountAmount" = "discountValue")
        OR
        ("discountType" = 'PERCENT' AND "discountValue" <= 100 AND "discountAmount" = ROUND(("subtotal" * "discountValue") / 100, 2))
    ),
    CONSTRAINT "orders_tax_check" CHECK (
        "taxAmount" = ROUND((("subtotal" - "discountAmount") * "taxPercent") / 100, 2)
    ),
    CONSTRAINT "orders_total_check" CHECK (
        "totalAmount" = "subtotal" - "discountAmount" + "taxAmount"
    ),
    CONSTRAINT "orders_status_timestamps_check" CHECK (
        ("status" = 'OPEN' AND "completedAt" IS NULL AND "cancelledAt" IS NULL)
        OR
        ("status" = 'COMPLETED' AND "completedAt" IS NOT NULL AND "cancelledAt" IS NULL)
        OR
        ("status" = 'CANCELLED' AND "cancelledAt" IS NOT NULL AND "completedAt" IS NULL)
    )
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productVariantId" INTEGER NOT NULL,
    "productName" VARCHAR(100) NOT NULL,
    "variantName" VARCHAR(50) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "baseSubtotal" DECIMAL(14,2) NOT NULL,
    "addonTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_items_quantity_check" CHECK ("quantity" >= 1),
    CONSTRAINT "order_items_amounts_check" CHECK (
        "unitPrice" >= 0
        AND "baseSubtotal" >= 0
        AND "addonTotal" >= 0
        AND "lineTotal" >= 0
    ),
    CONSTRAINT "order_items_base_subtotal_check" CHECK (
        "baseSubtotal" = "unitPrice" * "quantity"
    ),
    CONSTRAINT "order_items_line_total_check" CHECK (
        "lineTotal" = "baseSubtotal" + "addonTotal"
    )
);

-- CreateTable
CREATE TABLE "order_item_addons" (
    "orderItemId" INTEGER NOT NULL,
    "addonId" INTEGER NOT NULL,
    "addonName" VARCHAR(100) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "order_item_addons_pkey" PRIMARY KEY ("orderItemId", "addonId"),
    CONSTRAINT "order_item_addons_quantity_check" CHECK ("quantity" >= 1),
    CONSTRAINT "order_item_addons_amounts_check" CHECK (
        "unitPrice" >= 0 AND "totalAmount" >= 0
    )
);

-- CreateIndex
CREATE INDEX "orders_branchId_status_createdAt_idx" ON "orders"("branchId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_createdById_createdAt_idx" ON "orders"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productVariantId_idx" ON "order_items"("productVariantId");

-- CreateIndex
CREATE INDEX "order_item_addons_addonId_idx" ON "order_item_addons"("addonId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_addons" ADD CONSTRAINT "order_item_addons_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_addons" ADD CONSTRAINT "order_item_addons_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
