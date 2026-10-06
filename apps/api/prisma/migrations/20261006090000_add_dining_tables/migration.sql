-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY');

-- CreateTable
CREATE TABLE "restaurant_tables" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "capacity" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "restaurant_tables_name_check" CHECK (length(btrim("name")) > 0),
    CONSTRAINT "restaurant_tables_capacity_check" CHECK ("capacity" IS NULL OR "capacity" BETWEEN 1 AND 100),
    CONSTRAINT "restaurant_tables_sort_order_check" CHECK ("sortOrder" >= 0)
);

-- AlterTable
ALTER TABLE "orders"
    ADD COLUMN "orderType" "OrderType" NOT NULL,
    ADD COLUMN "tableId" INTEGER,
    ADD COLUMN "tableName" VARCHAR(50),
    ADD CONSTRAINT "orders_table_assignment_check" CHECK (
        ("orderType" = 'DINE_IN' AND "tableId" IS NOT NULL AND "tableName" IS NOT NULL)
        OR
        ("orderType" = 'TAKEAWAY' AND "tableId" IS NULL AND "tableName" IS NULL)
    );

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_name_ci_key" ON "restaurant_tables" (lower("name"));
CREATE INDEX "restaurant_tables_isActive_sortOrder_name_idx" ON "restaurant_tables"("isActive", "sortOrder", "name");
CREATE INDEX "orders_orderType_createdAt_idx" ON "orders"("orderType", "createdAt");
CREATE INDEX "orders_tableId_createdAt_idx" ON "orders"("tableId", "createdAt");
CREATE UNIQUE INDEX "orders_one_open_per_table_key" ON "orders"("tableId") WHERE "status" = 'OPEN' AND "tableId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "restaurant_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
