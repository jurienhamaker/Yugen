-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "cooldown" SET DEFAULT 2;
