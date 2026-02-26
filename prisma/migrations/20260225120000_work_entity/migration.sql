CREATE TYPE "WorkType" AS ENUM ('lesson', 'quiz', 'homework', 'test');

CREATE TABLE "Work" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerUserId" UUID NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workType" "WorkType" NOT NULL,
    "printProfileJson" JSONB NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkVariant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkVariant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Work_ownerUserId_createdAt_idx" ON "Work"("ownerUserId", "createdAt");
CREATE INDEX "Work_topicId_createdAt_idx" ON "Work"("topicId", "createdAt");
CREATE INDEX "Work_isDemo_expiresAt_idx" ON "Work"("isDemo", "expiresAt");

CREATE UNIQUE INDEX "WorkVariant_workId_orderIndex_key" ON "WorkVariant"("workId", "orderIndex");
CREATE UNIQUE INDEX "WorkVariant_workId_variantId_key" ON "WorkVariant"("workId", "variantId");
CREATE INDEX "WorkVariant_variantId_idx" ON "WorkVariant"("variantId");

ALTER TABLE "Work"
ADD CONSTRAINT "Work_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "WorkVariant"
ADD CONSTRAINT "WorkVariant_workId_fkey"
FOREIGN KEY ("workId")
REFERENCES "Work"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "WorkVariant"
ADD CONSTRAINT "WorkVariant_variantId_fkey"
FOREIGN KEY ("variantId")
REFERENCES "Variant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
