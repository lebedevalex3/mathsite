import { Prisma } from "@prisma/client";

export type ApiErrorBody = {
  ok: false;
  code: string;
  message: string;
  details?: unknown;
  hints?: string[];
  steps?: string[];
};

export type ApiErrorResult = {
  status: number;
  body: ApiErrorBody;
};

type ToApiErrorOptions = {
  defaultMessage?: string;
  defaultCode?: string;
};

function isDev() {
  return process.env.NODE_ENV !== "production";
}

function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
  extra?: Pick<ApiErrorBody, "hints" | "steps">,
): ApiErrorResult {
  const body: ApiErrorBody = { ok: false, code, message };
  if (details !== undefined) body.details = details;
  if (extra?.hints && extra.hints.length > 0) body.hints = extra.hints;
  if (extra?.steps && extra.steps.length > 0) body.steps = extra.steps;

  return {
    status,
    body,
  };
}

function hasNumericStatus(error: unknown): error is { status: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  );
}

function isErrorWithMessage(error: unknown): error is Error {
  return error instanceof Error;
}

function hasCodeAndDetails(
  error: unknown,
): error is Error & { code: string; details?: unknown } {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

function looksLikeInsufficientTasks(error: Error) {
  return /Недостаточно задач/i.test(error.message);
}

function looksLikeDbNotReady(error: Error) {
  return (
    /relation .* does not exist/i.test(error.message) ||
    /table .* does not exist/i.test(error.message) ||
    /column .* does not exist/i.test(error.message) ||
    /underlying table .* does not exist/i.test(error.message) ||
    /migrations? not applied/i.test(error.message)
  );
}

function looksLikeDbConnectionFailed(error: Error) {
  return (
    /ECONNREFUSED/i.test(error.message) ||
    /Can't reach database server/i.test(error.message) ||
    /P1001/i.test(error.message) ||
    /connection.*refused/i.test(error.message) ||
    /timed out.*database/i.test(error.message)
  );
}

function looksLikePrismaClientIssue(error: Error) {
  return (
    /prisma client/i.test(error.message) ||
    /run prisma generate/i.test(error.message) ||
    /did not initialize yet/i.test(error.message) ||
    /Cannot read properties of undefined \(reading 'find(Many|First|Unique|create|update)'\)/.test(
      error.message,
    )
  );
}

function devDbNotReadySteps() {
  return ["pnpm prisma migrate dev", "If drift (dev only): pnpm prisma migrate reset"];
}

function devDbConnectionSteps() {
  return ["docker compose up -d", "Check DATABASE_URL in .env and .env.local"];
}

function devPrismaClientSteps() {
  return ["pnpm prisma generate", "Restart the dev server (pnpm dev)"];
}

export function badRequest(message: string, code = "BAD_REQUEST"): ApiErrorResult {
  return apiError(400, code, message);
}

export function unauthorized(message: string, code = "UNAUTHORIZED"): ApiErrorResult {
  return apiError(401, code, message);
}

export function forbidden(message: string, code = "FORBIDDEN"): ApiErrorResult {
  return apiError(403, code, message);
}

export function conflict(message: string, code = "CONFLICT"): ApiErrorResult {
  return apiError(409, code, message);
}

export function tooManyRequests(
  message: string,
  code = "TOO_MANY_REQUESTS",
): ApiErrorResult {
  return apiError(429, code, message);
}

export function notFound(message: string, code = "NOT_FOUND"): ApiErrorResult {
  return apiError(404, code, message);
}

export function toApiError(error: unknown, options: ToApiErrorOptions = {}): ApiErrorResult {
  const fallbackMessage = options.defaultMessage ?? "Unexpected error.";
  const fallbackCode = options.defaultCode ?? "INTERNAL_ERROR";

  if (hasNumericStatus(error) && error.status === 403) {
    return apiError(403, "FORBIDDEN", "Teacher role required.");
  }

  if (isErrorWithMessage(error)) {
    if (hasCodeAndDetails(error) && error.code === "INVALID_TEMPLATE") {
      return apiError(422, "INVALID_TEMPLATE", "Invalid variant template.", error.details);
    }

    if (hasCodeAndDetails(error) && error.code === "INSUFFICIENT_TASKS") {
      return apiError(
        422,
        "INSUFFICIENT_TASKS",
        "Not enough tasks to satisfy the template.",
        error.details,
      );
    }

    if (looksLikeInsufficientTasks(error)) {
      return apiError(422, "INSUFFICIENT_TASKS", "Not enough tasks to satisfy the template.");
    }

    if (looksLikeDbNotReady(error)) {
      return apiError(
        500,
        "DB_NOT_READY",
        isDev()
          ? "Database not initialized (migrations not applied)."
          : "Database is not ready.",
        undefined,
        isDev()
          ? {
              hints: ["Prisma schema is ahead of the database schema."],
              steps: devDbNotReadySteps(),
            }
          : undefined,
      );
    }

    if (looksLikeDbConnectionFailed(error)) {
      return apiError(
        500,
        "DB_CONNECTION_FAILED",
        isDev()
          ? "Cannot connect to Postgres. Check docker-compose and DATABASE_URL."
          : "Database connection failed.",
        undefined,
        isDev()
          ? {
              hints: ["Postgres may be down or DATABASE_URL points to a wrong host/port."],
              steps: devDbConnectionSteps(),
            }
          : undefined,
      );
    }

    if (looksLikePrismaClientIssue(error)) {
      return apiError(
        500,
        "PRISMA_CLIENT_ERROR",
        isDev()
          ? "Prisma client not generated. Run: pnpm prisma generate."
          : "Internal server error.",
        undefined,
        isDev()
          ? {
              hints: ["Prisma schema/client may be out of sync after schema changes."],
              steps: devPrismaClientSteps(),
            }
          : undefined,
      );
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return apiError(404, "NOT_FOUND", "Resource not found.");
    }
    if (error.code === "P2002") {
      return apiError(409, "CONFLICT", "Conflict.");
    }
    if (error.code === "P2021" || error.code === "P2022") {
      return apiError(
        500,
        "DB_NOT_READY",
        isDev()
          ? "Database not initialized (migrations not applied)."
          : "Database is not ready.",
        isDev() ? { prismaCode: error.code } : undefined,
        isDev()
          ? {
              steps: devDbNotReadySteps(),
            }
          : undefined,
      );
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    if (looksLikeDbConnectionFailed(error)) {
      return apiError(
        500,
        "DB_CONNECTION_FAILED",
        isDev()
          ? "Cannot connect to Postgres. Check docker-compose and DATABASE_URL."
          : "Database connection failed.",
        undefined,
        isDev() ? { steps: devDbConnectionSteps() } : undefined,
      );
    }

    if (looksLikePrismaClientIssue(error)) {
      return apiError(
        500,
        "PRISMA_CLIENT_ERROR",
        isDev()
          ? "Prisma client not generated. Run: pnpm prisma generate."
          : "Internal server error.",
        undefined,
        isDev() ? { steps: devPrismaClientSteps() } : undefined,
      );
    }

    return apiError(
      500,
      "PRISMA_CLIENT_ERROR",
      isDev()
        ? "Prisma client initialization failed."
        : "Internal server error.",
      undefined,
      isDev()
        ? {
            hints: ["Check DATABASE_URL and Prisma client generation."],
            steps: ["pnpm prisma generate", "pnpm prisma migrate dev"],
          }
        : undefined,
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return apiError(
      500,
      "PRISMA_CLIENT_ERROR",
      isDev() ? "Prisma query validation failed." : "Internal server error.",
      isDev() ? { prisma: "validation" } : undefined,
    );
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return apiError(500, "INTERNAL_ERROR", "Unexpected database engine error.");
  }

  return apiError(500, fallbackCode, fallbackMessage);
}
