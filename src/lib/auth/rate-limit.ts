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

function getStore() {
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

function consume(
  store: RateLimitStore,
  key: string,
  rule: RateLimitRule,
  nowMs: number,
) {
  const bucket = getOrCreateBucket(store, key, rule.windowMs, nowMs);
  bucket.count += 1;

  const retryAfterMs = Math.max(bucket.resetAt - nowMs, 0);
  const retryAfterSeconds = Math.max(Math.ceil(retryAfterMs / 1000), 1);

  return {
    limited: bucket.count > rule.maxAttempts,
    retryAfterSeconds,
  };
}

export type AuthRateLimitScope = "sign-in" | "sign-up";

const RULES: Record<AuthRateLimitScope, { ip: RateLimitRule; account: RateLimitRule }> = {
  "sign-in": {
    ip: { windowMs: 10 * 60 * 1000, maxAttempts: 25 },
    account: { windowMs: 10 * 60 * 1000, maxAttempts: 8 },
  },
  "sign-up": {
    ip: { windowMs: 10 * 60 * 1000, maxAttempts: 15 },
    account: { windowMs: 10 * 60 * 1000, maxAttempts: 5 },
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

export function consumeAuthRateLimit(params: {
  scope: AuthRateLimitScope;
  headers: Headers;
  email: string;
  nowMs?: number;
}) {
  const rules = RULES[params.scope];
  const nowMs = params.nowMs ?? Date.now();
  const store = getStore();
  const ip = getClientIpFromHeaders(params.headers);
  const normalizedEmail = params.email.trim().toLowerCase();

  const ipResult = consume(store, `${params.scope}:ip:${ip}`, rules.ip, nowMs);
  const accountResult = consume(
    store,
    `${params.scope}:account:${ip}:${normalizedEmail}`,
    rules.account,
    nowMs,
  );

  if (!ipResult.limited && !accountResult.limited) {
    return {
      limited: false,
      retryAfterSeconds: 0,
    } as const;
  }

  return {
    limited: true,
    retryAfterSeconds: Math.max(ipResult.retryAfterSeconds, accountResult.retryAfterSeconds),
  } as const;
}
