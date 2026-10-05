-- Preserve the effective access state of users whose branch was inactive and
-- revoke sessions whose authorization changes during this migration.
DELETE FROM "refresh_tokens"
WHERE "userId" IN (
  SELECT u."id"
  FROM "users" u
  LEFT JOIN "branches" b ON b."id" = u."branchId"
  WHERE u."role" = 'BRANCH_MANAGER'
     OR (u."branchId" IS NOT NULL AND b."isActive" = false)
);

UPDATE "users" u
SET "status" = 'INACTIVE'
FROM "branches" b
WHERE u."branchId" = b."id"
  AND b."isActive" = false
  AND u."status" = 'ACTIVE';

UPDATE "users"
SET "role" = 'MANAGER'
WHERE "role" = 'BRANCH_MANAGER';

-- A single-restaurant username must be globally unique. Abort rather than
-- silently changing user identifiers if legacy branch data contains clashes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "users"
    WHERE "username" IS NOT NULL
    GROUP BY "username"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot remove branches: duplicate usernames exist across branches';
  END IF;
END $$;

DROP INDEX "users_branchId_username_key";
DROP INDEX "users_branchId_role_idx";
DROP INDEX "expenses_branchId_expenseDate_status_idx";
DROP INDEX "orders_branchId_status_createdAt_idx";

ALTER TABLE "users" DROP CONSTRAINT "users_branchId_fkey";
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_branchId_fkey";
ALTER TABLE "orders" DROP CONSTRAINT "orders_branchId_fkey";

ALTER TABLE "users" DROP COLUMN "branchId";
ALTER TABLE "expenses" DROP COLUMN "branchId";
ALTER TABLE "orders" DROP COLUMN "branchId";

DROP TABLE "branches";

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");
CREATE INDEX "expenses_status_expenseDate_idx" ON "expenses"("status", "expenseDate");
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- PostgreSQL cannot directly remove one enum value, so rebuild the type after
-- all BRANCH_MANAGER rows have been migrated to MANAGER.
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
CREATE TYPE "UserRole_new" AS ENUM (
  'SUPERADMIN',
  'ADMIN',
  'OWNER',
  'MANAGER',
  'WAITER',
  'CHEF',
  'CASHIER'
);
ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING ("role"::text::"UserRole_new");
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'WAITER';
