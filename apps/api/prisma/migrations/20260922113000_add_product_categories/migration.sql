-- CreateTable
CREATE TABLE "product_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_categories_sortOrder_check" CHECK ("sortOrder" >= 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_name_ci_key" ON "product_categories" (LOWER("name"));

-- CreateIndex
CREATE INDEX "product_categories_isActive_sortOrder_name_idx" ON "product_categories"("isActive", "sortOrder", "name");
