import test from "node:test";
import assert from "node:assert/strict";

import { compileRoutes } from "@/src/lib/teacher-tools/routes";

test("compileRoutes applies skill map, sorts steps, and excludes missing skills with warnings", () => {
  const routes = compileRoutes(
    [
      {
        routeId: "r1",
        title: "Route 1",
        steps: [
          { step_id: "S2", skill_key: "k2", allowed_bands: ["B"], order: 2 },
          { step_id: "S1", skill_key: "k1", allowed_bands: ["A"], order: 1 },
          { step_id: "S3", skill_key: "missing", allowed_bands: ["C"], order: 3 },
        ],
      },
    ],
    {
      k1: "math.proportion.find_unknown_term",
      k2: "math.proportion.check_proportion",
    },
    new Set(["math.proportion.find_unknown_term"]),
  );

  assert.equal(routes.length, 1);
  assert.equal(routes[0]?.steps.length, 1);
  assert.equal(routes[0]?.steps[0]?.step_id, "S1");
  assert.ok(routes[0]?.warnings?.some((warning) => warning.includes("Excluded step")));
});
