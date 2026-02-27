import assert from "node:assert/strict";
import test from "node:test";

import {
  consumeAuthRateLimit,
  getClientIpFromHeaders,
} from "@/src/lib/auth/rate-limit";

function resetRateLimitState() {
  const g = globalThis as { __mathsiteRateLimitStore?: Map<string, unknown> };
  g.__mathsiteRateLimitStore?.clear();
}

test("getClientIpFromHeaders prefers x-forwarded-for first value", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 203.0.113.11",
    "x-real-ip": "198.51.100.7",
  });

  assert.equal(getClientIpFromHeaders(headers), "203.0.113.10");
});

test("consumeAuthRateLimit blocks sign-in after account threshold", () => {
  resetRateLimitState();

  const headers = new Headers({
    "x-forwarded-for": "198.51.100.9",
  });

  for (let i = 0; i < 8; i += 1) {
    const result = consumeAuthRateLimit({
      scope: "sign-in",
      headers,
      email: "student@example.com",
      nowMs: 1_000,
    });
    assert.equal(result.limited, false);
  }

  const blocked = consumeAuthRateLimit({
    scope: "sign-in",
    headers,
    email: "student@example.com",
    nowMs: 1_000,
  });
  assert.equal(blocked.limited, true);
  assert.ok(blocked.retryAfterSeconds >= 1);
});

test("consumeAuthRateLimit resets after window", () => {
  resetRateLimitState();

  const headers = new Headers({
    "x-forwarded-for": "198.51.100.10",
  });

  for (let i = 0; i < 9; i += 1) {
    consumeAuthRateLimit({
      scope: "sign-up",
      headers,
      email: "teacher@example.com",
      nowMs: 0,
    });
  }

  const afterReset = consumeAuthRateLimit({
    scope: "sign-up",
    headers,
    email: "teacher@example.com",
    nowMs: 11 * 60 * 1000,
  });

  assert.equal(afterReset.limited, false);
});
