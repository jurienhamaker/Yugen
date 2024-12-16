/*
  Warnings:

  - You are about to drop the column `saves` on the `PlayerStats` table. All the data will be migrated.

*/
-- CreateTable
CREATE TABLE "PlayerSaves" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "saves" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastVoteTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSaves_pkey" PRIMARY KEY ("id")
);

-- Migrate data
INSERT INTO "PlayerSaves" ( "userId", "saves", "updatedAt" )
SELECT "userId", MAX("saves"), NOW()
FROM "PlayerStats"
GROUP BY "userId";


-- AlterTable
ALTER TABLE "PlayerStats" RENAME CONSTRAINT "Player_pkey" TO "PlayerStats_pkey";
ALTER TABLE "PlayerStats" DROP COLUMN "saves";

