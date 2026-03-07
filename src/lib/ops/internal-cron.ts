import { serviceUnavailable, unauthorized, type ApiErrorResult } from "@/src/lib/api/errors";

function normalizeSecret(value: string | undefined) {
  const secret = value?.trim();
  return secret && secret.length > 0 ? secret : null;
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) return null;

  const [scheme, token] = authorization.split(/\s+/, 2);
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token;
}

export function isInternalCronSecretConfigured(secret = process.env.CRON_SECRET) {
  return normalizeSecret(secret) !== null;
}

export function authorizeInternalCronRequest(
  request: Request,
  secret = process.env.CRON_SECRET,
): ApiErrorResult | null {
  const normalizedSecret = normalizeSecret(secret);
  if (!normalizedSecret) {
    return serviceUnavailable("CRON_SECRET is not configured.", "CRON_NOT_CONFIGURED");
  }

  const bearerToken = getBearerToken(request);
  const headerSecret = request.headers.get("x-cron-secret")?.trim() || null;
  if (bearerToken === normalizedSecret || headerSecret === normalizedSecret) {
    return null;
  }

  return unauthorized("Invalid cron secret.", "CRON_UNAUTHORIZED");
}
