import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type Level } from './api';
import { Castle, Robin, Scenery } from './Artwork';
import { clearProgress, freshProgress, loadProgress, writeProgress, type Progress } from './progress';
import LevelOne from './LevelOne';

function ResetDialog({ cancel, confirm }: { cancel: () => void; confirm: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} aria-labelledby="reset-title" onCancel={cancel}>
    <h2 id="reset-title">Reset progress</h2>
    <p>Start your adventure again? Your saved progress will be removed.</p>
    <div className="dialog-actions"><button className="secondary" onClick={cancel} autoFocus>Cancel</button><button onClick={confirm}>Reset progress</button></div>
  </dialog>;
}

export default function App() {
  const [initial] = useState(loadProgress);
  const [progress, setProgress] = useState(initial.progress);
  const progressRef = useRef(initial.progress);
  const [warning, setWarning] = useState(initial.warning);
  const [path, setPath] = useState(window.location.pathname);
  const [attempt, setAttempt] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [catalogueError, setCatalogueError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);

  const loadLevels = useCallback(() => {
    setCatalogueError('');
    api<{ levels: Level[] }>('/levels').then(data => {
      if (!Array.isArray(data.levels)) throw new Error('Invalid level catalogue. Please restart the local backend.');
      setLevels(data.levels);
    }).catch(error => setCatalogueError(error.message));
  }, []);
  useEffect(loadLevels, [loadLevels]);
  useEffect(() => {
    const back = () => { setPath(window.location.pathname); setAttempt(n => n + 1); };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, []);
  useEffect(() => { heading.current?.focus(); }, [path]);

  const persist = useCallback((update: (old: Progress) => Progress) => {
    const prev = progressRef.current;
    const next = update(prev);
    if (
      prev.started === next.started &&
      prev.currentLevel === next.currentLevel &&
      prev.completedLevels.length === next.completedLevels.length &&
      prev.completedLevels.every((val, idx) => val === next.completedLevels[idx])
    ) {
      return;
    }
    progressRef.current = next;
    setProgress(next);
    setWarning(writeProgress(next));
  }, []);
  const started = useCallback((levelId: number = 1) => persist(old => {
    if (old.started && old.currentLevel === levelId) return old;
    return { ...old, started: true, currentLevel: levelId };
  }), [persist]);
  const completed = useCallback((levelId: number) => persist(old => {
    const nextCompleted = Array.from(new Set([...old.completedLevels, levelId])).sort((a, b) => a - b);
    const nextCurrent = levelId === 1 ? 2 : levelId;
    if (
      old.started &&
      old.currentLevel === nextCurrent &&
      old.completedLevels.length === nextCompleted.length &&
      old.completedLevels.every((val, idx) => val === nextCompleted[idx])
    ) {
      return old;
    }
    return { ...old, started: true, currentLevel: nextCurrent, completedLevels: nextCompleted };
  }), [persist]);
  const navigate = useCallback((next: string) => {
    if (next !== window.location.pathname) window.history.pushState({}, '', next);
    setPath(next); setAttempt(n => n + 1); window.scrollTo(0, 0);
  }, []);
  const home = useCallback(() => navigate('/'), [navigate]);
  const play = useCallback((levelId: number = 1) => navigate(`/level/${levelId}`), [navigate]);
  const playNext = useCallback(() => play(2), [play]);
  const replay = useCallback(() => setAttempt(n => n + 1), []);
  const inLevel1 = path === '/level/1';
  const inLevel2 = path === '/level/2';
  const inGame = inLevel1 || inLevel2;
  const currentLevelId = inLevel2 ? 2 : 1;
  const chooser = path === '/levels';
  const menu = path === '/';

  const isLevel2Unlocked = progress.completedLevels.includes(1);
  const isLevel2Completed = progress.completedLevels.includes(2);

  return <div className={`app ${inGame ? 'game-view' : 'home-view'}`}>
    <Scenery />
    {inGame ? <header className="game-header"><span className="wordmark">Robin Hoodie</span><button className="header-back" onClick={home}>Back to menu</button></header> :
      <header className="title-header"><div className="leaves" aria-hidden="true"><i /><i /><i /></div><h1 ref={heading} tabIndex={-1}>Robin Hoodie</h1></header>}
    {warning && <p className="save-warning" data-testid="save-warning" role="status">{warning}</p>}
    {!inGame && catalogueError && <div className="service-warning" role="alert"><p>{catalogueError}</p><button className="secondary small" onClick={loadLevels}>Retry connection</button></div>}
    {menu && <main className="menu-content">
      <p className="premise">Outsmart the castle. Share the wealth.</p>
      <p className="intro">A little mischief. A good cause.<br />Recover the castle’s secret and help the villagers.</p>
      <div className="menu-actions">
        <button onClick={() => play(isLevel2Unlocked && !isLevel2Completed ? 2 : 1)}>
          {progress.started ? 'Continue' : 'Start game'}<span aria-hidden="true"> →</span>
        </button>
        <button onClick={() => navigate('/levels')}>Choose level</button>
      </div>
      <p className="availability">{isLevel2Unlocked ? 'Level 2 is unlocked. Adventure on.' : 'One open gate. Your adventure begins here.'}</p>
      {progress.started && <button className="text-button" onClick={() => setResetOpen(true)}>Reset progress</button>}
      <div className="menu-robin"><Robin /><span>Small hoodie. Big heart.</span></div>
    </main>}
    {chooser && <main className="chooser-content">
      <h2 className="sage-label">Choose your trail</h2><p className="intro">Every adventure starts with an open gate.</p>
      <div className="level-trail" aria-label="Levels">
        {[1, 2, 3, 4, 5].map(id => {
          const isL1 = id === 1;
          const isL2 = id === 2;
          const isAvailable = isL1 || (isL2 && isLevel2Unlocked);
          const isDone = isL1 ? progress.completedLevels.includes(1) : (isL2 ? isLevel2Completed : false);
          return <button key={id} data-testid={`level-option-${id}`} className={`level-option ${isAvailable ? 'available' : ''} ${isDone ? 'completed' : ''}`} disabled={!isAvailable} onClick={() => play(id)}>
            <span className="level-disc">
              <span>{id}</span>
              <span className="level-symbol" aria-hidden="true">{!isAvailable ? '⌑' : (isDone ? '✓' : '▶')}</span>
            </span>
            <strong>{!isAvailable ? 'Locked' : (isDone ? 'Completed' : (levels.find(level => level.id === id)?.name || (isL1 ? 'The Open Gate' : 'The Guarded Gate')))}</strong>
            <small>{!isAvailable ? (isL2 ? 'Complete Level 1 first' : 'Unavailable in this version') : (isDone ? 'Play again' : 'Ready to play')}</small>
          </button>;
        })}
      </div>
      {isLevel2Unlocked && !isLevel2Completed ? (
        <button className="play-level" onClick={() => play(2)}>Play Level 2 <span aria-hidden="true">→</span></button>
      ) : (
        <button className="play-level" onClick={() => play(1)}>{progress.completedLevels.includes(1) ? 'Play Level 1' : 'Play Level 1'} <span aria-hidden="true">→</span></button>
      )}
      <button className="secondary" onClick={home}>Back to menu</button>
      <p className="availability">Levels 3–5 are coming later.</p>
      <Robin className="chooser-robin" />
    </main>}
    {inGame && (
      inLevel2 && !isLevel2Unlocked ? (
        <main className="unavailable">
          <Castle />
          <h2>The Guarded Gate is locked.</h2>
          <p>You must recover the secret from Level 1 first.</p>
          <button onClick={() => play(1)}>Play Level 1</button>
        </main>
      ) : (
        <LevelOne
          key={`${currentLevelId}-${attempt}`}
          levelId={currentLevelId}
          onStarted={started}
          onCompleted={completed}
          onReplay={replay}
          onPlayNext={currentLevelId === 1 ? playNext : undefined}
        />
      )
    )}
    {!menu && !chooser && !inGame && <main className="unavailable"><Castle /><h2>This gate isn’t open yet.</h2><p>This level is unavailable in this version.</p><button onClick={home}>Back to menu</button></main>}
    {!inGame && <footer>A LITTLE ADVENTURE IN AI SECURITY <span aria-hidden="true">·</span> {isLevel2Unlocked ? 'LEVEL 2 UNLOCKED' : 'LEVEL 1'}</footer>}
    {resetOpen && <ResetDialog cancel={() => setResetOpen(false)} confirm={() => { void api('/reset').catch(() => {}); setWarning(clearProgress()); progressRef.current = freshProgress(); setProgress(progressRef.current); setResetOpen(false); home(); }} />}
  </div>;
}
