CREATE TABLE "Variant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerUserId" UUID NOT NULL,
    "topicId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VariantTask" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "variantId" UUID NOT NULL,
    "taskId" TEXT NOT NULL,
    "sectionLabel" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "VariantTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Variant_ownerUserId_createdAt_idx" ON "Variant"("ownerUserId", "createdAt");
CREATE INDEX "Variant_topicId_createdAt_idx" ON "Variant"("topicId", "createdAt");
CREATE INDEX "VariantTask_variantId_sectionLabel_idx" ON "VariantTask"("variantId", "sectionLabel");

CREATE UNIQUE INDEX "VariantTask_variantId_orderIndex_key" ON "VariantTask"("variantId", "orderIndex");

ALTER TABLE "Variant"
ADD CONSTRAINT "Variant_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "VariantTask"
ADD CONSTRAINT "VariantTask_variantId_fkey"
FOREIGN KEY ("variantId")
REFERENCES "Variant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
