-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnums
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'OWNER', 'MANAGER', 'WAITER', 'CHEF', 'CASHIER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'INACTIVE');
CREATE TYPE "ExpenseCategory" AS ENUM ('INGREDIENTS', 'UTILITIES', 'RENT', 'WAGES', 'MAINTENANCE', 'SUPPLIES', 'TRANSPORT', 'MARKETING', 'TAXES_AND_FEES', 'OTHER');
CREATE TYPE "ExpenseStatus" AS ENUM ('ACTIVE', 'VOIDED');
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY');
CREATE TYPE "DiscountType" AS ENUM ('FIXED_AMOUNT', 'PERCENT');
CREATE TYPE "StoredFilePurpose" AS ENUM ('EXPENSE', 'RECIPE', 'PRODUCT');
CREATE TYPE "StoredFileStatus" AS ENUM ('PENDING', 'READY', 'REJECTED');

-- CreateTables
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "jti" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'WAITER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "username" TEXT,
    "pinHash" TEXT,
    "lastLoginAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "voidedById" INTEGER,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "expenseDate" DATE NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "voidReason" VARCHAR(300),
    "voidedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stored_files" (
    "id" TEXT NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "objectKey" VARCHAR(500) NOT NULL,
    "purpose" "StoredFilePurpose" NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "StoredFileStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "readyAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expense_attachments" (
    "id" SERIAL NOT NULL,
    "expenseId" INTEGER NOT NULL,
    "fileId" TEXT NOT NULL,
    "attachedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expense_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_categories_sortOrder_check" CHECK ("sortOrder" >= 0)
);

CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "code" VARCHAR(30),
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "products_sortOrder_check" CHECK ("sortOrder" >= 0)
);

CREATE TABLE "product_variants" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_variants_price_check" CHECK ("price" >= 0),
    CONSTRAINT "product_variants_sortOrder_check" CHECK ("sortOrder" >= 0)
);

CREATE TABLE "addons" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "addons_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "addons_unitPrice_check" CHECK ("unitPrice" >= 0)
);

CREATE TABLE "product_addons" (
    "productId" INTEGER NOT NULL,
    "addonId" INTEGER NOT NULL,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "product_addons_pkey" PRIMARY KEY ("productId", "addonId"),
    CONSTRAINT "product_addons_maxQuantity_check" CHECK ("maxQuantity" >= 1),
    CONSTRAINT "product_addons_sortOrder_check" CHECK ("sortOrder" >= 0)
);

CREATE TABLE "product_images" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "fileId" TEXT NOT NULL,
    "attachedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "restaurant_tables" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "capacity" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "restaurant_tables_name_check" CHECK (length(btrim("name")) > 0),
    CONSTRAINT "restaurant_tables_capacity_check" CHECK ("capacity" IS NULL OR "capacity" BETWEEN 1 AND 100),
    CONSTRAINT "restaurant_tables_sort_order_check" CHECK ("sortOrder" >= 0)
);

CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "tableId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "orderType" "OrderType" NOT NULL,
    "tableName" VARCHAR(50),
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "orders_amounts_check" CHECK (
        "subtotal" >= 0 AND "discountValue" >= 0 AND "discountAmount" >= 0
        AND "discountAmount" <= "subtotal" AND "taxPercent" BETWEEN 0 AND 100
        AND "taxAmount" >= 0 AND "totalAmount" >= 0
    ),
    CONSTRAINT "orders_discount_check" CHECK (
        ("discountType" IS NULL AND "discountValue" = 0 AND "discountAmount" = 0)
        OR ("discountType" = 'FIXED_AMOUNT' AND "discountValue" <= "subtotal" AND "discountAmount" = "discountValue")
        OR ("discountType" = 'PERCENT' AND "discountValue" <= 100 AND "discountAmount" = ROUND(("subtotal" * "discountValue") / 100, 2))
    ),
    CONSTRAINT "orders_tax_check" CHECK ("taxAmount" = ROUND((("subtotal" - "discountAmount") * "taxPercent") / 100, 2)),
    CONSTRAINT "orders_total_check" CHECK ("totalAmount" = "subtotal" - "discountAmount" + "taxAmount"),
    CONSTRAINT "orders_status_timestamps_check" CHECK (
        ("status" = 'OPEN' AND "completedAt" IS NULL AND "cancelledAt" IS NULL)
        OR ("status" = 'COMPLETED' AND "completedAt" IS NOT NULL AND "cancelledAt" IS NULL)
        OR ("status" = 'CANCELLED' AND "cancelledAt" IS NOT NULL AND "completedAt" IS NULL)
    ),
    CONSTRAINT "orders_table_assignment_check" CHECK (
        ("orderType" = 'DINE_IN' AND "tableId" IS NOT NULL AND "tableName" IS NOT NULL)
        OR ("orderType" = 'TAKEAWAY' AND "tableId" IS NULL AND "tableName" IS NULL)
    )
);

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
    CONSTRAINT "order_items_amounts_check" CHECK ("unitPrice" >= 0 AND "baseSubtotal" >= 0 AND "addonTotal" >= 0 AND "lineTotal" >= 0),
    CONSTRAINT "order_items_base_subtotal_check" CHECK ("baseSubtotal" = "unitPrice" * "quantity"),
    CONSTRAINT "order_items_line_total_check" CHECK ("lineTotal" = "baseSubtotal" + "addonTotal")
);

CREATE TABLE "order_item_addons" (
    "orderItemId" INTEGER NOT NULL,
    "addonId" INTEGER NOT NULL,
    "addonName" VARCHAR(100) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    CONSTRAINT "order_item_addons_pkey" PRIMARY KEY ("orderItemId", "addonId"),
    CONSTRAINT "order_item_addons_quantity_check" CHECK ("quantity" >= 1),
    CONSTRAINT "order_item_addons_amounts_check" CHECK ("unitPrice" >= 0 AND "totalAmount" >= 0)
);

-- Prisma-managed indexes
CREATE UNIQUE INDEX "refresh_tokens_jti_key" ON "refresh_tokens"("jti");
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");
CREATE INDEX "expenses_status_expenseDate_idx" ON "expenses"("status", "expenseDate");
CREATE INDEX "expenses_category_expenseDate_idx" ON "expenses"("category", "expenseDate");
CREATE INDEX "expenses_createdById_idx" ON "expenses"("createdById");
CREATE UNIQUE INDEX "stored_files_objectKey_key" ON "stored_files"("objectKey");
CREATE INDEX "stored_files_uploadedById_status_idx" ON "stored_files"("uploadedById", "status");
CREATE INDEX "stored_files_status_expiresAt_idx" ON "stored_files"("status", "expiresAt");
CREATE UNIQUE INDEX "expense_attachments_fileId_key" ON "expense_attachments"("fileId");
CREATE INDEX "expense_attachments_expenseId_idx" ON "expense_attachments"("expenseId");
CREATE INDEX "expense_attachments_attachedById_idx" ON "expense_attachments"("attachedById");
CREATE INDEX "product_categories_isActive_sortOrder_name_idx" ON "product_categories"("isActive", "sortOrder", "name");
CREATE INDEX "products_categoryId_isActive_sortOrder_name_idx" ON "products"("categoryId", "isActive", "sortOrder", "name");
CREATE INDEX "product_variants_productId_isActive_sortOrder_name_idx" ON "product_variants"("productId", "isActive", "sortOrder", "name");
CREATE INDEX "addons_isActive_name_idx" ON "addons"("isActive", "name");
CREATE INDEX "product_addons_addonId_idx" ON "product_addons"("addonId");
CREATE INDEX "product_addons_productId_sortOrder_idx" ON "product_addons"("productId", "sortOrder");
CREATE UNIQUE INDEX "product_images_productId_key" ON "product_images"("productId");
CREATE UNIQUE INDEX "product_images_fileId_key" ON "product_images"("fileId");
CREATE INDEX "product_images_attachedById_idx" ON "product_images"("attachedById");
CREATE INDEX "restaurant_tables_isActive_sortOrder_name_idx" ON "restaurant_tables"("isActive", "sortOrder", "name");
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");
CREATE INDEX "orders_status_completedAt_idx" ON "orders"("status", "completedAt");
CREATE INDEX "orders_orderType_createdAt_idx" ON "orders"("orderType", "createdAt");
CREATE INDEX "orders_tableId_createdAt_idx" ON "orders"("tableId", "createdAt");
CREATE INDEX "orders_createdById_createdAt_idx" ON "orders"("createdById", "createdAt");
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX "order_items_productVariantId_idx" ON "order_items"("productVariantId");
CREATE INDEX "order_item_addons_addonId_idx" ON "order_item_addons"("addonId");

-- Functional and partial indexes not expressible in Prisma schema
CREATE UNIQUE INDEX "product_categories_name_ci_key" ON "product_categories" (LOWER("name"));
CREATE UNIQUE INDEX "products_code_ci_key" ON "products" (LOWER("code")) WHERE "code" IS NOT NULL;
CREATE UNIQUE INDEX "products_categoryId_name_ci_key" ON "products" ("categoryId", LOWER("name"));
CREATE UNIQUE INDEX "product_variants_productId_name_ci_key" ON "product_variants" ("productId", LOWER("name"));
CREATE UNIQUE INDEX "addons_name_ci_key" ON "addons" (LOWER("name"));
CREATE UNIQUE INDEX "restaurant_tables_name_ci_key" ON "restaurant_tables" (LOWER("name"));
CREATE UNIQUE INDEX "orders_one_open_per_table_key" ON "orders"("tableId") WHERE "status" = 'OPEN' AND "tableId" IS NOT NULL;

-- Foreign keys
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_attachedById_fkey" FOREIGN KEY ("attachedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_attachedById_fkey" FOREIGN KEY ("attachedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "restaurant_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_item_addons" ADD CONSTRAINT "order_item_addons_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_item_addons" ADD CONSTRAINT "order_item_addons_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
