import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminSectionErrors,
  formatAdminSectionFailures,
} from "@/src/components/ui/admin-page-client.utils";

test("formatAdminSectionFailures reports only rejected sections and keeps fulfilled sections healthy", () => {
  const failures = formatAdminSectionFailures({
    results: [
      { status: "fulfilled", value: undefined },
      { status: "rejected", reason: new Error("audit temporarily unavailable") },
      { status: "fulfilled", value: undefined },
    ],
    sectionNames: ["Students", "Audit", "Content"],
    formatSectionError: (label, reason) => `${label}: ${reason instanceof Error ? reason.message : "fallback"}`,
  });

  assert.deepEqual(failures, ["Audit: audit temporarily unavailable"]);
});

test("formatAdminSectionFailures uses fallback formatter for non-Error rejection reasons", () => {
  const failures = formatAdminSectionFailures({
    results: [{ status: "rejected", reason: "bad_gateway" }],
    sectionNames: ["Students", "Audit", "Content"],
    formatSectionError: (label, reason) => `${label}: ${reason instanceof Error ? reason.message : "fallback"}`,
  });

  assert.deepEqual(failures, ["Students: fallback"]);
});

test("buildAdminSectionErrors returns per-section messages for rejected sections only", () => {
  const sectionErrors = buildAdminSectionErrors({
    results: [
      { status: "rejected", reason: new Error("students failed") },
      { status: "fulfilled", value: undefined },
      { status: "rejected", reason: new Error("content failed") },
    ],
    sectionNames: ["Students", "Audit", "Content"],
    formatSectionError: (label, reason) => `${label}: ${reason instanceof Error ? reason.message : "fallback"}`,
  });

  assert.deepEqual(sectionErrors, {
    students: "Students: students failed",
    logs: null,
    content: "Content: content failed",
  });
});
