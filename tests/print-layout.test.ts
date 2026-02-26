import test from 'node:test';
import assert from 'node:assert/strict';

import { chunkIntoPages, parsePrintLayout } from '@/src/lib/variants/print-layout';

test('parsePrintLayout defaults to single', () => {
  assert.equal(parsePrintLayout(undefined), 'single');
  assert.equal(parsePrintLayout('weird'), 'single');
  assert.equal(parsePrintLayout('two'), 'two');
  assert.equal(parsePrintLayout('two_dup'), 'two_dup');
  assert.equal(parsePrintLayout('two_cut'), 'two_cut');
});

test('chunkIntoPages chunks by layout', () => {
  assert.deepEqual(chunkIntoPages([1,2,3], 'single'), [[1],[2],[3]]);
  assert.deepEqual(chunkIntoPages([1,2,3], 'two_dup'), [[1],[2],[3]]);
  assert.deepEqual(chunkIntoPages([1,2,3,4,5], 'two'), [[1,2],[3,4],[5]]);
  assert.deepEqual(chunkIntoPages([1,2,3,4,5], 'two_cut'), [[1,2],[3,4],[5]]);
});
