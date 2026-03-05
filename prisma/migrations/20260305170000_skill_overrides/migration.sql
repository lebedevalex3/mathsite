CREATE TABLE "SkillOverride" (
    "id" UUID NOT NULL,
    "skillId" TEXT NOT NULL,
    "title" TEXT,
    "summary" TEXT,
    "kind" TEXT,
    "status" TEXT,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SkillOverride_skillId_key" ON "SkillOverride"("skillId");
CREATE INDEX "SkillOverride_status_idx" ON "SkillOverride"("status");
CREATE INDEX "SkillOverride_updatedByUserId_updatedAt_idx" ON "SkillOverride"("updatedByUserId", "updatedAt");
