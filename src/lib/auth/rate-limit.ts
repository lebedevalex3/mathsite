import { prisma } from "@/src/lib/db/prisma";

type RateLimitRule = {
  windowMs: number;
  maxAttempts: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

declare global {
  var __mathsiteRateLimitStore: RateLimitStore | undefined;
}

type ConsumeBucketResult = {
  limited: boolean;
  retryAfterSeconds: number;
};

type AuthRateLimitBackend = {
  consumeBucket(params: {
    key: string;
    rule: RateLimitRule;
    nowMs: number;
  }): Promise<ConsumeBucketResult>;
};

function getMemoryStore() {
  if (!globalThis.__mathsiteRateLimitStore) {
    globalThis.__mathsiteRateLimitStore = new Map<string, RateLimitBucket>();
  }
  return globalThis.__mathsiteRateLimitStore;
}

function getOrCreateBucket(
  store: RateLimitStore,
  key: string,
  windowMs: number,
  nowMs: number,
) {
  const existing = store.get(key);
  if (!existing || nowMs >= existing.resetAt) {
    const fresh: RateLimitBucket = {
      count: 0,
      resetAt: nowMs + windowMs,
    };
    store.set(key, fresh);
    return fresh;
  }
  return existing;
}

function consumeMemoryBucket(
  store: RateLimitStore,
  key: string,
  rule: RateLimitRule,
  nowMs: number,
): ConsumeBucketResult {
  const bucket = getOrCreateBucket(store, key, rule.windowMs, nowMs);
  bucket.count += 1;

  const retryAfterMs = Math.max(bucket.resetAt - nowMs, 0);
  const retryAfterSeconds = Math.max(Math.ceil(retryAfterMs / 1000), 1);

  return {
    limited: bucket.count > rule.maxAttempts,
    retryAfterSeconds,
  };
}

export function createMemoryAuthRateLimitBackend(
  store: RateLimitStore = getMemoryStore(),
): AuthRateLimitBackend {
  return {
    async consumeBucket({ key, rule, nowMs }) {
      return consumeMemoryBucket(store, key, rule, nowMs);
    },
  };
}

function createDbAuthRateLimitBackend(): AuthRateLimitBackend {
  return {
    async consumeBucket({ key, rule, nowMs }) {
      const now = new Date(nowMs);
      const nextReset = new Date(nowMs + rule.windowMs);
      const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
        INSERT INTO "AuthRateLimitBucket" ("key", "count", "resetAt", "createdAt", "updatedAt")
        VALUES (${key}, 1, ${nextReset}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("key") DO UPDATE
        SET
          "count" = CASE
            WHEN "AuthRateLimitBucket"."resetAt" <= ${now} THEN 1
            ELSE "AuthRateLimitBucket"."count" + 1
          END,
          "resetAt" = CASE
            WHEN "AuthRateLimitBucket"."resetAt" <= ${now} THEN ${nextReset}
            ELSE "AuthRateLimitBucket"."resetAt"
          END,
          "updatedAt" = CURRENT_TIMESTAMP
        RETURNING "count", "resetAt"
      `;
      const row = rows[0];
      if (!row) {
        throw new Error("Auth rate limit backend returned no rows");
      }

      const retryAfterMs = Math.max(row.resetAt.getTime() - nowMs, 0);
      return {
        limited: row.count > rule.maxAttempts,
        retryAfterSeconds: Math.max(Math.ceil(retryAfterMs / 1000), 1),
      };
    },
  };
}

export type AuthRateLimitScope = "sign-in" | "sign-up" | "forgot-password" | "demo-generate";

const RULES: Record<AuthRateLimitScope, { ip: RateLimitRule; identifier: RateLimitRule; pair: RateLimitRule }> = {
  "sign-in": {
    ip: { windowMs: 10 * 60 * 1000, maxAttempts: 25 },
    identifier: { windowMs: 10 * 60 * 1000, maxAttempts: 12 },
    pair: { windowMs: 10 * 60 * 1000, maxAttempts: 8 },
  },
  "sign-up": {
    ip: { windowMs: 10 * 60 * 1000, maxAttempts: 15 },
    identifier: { windowMs: 10 * 60 * 1000, maxAttempts: 8 },
    pair: { windowMs: 10 * 60 * 1000, maxAttempts: 5 },
  },
  "forgot-password": {
    ip: { windowMs: 10 * 60 * 1000, maxAttempts: 10 },
    identifier: { windowMs: 10 * 60 * 1000, maxAttempts: 6 },
    pair: { windowMs: 10 * 60 * 1000, maxAttempts: 4 },
  },
  "demo-generate": {
    ip: { windowMs: 60 * 60 * 1000, maxAttempts: 24 },
    identifier: { windowMs: 60 * 60 * 1000, maxAttempts: 12 },
    pair: { windowMs: 60 * 60 * 1000, maxAttempts: 8 },
  },
};

function firstHeaderValue(value: string | null) {
  if (!value) return "";
  return value.split(",")[0]?.trim() ?? "";
}

export function getClientIpFromHeaders(headers: Headers) {
  const forwarded = firstHeaderValue(headers.get("x-forwarded-for"));
  if (forwarded) return forwarded;

  const realIp = firstHeaderValue(headers.get("x-real-ip"));
  if (realIp) return realIp;

  const cloudflare = firstHeaderValue(headers.get("cf-connecting-ip"));
  if (cloudflare) return cloudflare;

  return "unknown";
}

type ConsumeAuthRateLimitDeps = {
  backend?: AuthRateLimitBackend;
  fallbackBackend?: AuthRateLimitBackend;
};

export async function consumeAuthRateLimit(
  params: {
    scope: AuthRateLimitScope;
    headers: Headers;
    identifier: string;
    nowMs?: number;
  },
  deps: ConsumeAuthRateLimitDeps = {},
) {
  const rules = RULES[params.scope];
  const nowMs = params.nowMs ?? Date.now();
  const backend = deps.backend ?? createDbAuthRateLimitBackend();
  const fallbackBackend = deps.fallbackBackend ?? createMemoryAuthRateLimitBackend();
  const ip = getClientIpFromHeaders(params.headers);
  const normalizedIdentifier = params.identifier.trim().toLowerCase();

  const keys = {
    ip: `${params.scope}:ip:${ip}`,
    identifier: `${params.scope}:identifier:${normalizedIdentifier}`,
    pair: `${params.scope}:pair:${ip}:${normalizedIdentifier}`,
  } as const;

  let degraded = false;
  let results: {
    ip: ConsumeBucketResult;
    identifier: ConsumeBucketResult;
    pair: ConsumeBucketResult;
  };

  try {
    const [ipResult, identifierResult, pairResult] = await Promise.all([
      backend.consumeBucket({ key: keys.ip, rule: rules.ip, nowMs }),
      backend.consumeBucket({ key: keys.identifier, rule: rules.identifier, nowMs }),
      backend.consumeBucket({ key: keys.pair, rule: rules.pair, nowMs }),
    ]);
    results = {
      ip: ipResult,
      identifier: identifierResult,
      pair: pairResult,
    };
  } catch {
    degraded = true;
    const [ipResult, identifierResult, pairResult] = await Promise.all([
      fallbackBackend.consumeBucket({ key: keys.ip, rule: rules.ip, nowMs }),
      fallbackBackend.consumeBucket({ key: keys.identifier, rule: rules.identifier, nowMs }),
      fallbackBackend.consumeBucket({ key: keys.pair, rule: rules.pair, nowMs }),
    ]);
    results = {
      ip: ipResult,
      identifier: identifierResult,
      pair: pairResult,
    };
  }

  const reasons: Array<"ip" | "identifier" | "pair"> = [];
  if (results.ip.limited) reasons.push("ip");
  if (results.identifier.limited) reasons.push("identifier");
  if (results.pair.limited) reasons.push("pair");

  if (reasons.length === 0) {
    return {
      limited: false,
      retryAfterSeconds: 0,
      reasons,
      degraded,
    } as const;
  }

  return {
    limited: true,
    retryAfterSeconds: Math.max(
      results.ip.retryAfterSeconds,
      results.identifier.retryAfterSeconds,
      results.pair.retryAfterSeconds,
    ),
    reasons,
    degraded,
  } as const;
}
