import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDemoTemplate,
  buildDemoVariantDrafts,
  parseDemoDifficulty,
  shouldEnforceDemoRateLimit,
  validateDemoPlan,
  DEMO_MAX_TOTAL_TASKS,
  shuffleItemsWithSeed,
} from '@/src/lib/teacher-tools/demo';
import { InsufficientTasksError } from '@/src/lib/variants/plan';
import type { Task } from '@/lib/tasks/schema';

test('validateDemoPlan normalizes positive counts', () => {
  const result = validateDemoPlan([
    { skillId: 'a', count: 2 },
    { skillId: 'b', count: 0 },
    { skillId: 'c', count: 3.8 },
    { skillId: 'd', count: 2, difficulty: 2 },
  ], 2);

  assert.deepEqual(result.normalized, [
    { skillId: 'a', count: 2 },
    { skillId: 'c', count: 3 },
    { skillId: 'd', count: 2, difficulty: 2 },
  ]);
  assert.equal(result.totalPerVariant, 7);
});

test('parseDemoDifficulty supports legacy string formats', () => {
  assert.equal(parseDemoDifficulty(1), 1);
  assert.equal(parseDemoDifficulty('1'), 1);
  assert.equal(parseDemoDifficulty('L1'), 1);
  assert.equal(parseDemoDifficulty('level 2'), 2);
  assert.equal(parseDemoDifficulty('L3'), 3);
  assert.equal(parseDemoDifficulty('any'), undefined);
});

test('validateDemoPlan keeps fixed difficulty when payload uses L1/L2/L3', () => {
  const rawPlan = [
    { skillId: 'math.proportion.check_proportion', count: 5, difficulty: 'L1' },
  ] as unknown as Parameters<typeof validateDemoPlan>[0];

  const result = validateDemoPlan(rawPlan, 2);
  assert.deepEqual(result.normalized, [
    { skillId: 'math.proportion.check_proportion', count: 5, difficulty: 1 },
  ]);
});

test('shouldEnforceDemoRateLimit is enabled by default and supports override', () => {
  assert.equal(shouldEnforceDemoRateLimit({ NODE_ENV: 'production' } as NodeJS.ProcessEnv), true);
  assert.equal(shouldEnforceDemoRateLimit({ NODE_ENV: 'development' } as NodeJS.ProcessEnv), true);
  assert.equal(
    shouldEnforceDemoRateLimit({
      NODE_ENV: 'development',
      DEMO_ENFORCE_RATE_LIMIT: '1',
    } as NodeJS.ProcessEnv),
    true,
  );
  assert.equal(
    shouldEnforceDemoRateLimit({
      NODE_ENV: 'production',
      DEMO_ENFORCE_RATE_LIMIT: '0',
    } as NodeJS.ProcessEnv),
    false,
  );
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
    topicId: 'math.proportion',
    plan: [
      { skillId: 'math.proportion.find_unknown_term', count: 2 },
      { skillId: 'math.proportion.solve_hidden_linear_fraction', count: 1 },
    ],
    skillsById: new Map([
      ['math.proportion.find_unknown_term', { title: 'Найти неизвестный член пропорции' }],
      ['math.proportion.solve_hidden_linear_fraction', { title: 'Скрытые дробные пропорции' }],
    ]),
    mode: 'custom',
  });

  assert.equal(template.id, 'demo.math.proportion.custom');
  assert.equal(template.topicId, 'math.proportion');
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
        skillIds: ['math.proportion.find_unknown_term'],
        count: 2,
        difficulty: [1, 5],
      },
      {
        label: 'Скрытые дробные пропорции',
        skillIds: ['math.proportion.solve_hidden_linear_fraction'],
        count: 1,
        difficulty: [1, 5],
      },
    ],
  );
});

test('buildDemoTemplate supports fixed per-skill difficulty', () => {
  const template = buildDemoTemplate({
    topicId: 'math.proportion',
    plan: [{ skillId: 'math.proportion.solve_hidden_linear_fraction', count: 2, difficulty: 3 }],
    skillsById: new Map([
      ['math.proportion.solve_hidden_linear_fraction', { title: 'Скрытые дробные пропорции' }],
    ]),
    mode: 'custom',
  });

  assert.deepEqual(template.sections[0]?.difficulty, [3, 3]);
});

test('buildDemoVariantDrafts allows task reuse between variants', () => {
  const tasks: Task[] = Array.from({ length: 10 }, (_, index) => ({
    id: `math.proportion.check_proportion.${String(index + 1).padStart(6, '0')}`,
    topic_id: 'math.proportion',
    skill_id: 'math.proportion.check_proportion',
    difficulty: index < 5 ? 1 : 2,
    statement_md: `Задача #${index + 1}`,
    answer: { type: 'number', value: index + 1 },
  }));

  const template = buildDemoTemplate({
    topicId: 'math.proportion',
    plan: [{ skillId: 'math.proportion.check_proportion', count: 10 }],
    skillsById: new Map([
      ['math.proportion.check_proportion', { title: 'Проверить пропорцию' }],
    ]),
    mode: 'custom',
  });

  const drafts = buildDemoVariantDrafts({
    tasks,
    template,
    variantsCount: 2,
    seed: 42,
    topicId: 'math.proportion',
  });

  assert.equal(drafts.length, 2);
  assert.equal(drafts[0]?.ordered.length, 10);
  assert.equal(drafts[1]?.ordered.length, 10);
});

test('buildDemoVariantDrafts requires enough unique tasks for fixed level across variants', () => {
  const tasks: Task[] = Array.from({ length: 10 }, (_, index) => ({
    id: `math.proportion.check_proportion.${String(index + 1).padStart(6, '0')}`,
    topic_id: 'math.proportion',
    skill_id: 'math.proportion.check_proportion',
    difficulty: index < 5 ? 1 : 2,
    statement_md: `Задача #${index + 1}`,
    answer: { type: 'number', value: index + 1 },
  }));

  const template = buildDemoTemplate({
    topicId: 'math.proportion',
    plan: [{ skillId: 'math.proportion.check_proportion', count: 5, difficulty: 1 }],
    skillsById: new Map([
      ['math.proportion.check_proportion', { title: 'Проверить пропорцию' }],
    ]),
    mode: 'custom',
  });

  assert.throws(
    () =>
      buildDemoVariantDrafts({
        tasks,
        template,
        variantsCount: 2,
        seed: 42,
        topicId: 'math.proportion',
      }),
    (error: unknown) => {
      assert.ok(error instanceof InsufficientTasksError);
      assert.equal(error.details.requiredCount, 10);
      assert.equal(error.details.availableCount, 5);
      assert.deepEqual(error.details.difficulty, [1, 1]);
      return true;
    },
  );
});
