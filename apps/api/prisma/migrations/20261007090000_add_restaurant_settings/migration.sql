CREATE TABLE "restaurant_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(300),
    "phone" VARCHAR(30),
    "taxId" VARCHAR(50),
    "timeZone" VARCHAR(100) NOT NULL,
    "receiptFooter" VARCHAR(300),
    "receiptPaperWidth" INTEGER NOT NULL DEFAULT 80,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "restaurant_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "restaurant_settings_singleton_check" CHECK ("id" = 1),
    CONSTRAINT "restaurant_settings_paper_width_check" CHECK ("receiptPaperWidth" IN (58, 80))
);

CREATE INDEX "restaurant_settings_updatedById_idx" ON "restaurant_settings"("updatedById");

ALTER TABLE "restaurant_settings"
ADD CONSTRAINT "restaurant_settings_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
