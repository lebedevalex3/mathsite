CREATE INDEX "Attempt_topicId_createdAt_idx" ON "Attempt"("topicId", "createdAt");
CREATE INDEX "Attempt_topicId_userId_createdAt_idx" ON "Attempt"("topicId", "userId", "createdAt");
