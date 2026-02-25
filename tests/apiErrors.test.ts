import assert from "node:assert/strict";
import test from "node:test";

import { toApiError } from "@/src/lib/api/errors";

function withNodeEnv<T>(value: string, fn: () => T): T {
  const env = process.env as Record<string, string | undefined>;
  const prev = env.NODE_ENV;
  env.NODE_ENV = value;
  try {
    return fn();
  } finally {
    if (prev === undefined) {
      delete env.NODE_ENV;
    } else {
      env.NODE_ENV = prev;
    }
  }
}

test("toApiError returns DB_NOT_READY with dev steps", () => {
  const result = withNodeEnv("development", () =>
    toApiError(new Error('relation "Attempt" does not exist')),
  );

  assert.equal(result.status, 500);
  assert.equal(result.body.code, "DB_NOT_READY");
  assert.ok(result.body.message.length > 0);
  assert.ok(Array.isArray(result.body.steps));
  assert.ok(result.body.steps?.some((step) => step.includes("pnpm prisma migrate dev")));
});

test("toApiError returns DB_CONNECTION_FAILED for connection errors", () => {
  const result = withNodeEnv("development", () =>
    toApiError(new Error("P1001: Can't reach database server at `localhost:5433`")),
  );

  assert.equal(result.status, 500);
  assert.equal(result.body.code, "DB_CONNECTION_FAILED");
  assert.ok(result.body.steps?.some((step) => step.includes("docker compose up -d")));
});

test("toApiError hides dev steps in production", () => {
  const result = withNodeEnv("production", () =>
    toApiError(new Error("Prisma client did not initialize yet. Did you run prisma generate?")),
  );

  assert.equal(result.status, 500);
  assert.equal(result.body.code, "PRISMA_CLIENT_ERROR");
  assert.equal(result.body.steps, undefined);
  assert.equal(result.body.hints, undefined);
});
