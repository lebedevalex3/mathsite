import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateDemoPlan,
  DEMO_MAX_TOTAL_TASKS,
  shuffleItemsWithSeed,
} from '@/src/lib/teacher-tools/demo';

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

test('shuffleItemsWithSeed is deterministic for the same seed', () => {
  const items = [1, 2, 3, 4, 5, 6];

  const a = shuffleItemsWithSeed(items, 'demo-seed');
  const b = shuffleItemsWithSeed(items, 'demo-seed');

  assert.deepEqual(a, b);
  assert.deepEqual([...a].sort((x, y) => x - y), items);
});

test('shuffleItemsWithSeed usually differs for different seeds', () => {
  const items = [1, 2, 3, 4, 5, 6];

  const a = shuffleItemsWithSeed(items, 'demo-seed-a');
  const b = shuffleItemsWithSeed(items, 'demo-seed-b');

  assert.notDeepEqual(a, b);
});
