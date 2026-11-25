export const SAVE_KEY = 'robin-hoodie.progress.v1';
export interface Progress { version: 1; started: boolean; currentLevel: number; completedLevels: number[] }
export const freshProgress = (): Progress => ({ version: 1, started: false, currentLevel: 1, completedLevels: [] });
export const SAVE_WARNING = 'Progress cannot be saved in this browser. You can still play in this session.';

export const SUPPORTED_LEVELS = [1, 2, 4] as const;

export function sanitize(value: unknown): Progress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return freshProgress();
  const saved = value as Record<string, unknown>;
  if (saved.version !== 1 || typeof saved.started !== 'boolean' ||
      typeof saved.currentLevel !== 'number' || !Number.isInteger(saved.currentLevel) ||
      !Array.isArray(saved.completedLevels)) return freshProgress();
  if (!saved.started) return freshProgress();

  const completedLevels = Array.from(new Set(
    saved.completedLevels.filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && (SUPPORTED_LEVELS as readonly number[]).includes(id))
  )).sort((a, b) => a - b);

  const currentLevel = (SUPPORTED_LEVELS as readonly number[]).includes(saved.currentLevel) ? saved.currentLevel : 1;

  return { version: 1, started: true, currentLevel, completedLevels };
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
