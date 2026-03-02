import test from "node:test";
import assert from "node:assert/strict";

import {
  validateChangePasswordInput,
  validateSignInInput,
  validateSignUpInput,
  validateStudentId,
} from "@/src/lib/auth/validation";

test("validateSignInInput accepts identifier and password", () => {
  const result = validateSignInInput({
    identifier: "Teacher@School.RU",
    password: "secret123",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.identifier, "teacher@school.ru");
  assert.equal(result.value.password, "secret123");
});

test("validateSignInInput rejects missing fields", () => {
  const result = validateSignInInput({ identifier: "", password: "" });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "AUTH_INPUT_INVALID");
});

test("validateSignUpInput requires valid email", () => {
  const result = validateSignUpInput({
    email: "not-an-email",
    password: "secret123",
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "INVALID_EMAIL");
});

test("validateSignUpInput accepts normalized email", () => {
  const result = validateSignUpInput({
    email: "Teacher@School.RU",
    password: "secret123",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.email, "teacher@school.ru");
});

test("validateChangePasswordInput requires both values", () => {
  const result = validateChangePasswordInput({
    currentPassword: "",
    newPassword: "next-password",
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "AUTH_PASSWORD_INPUT_INVALID");
});

test("validateChangePasswordInput rejects password reuse", () => {
  const result = validateChangePasswordInput({
    currentPassword: "same-password",
    newPassword: "same-password",
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "PASSWORD_REUSE_FORBIDDEN");
});

test("validateStudentId requires UUID", () => {
  const result = validateStudentId("abc");
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "INVALID_STUDENT_ID");
});

test("validateStudentId accepts UUID", () => {
  const result = validateStudentId("123e4567-e89b-12d3-a456-426614174000");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.studentId, "123e4567-e89b-12d3-a456-426614174000");
});
