-- CreateEnum
CREATE TYPE "setting_value_type" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY');

-- CreateEnum
CREATE TYPE "setting_category" AS ENUM ('SYSTEM', 'SECURITY', 'NOTIFICATION', 'WEDDING', 'VENUE', 'GUEST', 'SCHEDULE', 'MAP', 'CHAT', 'ANALYTICS', 'UI_UX');

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "value" TEXT,
    "valueType" "setting_value_type" NOT NULL DEFAULT 'STRING',
    "category" "setting_category" NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" VARCHAR(50),
    "updatedBy" VARCHAR(50),

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE INDEX "system_settings_isEnabled_idx" ON "system_settings"("isEnabled");

-- CreateIndex
CREATE INDEX "system_settings_sortOrder_idx" ON "system_settings"("sortOrder");
