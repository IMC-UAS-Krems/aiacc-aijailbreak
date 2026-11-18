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
    <p>Start your adventure again? Your saved Level 1 progress will be removed.</p>
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
    const next = update(progressRef.current);
    progressRef.current = next;
    setProgress(next);
    setWarning(writeProgress(next));
  }, []);
  const started = useCallback(() => persist(old => ({ ...old, started: true, currentLevel: 1 })), [persist]);
  const completed = useCallback(() => persist(old => ({ ...old, started: true, currentLevel: 1, completedLevels: [1] })), [persist]);
  const navigate = (next: string) => {
    if (next !== path) window.history.pushState({}, '', next);
    setPath(next); setAttempt(n => n + 1); window.scrollTo(0, 0);
  };
  const home = () => navigate('/');
  const play = () => navigate('/level/1');
  const inGame = path === '/level/1';
  const chooser = path === '/levels';
  const menu = path === '/';
  return <div className={`app ${inGame ? 'game-view' : 'home-view'}`}>
    <Scenery />
    {inGame ? <header className="game-header"><span className="wordmark">Robin Hoodie</span><button className="header-back" onClick={home}>Back to menu</button></header> :
      <header className="title-header"><div className="leaves" aria-hidden="true"><i /><i /><i /></div><h1 ref={heading} tabIndex={-1}>Robin Hoodie</h1></header>}
    {warning && <p className="save-warning" data-testid="save-warning" role="status">{warning}</p>}
    {!inGame && catalogueError && <div className="service-warning" role="alert"><p>{catalogueError}</p><button className="secondary small" onClick={loadLevels}>Retry connection</button></div>}
    {menu && <main className="menu-content">
      <p className="premise">Outsmart the castle. Share the wealth.</p>
      <p className="intro">A little mischief. A good cause.<br />Recover the castle’s secret and help the villagers.</p>
      <div className="menu-actions"><button onClick={play}>{progress.started ? 'Continue' : 'Start game'}<span aria-hidden="true"> →</span></button><button onClick={() => navigate('/levels')}>Choose level</button></div>
      <p className="availability">One open gate. Your adventure begins here.</p>
      {progress.started && <button className="text-button" onClick={() => setResetOpen(true)}>Reset progress</button>}
      <div className="menu-robin"><Robin /><span>Small hoodie. Big heart.</span></div>
    </main>}
    {chooser && <main className="chooser-content">
      <h2 className="sage-label">Choose your trail</h2><p className="intro">Every adventure starts with an open gate.</p>
      <div className="level-trail" aria-label="Levels">
        {[1, 2, 3, 4, 5].map(id => <button key={id} data-testid={`level-option-${id}`} className={`level-option ${id === 1 ? 'available' : ''}`} disabled={id !== 1} onClick={play}>
          <span className="level-disc"><span>{id}</span><span className="level-symbol" aria-hidden="true">{id === 1 ? (progress.completedLevels.includes(1) ? '✓' : '▶') : '⌑'}</span></span>
          <strong>{id === 1 ? (progress.completedLevels.includes(1) ? 'Completed' : levels.find(level => level.id === 1)?.name || 'The Open Gate') : 'Locked'}</strong>
          <small>{id === 1 ? (progress.completedLevels.includes(1) ? 'Play again' : 'Ready to play') : 'Unavailable in this version'}</small>
        </button>)}
      </div>
      <button className="play-level" onClick={play}>Play Level 1 <span aria-hidden="true">→</span></button>
      <button className="secondary" onClick={home}>Back to menu</button>
      <p className="availability">Levels 2–5 are coming later.</p>
      <Robin className="chooser-robin" />
    </main>}
    {inGame && <LevelOne key={attempt} onStarted={started} onCompleted={completed} onReplay={() => setAttempt(n => n + 1)} />}
    {!menu && !chooser && !inGame && <main className="unavailable"><Castle /><h2>This gate isn’t open yet.</h2><p>Only Level 1 is playable in this version.</p><button onClick={home}>Back to menu</button></main>}
    {!inGame && <footer>A LITTLE ADVENTURE IN AI SECURITY <span aria-hidden="true">·</span> LEVEL 1</footer>}
    {resetOpen && <ResetDialog cancel={() => setResetOpen(false)} confirm={() => { setWarning(clearProgress()); progressRef.current = freshProgress(); setProgress(progressRef.current); setResetOpen(false); home(); }} />}
  </div>;
}
