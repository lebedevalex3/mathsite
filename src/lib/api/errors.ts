import { Prisma } from "@prisma/client";

export type ApiErrorBody = {
  ok: false;
  code: string;
  message: string;
  details?: unknown;
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
): ApiErrorResult {
  return {
    status,
    body: details === undefined ? { ok: false, code, message } : { ok: false, code, message, details },
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
    /underlying table .* does not exist/i.test(error.message) ||
    /migrations? not applied/i.test(error.message)
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

export function badRequest(message: string, code = "BAD_REQUEST"): ApiErrorResult {
  return apiError(400, code, message);
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
          ? "Database not initialized / migrations not applied. Run prisma migrate dev."
          : "Database not initialized.",
      );
    }

    if (looksLikePrismaClientIssue(error)) {
      return apiError(
        500,
        "PRISMA_CLIENT_ERROR",
        isDev()
          ? "Prisma client not generated. Run prisma generate."
          : "Database client initialization error.",
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
          ? "Database not initialized / migrations not applied. Run prisma migrate dev."
          : "Database not initialized.",
      );
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return apiError(
      500,
      "PRISMA_CLIENT_ERROR",
      isDev()
        ? "Prisma client initialization failed. Check DATABASE_URL and run prisma generate."
        : "Database client initialization error.",
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return apiError(
      500,
      "PRISMA_CLIENT_ERROR",
      isDev() ? "Prisma query validation failed." : "Database query error.",
    );
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return apiError(500, "INTERNAL_ERROR", "Unexpected database engine error.");
  }

  return apiError(500, fallbackCode, fallbackMessage);
}
