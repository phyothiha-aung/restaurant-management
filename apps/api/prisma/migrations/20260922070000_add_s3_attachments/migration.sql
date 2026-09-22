-- CreateEnum
CREATE TYPE "StoredFilePurpose" AS ENUM ('EXPENSE', 'RECIPE', 'PRODUCT');

-- CreateEnum
CREATE TYPE "StoredFileStatus" AS ENUM ('PENDING', 'READY', 'REJECTED');

-- CreateTable
CREATE TABLE "stored_files" (
    "id" TEXT NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "objectKey" VARCHAR(500) NOT NULL,
    "purpose" "StoredFilePurpose" NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "StoredFileStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "readyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_attachments" (
    "id" SERIAL NOT NULL,
    "expenseId" INTEGER NOT NULL,
    "fileId" TEXT NOT NULL,
    "attachedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expense_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_objectKey_key" ON "stored_files"("objectKey");
CREATE INDEX "stored_files_uploadedById_status_idx" ON "stored_files"("uploadedById", "status");
CREATE INDEX "stored_files_status_expiresAt_idx" ON "stored_files"("status", "expiresAt");
CREATE UNIQUE INDEX "expense_attachments_fileId_key" ON "expense_attachments"("fileId");
CREATE INDEX "expense_attachments_expenseId_idx" ON "expense_attachments"("expenseId");
CREATE INDEX "expense_attachments_attachedById_idx" ON "expense_attachments"("attachedById");

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_attachedById_fkey" FOREIGN KEY ("attachedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
