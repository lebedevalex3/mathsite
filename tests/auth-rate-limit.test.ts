import assert from "node:assert/strict";
import test from "node:test";

import {
  consumeAuthRateLimit,
  createMemoryAuthRateLimitBackend,
  getClientIpFromHeaders,
} from "@/src/lib/auth/rate-limit";

function createBackendPair() {
  return {
    backend: createMemoryAuthRateLimitBackend(new Map()),
    fallbackBackend: createMemoryAuthRateLimitBackend(new Map()),
  };
}

test("getClientIpFromHeaders prefers x-forwarded-for first value", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 203.0.113.11",
    "x-real-ip": "198.51.100.7",
  });

  assert.equal(getClientIpFromHeaders(headers), "203.0.113.10");
});

test("consumeAuthRateLimit blocks sign-in after account threshold", async () => {
  const deps = createBackendPair();
  const headers = new Headers({
    "x-forwarded-for": "198.51.100.9",
  });

  for (let i = 0; i < 8; i += 1) {
    const result = await consumeAuthRateLimit(
      {
        scope: "sign-in",
        headers,
        identifier: "student@example.com",
        nowMs: 1_000,
      },
      deps,
    );
    assert.equal(result.limited, false);
    assert.equal(result.degraded, false);
  }

  const blocked = await consumeAuthRateLimit(
    {
      scope: "sign-in",
      headers,
      identifier: "student@example.com",
      nowMs: 1_000,
    },
    deps,
  );
  assert.equal(blocked.limited, true);
  assert.ok(blocked.retryAfterSeconds >= 1);
  assert.ok(blocked.reasons.includes("pair"));
});

test("consumeAuthRateLimit resets after window", async () => {
  const deps = createBackendPair();
  const headers = new Headers({
    "x-forwarded-for": "198.51.100.10",
  });

  for (let i = 0; i < 9; i += 1) {
    await consumeAuthRateLimit(
      {
        scope: "sign-up",
        headers,
        identifier: "teacher@example.com",
        nowMs: 0,
      },
      deps,
    );
  }

  const afterReset = await consumeAuthRateLimit(
    {
      scope: "sign-up",
      headers,
      identifier: "teacher@example.com",
      nowMs: 11 * 60 * 1000,
    },
    deps,
  );

  assert.equal(afterReset.limited, false);
});

test("consumeAuthRateLimit blocks identifier across different IPs", async () => {
  const deps = createBackendPair();

  for (let i = 0; i < 12; i += 1) {
    const headers = new Headers({
      "x-forwarded-for": `198.51.100.${i + 1}`,
    });
    const result = await consumeAuthRateLimit(
      {
        scope: "sign-in",
        headers,
        identifier: "student@example.com",
        nowMs: 1_000,
      },
      deps,
    );
    assert.equal(result.limited, false);
  }

  const blocked = await consumeAuthRateLimit(
    {
      scope: "sign-in",
      headers: new Headers({ "x-forwarded-for": "203.0.113.200" }),
      identifier: "student@example.com",
      nowMs: 1_000,
    },
    deps,
  );
  assert.equal(blocked.limited, true);
  assert.ok(blocked.reasons.includes("identifier"));
});

test("consumeAuthRateLimit enforces forgot-password pair threshold", async () => {
  const deps = createBackendPair();
  const headers = new Headers({
    "x-forwarded-for": "198.51.100.42",
  });

  for (let i = 0; i < 4; i += 1) {
    const result = await consumeAuthRateLimit(
      {
        scope: "forgot-password",
        headers,
        identifier: "user@example.com",
        nowMs: 1_000,
      },
      deps,
    );
    assert.equal(result.limited, false);
  }

  const blocked = await consumeAuthRateLimit(
    {
      scope: "forgot-password",
      headers,
      identifier: "user@example.com",
      nowMs: 1_000,
    },
    deps,
  );
  assert.equal(blocked.limited, true);
  assert.ok(blocked.reasons.includes("pair"));
});

test("consumeAuthRateLimit falls back to memory backend when persistent storage fails", async () => {
  const fallbackBackend = createMemoryAuthRateLimitBackend(new Map());
  const failingBackend = {
    async consumeBucket() {
      throw new Error("db down");
    },
  };
  const headers = new Headers({
    "x-forwarded-for": "198.51.100.99",
  });

  for (let i = 0; i < 8; i += 1) {
    const result = await consumeAuthRateLimit(
      {
        scope: "sign-in",
        headers,
        identifier: "fallback@example.com",
        nowMs: 5_000,
      },
      { backend: failingBackend, fallbackBackend },
    );
    assert.equal(result.limited, false);
    assert.equal(result.degraded, true);
  }

  const blocked = await consumeAuthRateLimit(
    {
      scope: "sign-in",
      headers,
      identifier: "fallback@example.com",
      nowMs: 5_000,
    },
    { backend: failingBackend, fallbackBackend },
  );

  assert.equal(blocked.limited, true);
  assert.equal(blocked.degraded, true);
  assert.ok(blocked.reasons.includes("pair"));
});

test("consumeAuthRateLimit enforces demo-generate scope with hourly limits", async () => {
  const deps = createBackendPair();
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.77",
  });

  for (let i = 0; i < 8; i += 1) {
    const result = await consumeAuthRateLimit(
      {
        scope: "demo-generate",
        headers,
        identifier: "visitor-123",
        nowMs: 10_000,
      },
      deps,
    );
    assert.equal(result.limited, false);
  }

  const blocked = await consumeAuthRateLimit(
    {
      scope: "demo-generate",
      headers,
      identifier: "visitor-123",
      nowMs: 10_000,
    },
    deps,
  );

  assert.equal(blocked.limited, true);
  assert.ok(blocked.reasons.includes("pair"));
  assert.ok(blocked.retryAfterSeconds >= 1);
});
