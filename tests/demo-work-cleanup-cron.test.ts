import assert from "node:assert/strict";
import test from "node:test";

import { runDemoCleanupCron } from "@/src/lib/demo-work-cleanup-cron";

test("runDemoCleanupCron requires a valid internal cron secret", async () => {
  const request = new Request("http://localhost:3000/api/internal/cron/demo-cleanup");
  const result = await runDemoCleanupCron(request, {
    secret: "super-secret",
  });

  assert.equal(result.status, 401);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.code, "CRON_UNAUTHORIZED");
});

test("runDemoCleanupCron returns cleanup stats on success", async () => {
  const now = new Date("2026-03-07T12:00:00.000Z");
  const request = new Request("http://localhost:3000/api/internal/cron/demo-cleanup", {
    headers: { Authorization: "Bearer super-secret" },
  });
  const result = await runDemoCleanupCron(request, {
    secret: "super-secret",
    now,
    runCleanup: async () => ({
      skipped: false,
      deletedWorks: 4,
      deletedVariants: 2,
    }),
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    ok: true,
    deletedWorks: 4,
    deletedVariants: 2,
    skipped: false,
    ranAt: now.toISOString(),
  });
});
