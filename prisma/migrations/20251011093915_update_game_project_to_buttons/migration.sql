-- AlterTable
ALTER TABLE `game_projects` 
  DROP COLUMN `costCoins`,
  DROP COLUMN `rewardCoins`,
  ADD COLUMN `costButtons` TEXT NOT NULL,
  ADD COLUMN `rewardButtons` TEXT NOT NULL;

