import assert from "node:assert/strict";
import test from "node:test";

import {
  authorizeInternalCronRequest,
  isInternalCronSecretConfigured,
} from "@/src/lib/ops/internal-cron";

test("isInternalCronSecretConfigured requires a non-empty secret", () => {
  assert.equal(isInternalCronSecretConfigured(undefined), false);
  assert.equal(isInternalCronSecretConfigured("   "), false);
  assert.equal(isInternalCronSecretConfigured("secret"), true);
});

test("authorizeInternalCronRequest returns 503 when CRON_SECRET is missing", () => {
  const request = new Request("http://localhost:3000/api/internal/cron/demo-cleanup");
  const result = authorizeInternalCronRequest(request, undefined);

  assert.equal(result?.status, 503);
  assert.equal(result?.body.code, "CRON_NOT_CONFIGURED");
});

test("authorizeInternalCronRequest accepts bearer token", () => {
  const request = new Request("http://localhost:3000/api/internal/cron/demo-cleanup", {
    headers: { Authorization: "Bearer super-secret" },
  });
  const result = authorizeInternalCronRequest(request, "super-secret");

  assert.equal(result, null);
});

test("authorizeInternalCronRequest accepts x-cron-secret fallback header", () => {
  const request = new Request("http://localhost:3000/api/internal/cron/demo-cleanup", {
    headers: { "x-cron-secret": "super-secret" },
  });
  const result = authorizeInternalCronRequest(request, "super-secret");

  assert.equal(result, null);
});

test("authorizeInternalCronRequest rejects invalid secrets", () => {
  const request = new Request("http://localhost:3000/api/internal/cron/demo-cleanup", {
    headers: { Authorization: "Bearer wrong-secret" },
  });
  const result = authorizeInternalCronRequest(request, "super-secret");

  assert.equal(result?.status, 401);
  assert.equal(result?.body.code, "CRON_UNAUTHORIZED");
});
