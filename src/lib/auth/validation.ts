type ValidationError = {
  code: string;
  message: string;
};

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ValidationError };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateSignInInput(payload: {
  identifier?: unknown;
  email?: unknown;
  password?: unknown;
}): ValidationResult<{ identifier: string; password: string }> {
  const identifier = asString(payload.identifier ?? payload.email).toLowerCase();
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!identifier || !password) {
    return {
      ok: false,
      error: {
        code: "AUTH_INPUT_INVALID",
        message: "identifier and password are required",
      },
    };
  }

  return { ok: true, value: { identifier, password } };
}

export function validateSignUpInput(payload: {
  identifier?: unknown;
  email?: unknown;
  password?: unknown;
}): ValidationResult<{ email: string; password: string }> {
  const email = asString(payload.email ?? payload.identifier).toLowerCase();
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!email || !password) {
    return {
      ok: false,
      error: {
        code: "AUTH_INPUT_INVALID",
        message: "email and password are required",
      },
    };
  }
  if (!EMAIL_RE.test(email)) {
    return {
      ok: false,
      error: {
        code: "INVALID_EMAIL",
        message: "email must be a valid address",
      },
    };
  }

  return { ok: true, value: { email, password } };
}

export function validateChangePasswordInput(payload: {
  currentPassword?: unknown;
  newPassword?: unknown;
}): ValidationResult<{ currentPassword: string; newPassword: string }> {
  const currentPassword =
    typeof payload.currentPassword === "string" ? payload.currentPassword : "";
  const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

  if (!currentPassword || !newPassword) {
    return {
      ok: false,
      error: {
        code: "AUTH_PASSWORD_INPUT_INVALID",
        message: "currentPassword and newPassword are required",
      },
    };
  }
  if (currentPassword === newPassword) {
    return {
      ok: false,
      error: {
        code: "PASSWORD_REUSE_FORBIDDEN",
        message: "newPassword must differ from currentPassword",
      },
    };
  }

  return { ok: true, value: { currentPassword, newPassword } };
}

export function validateStudentId(studentId: string): ValidationResult<{ studentId: string }> {
  if (!UUID_RE.test(studentId)) {
    return {
      ok: false,
      error: {
        code: "INVALID_STUDENT_ID",
        message: "student id must be a UUID",
      },
    };
  }
  return { ok: true, value: { studentId } };
}
