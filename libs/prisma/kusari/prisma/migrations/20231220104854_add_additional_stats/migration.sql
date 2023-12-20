-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "highscoreDate" TIMESTAMP(3),
ADD COLUMN     "savesUsed" DOUBLE PRECISION NOT NULL DEFAULT 0;
