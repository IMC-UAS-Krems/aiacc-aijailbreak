import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './load-module.mjs';

const { SAVE_KEY, freshProgress, sanitize, loadProgress, writeProgress, clearProgress } = await loadModule('progress');
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
let data;
const started = (completed = false) => ({ version: 1, started: true, currentLevel: 1, completedLevels: completed ? [1] : [] });

beforeEach(() => {
  data = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  } });
});
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});

test('absent save starts a new adventure', () => {
  assert.deepEqual(loadProgress(), { progress: freshProgress(), warning: '' });
});
test('started and completed progress survive writing and reading', () => {
  for (const progress of [
    started(false),
    started(true),
    { version: 1, started: true, currentLevel: 2, completedLevels: [1] },
    { version: 1, started: true, currentLevel: 2, completedLevels: [1, 2] },
    { version: 1, started: true, currentLevel: 4, completedLevels: [1, 2, 4] },
  ]) {
    assert.equal(writeProgress(progress), '');
    assert.deepEqual(loadProgress().progress, progress);
  }
});
test('forged progress never retains unsupported or duplicate level IDs', () => {
  for (const currentLevel of [0, 6, 5, 999]) {
    const value = { ...started(true), currentLevel, completedLevels: [1, 1, 6, 5, '1', true], unlockedLevels: [1, 2, 3, 4, 5] };
    data.set(SAVE_KEY, JSON.stringify(value));
    assert.deepEqual(loadProgress().progress, started(true));
    assert.deepEqual(JSON.parse(data.get(SAVE_KEY)), started(true));
  }
  // Check deduplication of supported levels
  const multiValue = { version: 1, started: true, currentLevel: 2, completedLevels: [1, 2, 1, 2, 5, '2', false] };
  data.set(SAVE_KEY, JSON.stringify(multiValue));
  assert.deepEqual(loadProgress().progress, { version: 1, started: true, currentLevel: 2, completedLevels: [1, 2] });
});
test('invalid schemas recover to fresh progress', () => {
  for (const value of [null, [], 42, {}, { ...started(), version: 999 },
    { ...started(), started: 'true' }, { ...started(), completedLevels: 'all' },
    { ...started(), currentLevel: true }, { ...started(), currentLevel: '1' },
    { ...started(), currentLevel: 1.5 }]) {
    assert.deepEqual(sanitize(value), freshProgress());
  }
});
test('malformed JSON recovers and repairs the saved value', () => {
  data.set(SAVE_KEY, '{broken');
  assert.deepEqual(loadProgress().progress, freshProgress());
  assert.deepEqual(JSON.parse(data.get(SAVE_KEY)), freshProgress());
});
test('unstarted saves cannot claim completion', () => {
  assert.deepEqual(sanitize({ ...started(true), started: false }), freshProgress());
});
test('unavailable storage leaves progress usable and reports a warning', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
  assert.deepEqual(loadProgress().progress, freshProgress());
  assert.match(loadProgress().warning, /cannot be saved/i);
  assert.match(writeProgress(started()), /cannot be saved/i);
  assert.match(clearProgress(), /could not be reset/i);
});
test('full storage preserves readable completion and reports write failures', () => {
  data.set(SAVE_KEY, JSON.stringify(started(true)));
  localStorage.setItem = () => { throw new Error('Storage full'); };
  assert.deepEqual(loadProgress().progress, started(true));
  assert.match(loadProgress().warning, /cannot be saved/i);
  assert.match(writeProgress(started(true)), /cannot be saved/i);
});
test('reset removes only the game save', () => {
  writeProgress(started(true)); data.set('unrelated-setting', 'keep');
  assert.equal(clearProgress(), '');
  assert.equal(data.has(SAVE_KEY), false);
  assert.equal(data.get('unrelated-setting'), 'keep');
  assert.deepEqual(loadProgress().progress, freshProgress());
});
