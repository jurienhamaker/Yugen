-- AlterTable
ALTER TABLE "History" ADD COLUMN     "messageId" TEXT;

-- AlterTable
ALTER TABLE "PlayerSaves" ADD COLUMN     "maxSaves" DOUBLE PRECISION NOT NULL DEFAULT 2;
