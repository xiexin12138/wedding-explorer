-- CreateTable
CREATE TABLE `game_projects` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `costCoins` INTEGER NOT NULL DEFAULT 0,
    `rewardCoins` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(50) NULL,
    `updatedBy` VARCHAR(50) NULL,

    INDEX `game_projects_isActive_idx`(`isActive`),
    INDEX `game_projects_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_records` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `gameProjectId` VARCHAR(191) NOT NULL,
    `result` ENUM('WIN', 'LOSE', 'DRAW') NOT NULL,
    `coinsSpent` INTEGER NOT NULL DEFAULT 0,
    `coinsEarned` INTEGER NOT NULL DEFAULT 0,
    `playedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `remarks` TEXT NULL,
    `operatorId` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `game_records_userId_idx`(`userId`),
    INDEX `game_records_gameProjectId_idx`(`gameProjectId`),
    INDEX `game_records_result_idx`(`result`),
    INDEX `game_records_playedAt_idx`(`playedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
