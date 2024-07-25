-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "botUpdatesChannelId" TEXT,
ADD COLUMN     "removeShameRoleAfterHighscore" BOOLEAN NOT NULL DEFAULT false;
