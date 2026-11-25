import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type Level } from './api';
import { Castle, Robin, Scenery } from './Artwork';
import { clearProgress, freshProgress, loadProgress, SUPPORTED_LEVELS, writeProgress, type Progress } from './progress';
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
    const nextCurrent = SUPPORTED_LEVELS.find(id => !nextCompleted.includes(id)) ?? levelId;
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
  const replay = useCallback(() => setAttempt(n => n + 1), []);
  const currentLevelId = SUPPORTED_LEVELS.find(id => path === `/level/${id}`);
  const inGame = currentLevelId !== undefined;
  const chooser = path === '/levels';
  const menu = path === '/';

  const available = levels.filter(level => level.available);
  const resumeLevel = available.find(level => !progress.completedLevels.includes(level.id))
    ?? available[available.length - 1];
  const resumeId = resumeLevel?.id ?? 1;
  const nextId = currentLevelId === undefined ? undefined : SUPPORTED_LEVELS[SUPPORTED_LEVELS.indexOf(currentLevelId) + 1];

  return <div className={`app ${inGame ? 'game-view' : 'home-view'}`}>
    <Scenery />
    {inGame ? <header className="game-header"><span className="wordmark">Robin Hoodie</span><button className="header-back" onClick={home}>Back to menu</button></header> :
      <header className="title-header"><div className="leaves" aria-hidden="true"><i /><i /><i /></div><h1 ref={heading} tabIndex={-1}>Robin Hoodie</h1></header>}
    {warning && <p className="save-warning" data-testid="save-warning" role="status">{warning}</p>}
    {catalogueError && <div className="service-warning" role="alert"><p>{catalogueError}</p><button className="secondary small" onClick={loadLevels}>Retry connection</button></div>}
    {menu && <main className="menu-content">
      <p className="premise">Outsmart the castle. Share the wealth.</p>
      <p className="intro">A little mischief. A good cause.<br />Recover the castle’s secret and help the villagers.</p>
      <div className="menu-actions">
        <button disabled={!resumeLevel} onClick={() => play(resumeId)}>
          {progress.started ? 'Continue' : 'Start game'}<span aria-hidden="true"> →</span>
        </button>
        <button onClick={() => navigate('/levels')}>Choose level</button>
      </div>
      <p className="availability">{resumeId === 1 ? 'One open gate. Your adventure begins here.' : `Level ${resumeId} is open. Adventure on.`}</p>
      {progress.started && <button className="text-button" onClick={() => setResetOpen(true)}>Reset progress</button>}
      <div className="menu-robin"><Robin /><span>Small hoodie. Big heart.</span></div>
    </main>}
    {chooser && <main className="chooser-content">
      <h2 className="sage-label">Choose your trail</h2><p className="intro">Every adventure starts with an open gate.</p>
      <div className="level-trail" aria-label="Levels">
        {[1, 2, 3, 4, 5].map(id => {
          const level = levels.find(item => item.id === id);
          const isAvailable = level?.available;
          const isDone = progress.completedLevels.includes(id);
          return <button key={id} data-testid={`level-option-${id}`} className={`level-option ${isAvailable ? 'available' : ''} ${isDone ? 'completed' : ''}`} disabled={!isAvailable} onClick={() => play(id)}>
            <span className="level-disc">
              <span>{id}</span>
              <span className="level-symbol" aria-hidden="true">{!isAvailable ? '⌑' : (isDone ? '✓' : '▶')}</span>
            </span>
            <strong>{!isAvailable ? 'Locked' : (isDone ? 'Completed' : level?.name)}</strong>
            <small>{!level ? 'Checking availability' : !level.implemented ? 'Unavailable in this version' : !isAvailable ? `Complete Level ${id === 4 ? 2 : 1} first` : isDone ? 'Play again' : 'Ready to play'}</small>
          </button>;
        })}
      </div>
      <button className="play-level" disabled={!resumeLevel} onClick={() => play(resumeId)}>Play Level {resumeId} <span aria-hidden="true">→</span></button>
      <button className="secondary" onClick={home}>Back to menu</button>
      <p className="availability">Levels 3 and 5 are coming later.</p>
      <Robin className="chooser-robin" />
    </main>}
    {inGame && (
      !levels.length ? <p role="status">{catalogueError ? 'Level availability is unknown.' : 'Checking level access…'}</p> :
      !available.some(level => level.id === currentLevelId) ? (
        <main className="unavailable">
          <Castle />
          <h2>Level {currentLevelId} is locked.</h2>
          <p>Complete Level {currentLevelId === 4 ? 2 : 1} to open this gate.</p>
          <button onClick={() => navigate('/levels')}>Choose level</button>
        </main>
      ) : (
        <LevelOne
          key={`${currentLevelId}-${attempt}`}
          levelId={currentLevelId}
          onStarted={started}
          onCompleted={id => { completed(id); loadLevels(); }}
          onReplay={replay}
          nextId={nextId}
          onPlayNext={nextId === undefined ? undefined : () => play(nextId)}
        />
      )
    )}
    {!menu && !chooser && !inGame && <main className="unavailable"><Castle /><h2>This gate isn’t open yet.</h2><p>This level is unavailable in this version.</p><button onClick={home}>Back to menu</button></main>}
    {!inGame && <footer>A LITTLE ADVENTURE IN AI SECURITY <span aria-hidden="true">·</span> LEVEL {resumeId}</footer>}
    {resetOpen && <ResetDialog cancel={() => setResetOpen(false)} confirm={async () => {
      setResetOpen(false);
      try {
        await api('/reset', {});
        setWarning(clearProgress()); progressRef.current = freshProgress(); setProgress(progressRef.current);
        setLevels([]); loadLevels(); home();
      } catch (error) { setWarning(error instanceof Error ? error.message : 'Could not reset progress.'); }
    }} />}
  </div>;
}
