/*
  Warnings:

  - A unique constraint covering the columns `[normalizedName]` on the table `Skill` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `normalizedName` to the `Skill` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Skill_name_key";

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "normalizedName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Skill_normalizedName_key" ON "Skill"("normalizedName");
