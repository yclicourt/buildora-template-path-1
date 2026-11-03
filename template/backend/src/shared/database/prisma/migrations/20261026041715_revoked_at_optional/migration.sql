/*
  Warnings:

  - Made the column `expiresAt` on table `Auth` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Auth" ALTER COLUMN "expiresAt" SET NOT NULL,
ALTER COLUMN "expiresAt" DROP DEFAULT,
ALTER COLUMN "revokedAt" DROP NOT NULL,
ALTER COLUMN "revokedAt" DROP DEFAULT;
