/*
  Warnings:

  - You are about to drop the column `guildSaves` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `highscore` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `maxGuildSaves` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "guildSaves",
DROP COLUMN "highscore",
DROP COLUMN "maxGuildSaves";

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "guildSaves" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "highscore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxGuildSaves" INTEGER NOT NULL DEFAULT 0;
