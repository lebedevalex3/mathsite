import test from 'node:test';
import assert from 'node:assert/strict';

import { validateDemoPlan, DEMO_MAX_TOTAL_TASKS } from '@/src/lib/teacher-tools/demo';

test('validateDemoPlan normalizes positive counts', () => {
  const result = validateDemoPlan([
    { skillId: 'a', count: 2 },
    { skillId: 'b', count: 0 },
    { skillId: 'c', count: 3.8 },
  ], 2);

  assert.deepEqual(result.normalized, [
    { skillId: 'a', count: 2 },
    { skillId: 'c', count: 3 },
  ]);
  assert.equal(result.totalPerVariant, 5);
});

test('validateDemoPlan rejects too many tasks', () => {
  assert.throws(
    () => validateDemoPlan([{ skillId: 'a', count: DEMO_MAX_TOTAL_TASKS + 1 }], 1),
    /Total tasks per variant/,
  );
});
