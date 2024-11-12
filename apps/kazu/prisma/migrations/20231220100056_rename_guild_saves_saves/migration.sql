/*
  Warnings:

  - You are about to drop the column `guildSaves` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `maxGuildSaves` on the `Settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "guildSaves",
DROP COLUMN "maxGuildSaves",
ADD COLUMN     "maxSaves" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "saves" INTEGER NOT NULL DEFAULT 0;
