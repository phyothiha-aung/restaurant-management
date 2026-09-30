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
CREATE TABLE "addons" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addons_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "addons_unitPrice_check" CHECK ("unitPrice" >= 0)
);

-- CreateTable
CREATE TABLE "product_addons" (
    "productId" INTEGER NOT NULL,
    "addonId" INTEGER NOT NULL,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_addons_pkey" PRIMARY KEY ("productId", "addonId"),
    CONSTRAINT "product_addons_maxQuantity_check" CHECK ("maxQuantity" >= 1),
    CONSTRAINT "product_addons_sortOrder_check" CHECK ("sortOrder" >= 0)
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

-- Case-insensitive uniqueness
CREATE UNIQUE INDEX "products_code_ci_key" ON "products" (LOWER("code")) WHERE "code" IS NOT NULL;
CREATE UNIQUE INDEX "products_categoryId_name_ci_key" ON "products" ("categoryId", LOWER("name"));
CREATE UNIQUE INDEX "product_variants_productId_name_ci_key" ON "product_variants" ("productId", LOWER("name"));
CREATE UNIQUE INDEX "addons_name_ci_key" ON "addons" (LOWER("name"));

-- Lookup indexes
CREATE INDEX "products_categoryId_isActive_sortOrder_name_idx" ON "products"("categoryId", "isActive", "sortOrder", "name");
CREATE INDEX "product_variants_productId_isActive_sortOrder_name_idx" ON "product_variants"("productId", "isActive", "sortOrder", "name");
CREATE INDEX "addons_isActive_name_idx" ON "addons"("isActive", "name");
CREATE INDEX "product_addons_addonId_idx" ON "product_addons"("addonId");
CREATE INDEX "product_addons_productId_sortOrder_idx" ON "product_addons"("productId", "sortOrder");
CREATE UNIQUE INDEX "product_images_productId_key" ON "product_images"("productId");
CREATE UNIQUE INDEX "product_images_fileId_key" ON "product_images"("fileId");
CREATE INDEX "product_images_attachedById_idx" ON "product_images"("attachedById");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_attachedById_fkey" FOREIGN KEY ("attachedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
