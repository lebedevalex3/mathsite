import { randomUUID } from "node:crypto";

type ApiSpan = {
  route: string;
  method: string;
  requestId: string;
  startMs: number;
};

type ApiErrorMetric = {
  route: string;
  method: string;
  status: number;
  code: string;
  count: number;
};

type ApiErrorCounters = Map<string, ApiErrorMetric>;

declare global {
  var __mathsiteApiErrorCounters: ApiErrorCounters | undefined;
}

function getCounters() {
  if (!globalThis.__mathsiteApiErrorCounters) {
    globalThis.__mathsiteApiErrorCounters = new Map<string, ApiErrorMetric>();
  }
  return globalThis.__mathsiteApiErrorCounters;
}

function normalizeHeaderValue(value: string | null) {
  return value?.trim() ?? "";
}

function getRequestId(headers: Headers) {
  const candidates = [
    headers.get("x-request-id"),
    headers.get("x-correlation-id"),
    headers.get("cf-ray"),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeHeaderValue(candidate);
    if (normalized) return normalized;
  }

  return randomUUID();
}

export function startApiSpan(request: Request, route: string): ApiSpan {
  return {
    route,
    method: request.method.toUpperCase(),
    requestId: getRequestId(request.headers),
    startMs: Date.now(),
  };
}

export function logApiResult(
  span: ApiSpan,
  status: number,
  details?: {
    code?: string;
    message?: string;
    meta?: Record<string, unknown>;
  },
) {
  const durationMs = Date.now() - span.startMs;
  const code = details?.code ?? (status >= 500 ? "INTERNAL_ERROR" : "OK");
  const logLevel = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

  const payload = {
    event: "api_request",
    level: logLevel,
    route: span.route,
    method: span.method,
    status,
    code,
    durationMs,
    requestId: span.requestId,
    ...(details?.message ? { message: details.message } : {}),
    ...(details?.meta ? { meta: details.meta } : {}),
  };

  if (status >= 500) {
    console.error(payload);
  } else if (status >= 400) {
    console.warn(payload);
  } else {
    console.log(payload);
  }

  if (status >= 400) {
    const key = `${span.route}|${span.method}|${status}|${code}`;
    const counters = getCounters();
    const prev = counters.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      counters.set(key, {
        route: span.route,
        method: span.method,
        status,
        code,
        count: 1,
      });
    }
  }
}

export function getApiErrorMetrics() {
  return [...getCounters().values()].sort((a, b) => b.count - a.count);
}

export function resetApiErrorMetricsForTests() {
  getCounters().clear();
}
