import assert from "node:assert/strict";
import test from "node:test";

import { getTeacherToolsRedirectReason } from "@/src/lib/auth/access";
import { buildTeacherCabinetRedirectHref } from "@/src/lib/auth/teacher-tools-guard";

test("teacher tools guard builds auth redirect URL", () => {
  const reason = getTeacherToolsRedirectReason(null);
  assert.equal(reason, "auth");
  assert.equal(buildTeacherCabinetRedirectHref("ru", reason), "/ru/teacher/cabinet?reason=auth");
});

test("teacher tools guard builds role redirect URL for student", () => {
  const reason = getTeacherToolsRedirectReason({
    id: "u1",
    role: "student",
    email: "student@example.com",
  });
  assert.equal(reason, "role");
  assert.equal(buildTeacherCabinetRedirectHref("en", reason), "/en/teacher/cabinet?reason=role");
});

test("teacher tools guard allows teacher/admin without redirect reason", () => {
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
