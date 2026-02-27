import assert from "node:assert/strict";
import test from "node:test";

import {
  getApiErrorMetrics,
  logApiResult,
  resetApiErrorMetricsForTests,
  startApiSpan,
} from "@/src/lib/observability/api";

test("observability metrics aggregate errors by route/method/status/code", () => {
  resetApiErrorMetricsForTests();

  const req1 = new Request("http://localhost/api/progress", { method: "GET" });
  const req2 = new Request("http://localhost/api/progress", { method: "GET" });
  const req3 = new Request("http://localhost/api/auth/sign-in", { method: "POST" });

  logApiResult(startApiSpan(req1, "/api/progress"), 400, { code: "BAD_REQUEST" });
  logApiResult(startApiSpan(req2, "/api/progress"), 400, { code: "BAD_REQUEST" });
  logApiResult(startApiSpan(req3, "/api/auth/sign-in"), 401, { code: "UNAUTHORIZED" });
  logApiResult(startApiSpan(req3, "/api/auth/sign-in"), 200, { code: "OK" });

  const metrics = getApiErrorMetrics();

  assert.equal(metrics.length, 2);
  const progress = metrics.find((m) => m.route === "/api/progress");
  const signIn = metrics.find((m) => m.route === "/api/auth/sign-in");
  assert.equal(progress?.count, 2);
  assert.equal(progress?.status, 400);
  assert.equal(signIn?.count, 1);
  assert.equal(signIn?.status, 401);
});
