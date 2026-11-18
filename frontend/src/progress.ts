export const SAVE_KEY = 'robin-hoodie.progress.v1';
export interface Progress { version: 1; started: boolean; currentLevel: 1; completedLevels: number[] }
export const freshProgress = (): Progress => ({ version: 1, started: false, currentLevel: 1, completedLevels: [] });
export const SAVE_WARNING = 'Progress cannot be saved in this browser. You can still play in this session.';

export function sanitize(value: unknown): Progress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return freshProgress();
  const saved = value as Record<string, unknown>;
  if (saved.version !== 1 || typeof saved.started !== 'boolean' ||
      typeof saved.currentLevel !== 'number' || !Number.isInteger(saved.currentLevel) ||
      !Array.isArray(saved.completedLevels)) return freshProgress();
  return { version: 1, started: saved.started, currentLevel: 1,
    completedLevels: saved.started && saved.completedLevels.includes(1) ? [1] : [] };
}

export function loadProgress(): { progress: Progress; warning: string } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { progress: freshProgress(), warning: '' };
    let progress: Progress;
    try { progress = sanitize(JSON.parse(raw)); } catch { progress = freshProgress(); }
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); }
    catch { return { progress, warning: SAVE_WARNING }; }
    return { progress, warning: '' };
  } catch { return { progress: freshProgress(), warning: SAVE_WARNING }; }
}

export function writeProgress(progress: Progress): string {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); return ''; }
  catch { return SAVE_WARNING; }
}

export function clearProgress(): string {
  try { localStorage.removeItem(SAVE_KEY); return ''; }
  catch { return 'Progress could not be reset in browser storage. This session has been reset.'; }
}
