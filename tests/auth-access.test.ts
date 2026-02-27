import assert from "node:assert/strict";
import test from "node:test";

import { getTeacherToolsRedirectReason, isTeacherRole } from "@/src/lib/auth/access";
import { forbidden } from "@/src/lib/api/errors";

test("isTeacherRole returns false for student and true for teacher/admin", () => {
  assert.equal(isTeacherRole("student"), false);
  assert.equal(isTeacherRole("teacher"), true);
  assert.equal(isTeacherRole("admin"), true);
});

test("getTeacherToolsRedirectReason returns auth when session is missing", () => {
  assert.equal(getTeacherToolsRedirectReason(null), "auth");
});

test("getTeacherToolsRedirectReason returns role for student", () => {
  assert.equal(
    getTeacherToolsRedirectReason({
      id: "u1",
      role: "student",
      email: "student@example.com",
    }),
    "role",
  );
});

test("getTeacherToolsRedirectReason allows teacher/admin", () => {
  assert.equal(
    getTeacherToolsRedirectReason({
      id: "u2",
      role: "teacher",
      email: "teacher@example.com",
    }),
    null,
  );
  assert.equal(
    getTeacherToolsRedirectReason({
      id: "u3",
      role: "admin",
      email: "admin@example.com",
    }),
    null,
  );
});

test("forbidden helper returns 403 API payload", () => {
  const result = forbidden("Teacher role required");
  assert.equal(result.status, 403);
  assert.equal(result.body.code, "FORBIDDEN");
  assert.equal(result.body.message, "Teacher role required");
});
