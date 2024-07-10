/*
  Warnings:

  - You are about to drop the column `word` on the `History` table. All the data in the column will be lost.
  - Added the required column `number` to the `History` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "History" DROP COLUMN "word",
ADD COLUMN     "number" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "math" BOOLEAN NOT NULL DEFAULT true;
