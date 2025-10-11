-- CreateTable
CREATE TABLE `attractions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('SCENIC', 'FOOD', 'SHOPPING', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `longitude` DOUBLE NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `unlockDistance` INTEGER NOT NULL DEFAULT 100,
    `media` TEXT NULL,
    `rewardCoins` INTEGER NOT NULL DEFAULT 10,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(50) NULL,
    `updatedBy` VARCHAR(50) NULL,

    INDEX `attractions_type_idx`(`type`),
    INDEX `attractions_isActive_idx`(`isActive`),
    INDEX `attractions_sortOrder_idx`(`sortOrder`),
    INDEX `attractions_longitude_idx`(`longitude`),
    INDEX `attractions_latitude_idx`(`latitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_attraction_check_ins` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `attractionId` VARCHAR(191) NOT NULL,
    `checkedInAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `distance` DOUBLE NULL,
    `coinsEarned` INTEGER NOT NULL DEFAULT 0,
    `longitude` DOUBLE NULL,
    `latitude` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_attraction_check_ins_userId_idx`(`userId`),
    INDEX `user_attraction_check_ins_attractionId_idx`(`attractionId`),
    INDEX `user_attraction_check_ins_checkedInAt_idx`(`checkedInAt`),
    UNIQUE INDEX `user_attraction_check_ins_userId_attractionId_key`(`userId`, `attractionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
