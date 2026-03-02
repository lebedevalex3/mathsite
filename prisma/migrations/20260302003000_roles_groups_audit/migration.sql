CREATE TYPE "AuthType" AS ENUM ('visitor', 'email_password', 'username_password');

ALTER TABLE "User"
ADD COLUMN "username" TEXT,
ADD COLUMN "authType" "AuthType" NOT NULL DEFAULT 'visitor',
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

CREATE TABLE "ClassGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerTeacherId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassGroup_joinCode_key" ON "ClassGroup"("joinCode");
CREATE INDEX "ClassGroup_ownerTeacherId_createdAt_idx" ON "ClassGroup"("ownerTeacherId", "createdAt");

ALTER TABLE "ClassGroup"
ADD CONSTRAINT "ClassGroup_ownerTeacherId_fkey"
FOREIGN KEY ("ownerTeacherId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE TABLE "ClassStudent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "classId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassStudent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassStudent_classId_studentId_key" ON "ClassStudent"("classId", "studentId");
CREATE INDEX "ClassStudent_studentId_joinedAt_idx" ON "ClassStudent"("studentId", "joinedAt");

ALTER TABLE "ClassStudent"
ADD CONSTRAINT "ClassStudent_classId_fkey"
FOREIGN KEY ("classId")
REFERENCES "ClassGroup"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ClassStudent"
ADD CONSTRAINT "ClassStudent_studentId_fkey"
FOREIGN KEY ("studentId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_actorUserId_fkey"
FOREIGN KEY ("actorUserId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
