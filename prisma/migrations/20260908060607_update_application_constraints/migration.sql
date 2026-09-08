/*
  Warnings:

  - A unique constraint covering the columns `[candidateId,jobId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'APPLIED',
ALTER COLUMN "appliedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Application_candidateId_jobId_key" ON "Application"("candidateId", "jobId");
