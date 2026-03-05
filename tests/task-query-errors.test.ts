import test from "node:test";
import assert from "node:assert/strict";

import { filterTaskLoadErrorsByTopic } from "@/lib/tasks/query";

test("filterTaskLoadErrorsByTopic returns only errors for requested topic", () => {
  const errors = [
    { filePath: "data/tasks/proportion.json", message: "schema failed", topicId: "math.proportion" },
    { filePath: "data/tasks/equations.json", message: "schema failed", topicId: "math.equations" },
    { filePath: "data/tasks/broken.json", message: "invalid json" },
  ];

  const proportionErrors = filterTaskLoadErrorsByTopic(errors, "math.proportion");
  const equationsErrors = filterTaskLoadErrorsByTopic(errors, "math.equations");
  const fractionsErrors = filterTaskLoadErrorsByTopic(errors, "math.fractions_multiplication");

  assert.deepEqual(proportionErrors, ["data/tasks/proportion.json: schema failed"]);
  assert.deepEqual(equationsErrors, ["data/tasks/equations.json: schema failed"]);
  assert.deepEqual(fractionsErrors, []);
});
