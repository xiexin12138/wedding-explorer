-- CreateTable
CREATE TABLE `system_settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `displayName` VARCHAR(200) NOT NULL,
    `value` TEXT NULL,
    `valueType` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY') NOT NULL DEFAULT 'STRING',
    `category` ENUM('SYSTEM', 'SECURITY', 'NOTIFICATION', 'WEDDING', 'VENUE', 'GUEST', 'SCHEDULE', 'MAP', 'CHAT', 'ANALYTICS', 'UI_UX') NOT NULL,
    `description` TEXT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(50) NULL,
    `updatedBy` VARCHAR(50) NULL,

    UNIQUE INDEX `system_settings_key_key`(`key`),
    INDEX `system_settings_category_idx`(`category`),
    INDEX `system_settings_isEnabled_idx`(`isEnabled`),
    INDEX `system_settings_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityTimeline` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NULL,
    `endTime` DATETIME(3) NULL,
    `type` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NULL,
    `nickname` VARCHAR(100) NULL,
    `name` VARCHAR(100) NULL,
    `avatar` TEXT NULL,
    `role` ENUM('ADMIN', 'BRIDE', 'GROOM', 'FAMILY', 'FRIEND', 'GUEST') NOT NULL DEFAULT 'GUEST',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `coins` INTEGER NOT NULL DEFAULT 0,
    `totalCoinsEarned` INTEGER NOT NULL DEFAULT 0,
    `totalCoinsSpent` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_coins_idx`(`coins`),
    INDEX `users_totalCoinsEarned_idx`(`totalCoinsEarned`),
    INDEX `users_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authing_users` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `authingId` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `authing_users_userId_key`(`userId`),
    UNIQUE INDEX `authing_users_authingId_key`(`authingId`),
    INDEX `authing_users_authingId_idx`(`authingId`),
    INDEX `authing_users_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wechat_users` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `openId` VARCHAR(100) NOT NULL,
    `unionId` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wechat_users_userId_key`(`userId`),
    UNIQUE INDEX `wechat_users_openId_key`(`openId`),
    UNIQUE INDEX `wechat_users_unionId_key`(`unionId`),
    INDEX `wechat_users_openId_idx`(`openId`),
    INDEX `wechat_users_unionId_idx`(`unionId`),
    INDEX `wechat_users_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prize_exchange_records` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `prizeName` VARCHAR(200) NOT NULL,
    `prizeDesc` TEXT NULL,
    `coinsSpent` INTEGER NOT NULL,
    `userCoinsSnapshot` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `remarks` TEXT NULL,
    `exchangedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `processedBy` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `prize_exchange_records_userId_idx`(`userId`),
    INDEX `prize_exchange_records_status_idx`(`status`),
    INDEX `prize_exchange_records_exchangedAt_idx`(`exchangedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coin_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('EARN', 'SPEND', 'ADMIN_ADD', 'ADMIN_SUB', 'REFUND', 'SYSTEM') NOT NULL,
    `amount` INTEGER NOT NULL,
    `balanceBefore` INTEGER NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `relatedExchangeId` VARCHAR(100) NULL,
    `relatedBusinessId` VARCHAR(100) NULL,
    `businessType` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `operatorId` VARCHAR(100) NULL,

    INDEX `coin_transactions_userId_idx`(`userId`),
    INDEX `coin_transactions_type_idx`(`type`),
    INDEX `coin_transactions_createdAt_idx`(`createdAt`),
    INDEX `coin_transactions_businessType_idx`(`businessType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
