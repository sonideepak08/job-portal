-- CreateIndex
CREATE INDEX "Job_recruiterId_status_idx" ON "Job"("recruiterId", "status");

-- CreateIndex
CREATE INDEX "Job_status_id_idx" ON "Job"("status", "id");

-- CreateIndex
CREATE INDEX "JobSkill_skillId_idx" ON "JobSkill"("skillId");
