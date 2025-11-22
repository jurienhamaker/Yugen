-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "cooldown" SET DEFAULT 60;

UPDATE "Settings" SET "cooldown" = "cooldown" * 60;
