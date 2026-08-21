/*
  Warnings:

  - Added the required column `familyId` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RevokedReason" AS ENUM ('ROTATED', 'LOGOUT', 'REUSE_DETECTED');

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "familyId" TEXT NOT NULL,
ADD COLUMN     "revokedReason" "RevokedReason";
