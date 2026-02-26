import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDemoTemplate,
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

test('shuffleItemsWithSeed does not mutate input array', () => {
  const items = [1, 2, 3, 4];
  const snapshot = [...items];

  void shuffleItemsWithSeed(items, 'immutability-seed');

  assert.deepEqual(items, snapshot);
});

test('buildDemoTemplate maps plan items into sections and labels', () => {
  const template = buildDemoTemplate({
    topicId: 'g5.proporcii',
    plan: [
      { skillId: 'g5.proporcii.find_unknown_term', count: 2 },
      { skillId: 'g5.proporcii.reshit_zadachu_na_masshtab', count: 1 },
    ],
    skillsById: new Map([
      ['g5.proporcii.find_unknown_term', { title: 'Найти неизвестный член пропорции' }],
      ['g5.proporcii.reshit_zadachu_na_masshtab', { title: 'Масштаб' }],
    ]),
    mode: 'custom',
  });

  assert.equal(template.id, 'demo.g5.proporcii.custom');
  assert.equal(template.topicId, 'g5.proporcii');
  assert.equal(template.header.gradeLabel, '5 класс');
  assert.equal(template.header.topicLabel, 'Пропорции');
  assert.deepEqual(
    template.sections.map((section) => ({
      label: section.label,
      skillIds: section.skillIds,
      count: section.count,
      difficulty: section.difficulty,
    })),
    [
      {
        label: 'Найти неизвестный член пропорции',
        skillIds: ['g5.proporcii.find_unknown_term'],
        count: 2,
        difficulty: [1, 5],
      },
      {
        label: 'Масштаб',
        skillIds: ['g5.proporcii.reshit_zadachu_na_masshtab'],
        count: 1,
        difficulty: [1, 5],
      },
    ],
  );
});
