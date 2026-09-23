-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "code" VARCHAR(30),
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "products_sortOrder_check" CHECK ("sortOrder" >= 0)
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_variants_price_check" CHECK ("price" >= 0),
    CONSTRAINT "product_variants_sortOrder_check" CHECK ("sortOrder" >= 0)
);

-- CreateTable
CREATE TABLE "product_addons" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_addons_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_addons_unitPrice_check" CHECK ("unitPrice" >= 0),
    CONSTRAINT "product_addons_maxQuantity_check" CHECK ("maxQuantity" >= 1),
    CONSTRAINT "product_addons_sortOrder_check" CHECK ("sortOrder" >= 0)
);

-- CreateTable
CREATE TABLE "branch_product_overrides" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_product_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_product_variant_overrides" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "priceOverride" DECIMAL(14,2),
    "isAvailable" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_product_variant_overrides_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "branch_product_variant_overrides_price_check" CHECK ("priceOverride" IS NULL OR "priceOverride" >= 0),
    CONSTRAINT "branch_product_variant_overrides_value_check" CHECK ("priceOverride" IS NOT NULL OR "isAvailable" IS NOT NULL)
);

-- CreateTable
CREATE TABLE "branch_product_addon_overrides" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "addonId" INTEGER NOT NULL,
    "priceOverride" DECIMAL(14,2),
    "isAvailable" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_product_addon_overrides_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "branch_product_addon_overrides_price_check" CHECK ("priceOverride" IS NULL OR "priceOverride" >= 0),
    CONSTRAINT "branch_product_addon_overrides_value_check" CHECK ("priceOverride" IS NOT NULL OR "isAvailable" IS NOT NULL)
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "fileId" TEXT NOT NULL,
    "attachedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_code_ci_key" ON "products" (LOWER("code")) WHERE "code" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "products_categoryId_name_ci_key" ON "products" ("categoryId", LOWER("name"));

-- CreateIndex
CREATE INDEX "products_categoryId_isActive_sortOrder_name_idx" ON "products"("categoryId", "isActive", "sortOrder", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_name_ci_key" ON "product_variants" ("productId", LOWER("name"));

-- CreateIndex
CREATE INDEX "product_variants_productId_isActive_sortOrder_name_idx" ON "product_variants"("productId", "isActive", "sortOrder", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_addons_productId_name_ci_key" ON "product_addons" ("productId", LOWER("name"));

-- CreateIndex
CREATE INDEX "product_addons_productId_isActive_sortOrder_name_idx" ON "product_addons"("productId", "isActive", "sortOrder", "name");

-- CreateIndex
CREATE UNIQUE INDEX "branch_product_overrides_branchId_productId_key" ON "branch_product_overrides"("branchId", "productId");

-- CreateIndex
CREATE INDEX "branch_product_overrides_productId_idx" ON "branch_product_overrides"("productId");

-- CreateIndex
CREATE INDEX "branch_product_overrides_branchId_isAvailable_idx" ON "branch_product_overrides"("branchId", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "branch_product_variant_overrides_branchId_variantId_key" ON "branch_product_variant_overrides"("branchId", "variantId");

-- CreateIndex
CREATE INDEX "branch_product_variant_overrides_variantId_idx" ON "branch_product_variant_overrides"("variantId");

-- CreateIndex
CREATE INDEX "branch_product_variant_overrides_branchId_isAvailable_idx" ON "branch_product_variant_overrides"("branchId", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "branch_product_addon_overrides_branchId_addonId_key" ON "branch_product_addon_overrides"("branchId", "addonId");

-- CreateIndex
CREATE INDEX "branch_product_addon_overrides_addonId_idx" ON "branch_product_addon_overrides"("addonId");

-- CreateIndex
CREATE INDEX "branch_product_addon_overrides_branchId_isAvailable_idx" ON "branch_product_addon_overrides"("branchId", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_productId_key" ON "product_images"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_fileId_key" ON "product_images"("fileId");

-- CreateIndex
CREATE INDEX "product_images_attachedById_idx" ON "product_images"("attachedById");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_product_overrides" ADD CONSTRAINT "branch_product_overrides_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_product_overrides" ADD CONSTRAINT "branch_product_overrides_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_product_variant_overrides" ADD CONSTRAINT "branch_product_variant_overrides_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_product_variant_overrides" ADD CONSTRAINT "branch_product_variant_overrides_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_product_addon_overrides" ADD CONSTRAINT "branch_product_addon_overrides_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_product_addon_overrides" ADD CONSTRAINT "branch_product_addon_overrides_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "product_addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_attachedById_fkey" FOREIGN KEY ("attachedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
