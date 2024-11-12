/*
  Warnings:

  - You are about to drop the column `meta` on the `Game` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('NORMAL');

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "meta",
ADD COLUMN     "type" "GameType" NOT NULL DEFAULT 'NORMAL';
