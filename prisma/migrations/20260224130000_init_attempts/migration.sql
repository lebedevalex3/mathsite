CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "UserRole" AS ENUM ('student', 'teacher', 'admin');

CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "visitorId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'student',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "topicId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_visitorId_key" ON "User"("visitorId");

CREATE INDEX "Attempt_userId_skillId_createdAt_idx" ON "Attempt"("userId", "skillId", "createdAt");

ALTER TABLE "Attempt"
ADD CONSTRAINT "Attempt_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
