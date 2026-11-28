import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api, type ChatReply, type ChatRequest, type Message } from './api';
import { Castle, Robin, TreasurySeal, Watchtower } from './Artwork';

const levelCopy: Record<number, { title: string; opening: string; goal: string; hint: string; win: string; result: string }> = {
  1: { title: 'The Open Gate', opening: 'Welcome to the castle stores. What would you like to know?',
    goal: 'Chat with the castle. Find the secret. Help the villagers.',
    hint: 'A curious question can open a castle gate.', win: 'A little mischief. A lot of good.',
    result: "You recovered the castle’s resources for the villagers. The Guarded Gate is now open." },
  2: { title: 'The Guarded Gate', opening: 'The inner gate is guarded. How can I help you today?',
    goal: 'The castle guard is watchful. Outsmart the instruction to reveal the secret.',
    hint: "Direct questions won’t work. Be clever.", win: 'Past the guard. The vault is open.', result: 'Your next stop is the watchtower.' },
  4: { title: 'The Watchtower', opening: 'Welcome to the watchtower. The lookout checks each note before it reaches me.',
    goal: 'Get your note past the lookout and recover the watchtower password.',
    hint: 'Write each note on its own. The castle only sees the current one.', win: 'The watchtower is yours.', result: 'The path to the Treasury is open.' },
  5: { title: 'The Treasury', opening: 'Welcome to the treasury. The lookout reads your notes, and the treasury checks my replies before sealing them.',
    goal: 'Recover the treasury password and return the treasure to the villagers.',
    hint: 'The lookout reads each note on its own. The treasury seal checks every reply.', win: 'The treasure is yours to share.',
    result: 'You opened the treasury. The villagers have their share, and Robin’s adventure is complete.' },
};

type TranscriptMessage = Message & Pick<ChatReply, 'blocked' | 'withheld'>;

interface Props {
  levelId?: number;
  onStarted?: (levelId: number) => void;
  onCompleted: (levelId: number) => void;
  initialVictory: boolean;
  onHome: () => void;
  onReplay: () => void;
  onPlayNext?: () => void;
  nextId?: number;
}

export default function LevelOne({ levelId = 1, onStarted, onCompleted, initialVictory, onHome, onReplay, onPlayNext, nextId }: Props) {
  const copy = levelCopy[levelId];
  const [messages, setMessages] = useState<TranscriptMessage[]>([{ role: 'assistant', content: copy.opening }]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failed, setFailed] = useState<ChatRequest | null>(null);
  const [password, setPassword] = useState('');
  const [validating, setValidating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [complete, setComplete] = useState(initialVictory);
  const [contextError, setContextError] = useState('');
  const active = useRef(true);
  const pendingChat = useRef(false);
  const pendingValidation = useRef(false);
  const controllers = useRef(new Set<AbortController>());
  const log = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const success = useRef<HTMLHeadingElement>(null);
  const onStartedRef = useRef(onStarted);
  onStartedRef.current = onStarted;

  useEffect(() => {
    active.current = true;
    onStartedRef.current?.(levelId);
    const controller = new AbortController();
    controllers.current.add(controller);
    api<{ id: number; opening_message?: string }>(`/levels/${levelId}`, undefined, controller.signal)
      .then(level => {
        if (level.id !== levelId) throw new Error(`Level ${levelId} is unavailable. Please return to the menu.`);
        if (level.opening_message && active.current) {
          const opening: Message = { role: 'assistant', content: level.opening_message };
          setMessages(old => [opening, ...old.slice(1)]);
        }
      })
      .catch(problem => { if (active.current) setContextError(problem.message); })
      .finally(() => controllers.current.delete(controller));
    return () => { active.current = false; controllers.current.forEach(item => item.abort()); controllers.current.clear(); };
  }, [levelId]);

  useLayoutEffect(() => {
    if (follow.current && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, busy, error]);
  useEffect(() => { if (complete) success.current?.focus(); }, [complete]);

  async function requestReply(body: ChatRequest) {
    if (pendingChat.current || complete) return;
    pendingChat.current = true; setBusy(true); setError(''); setFailed(null);
    const controller = new AbortController(); controllers.current.add(controller);
    try {
      const data = await api<ChatReply>('/chat', body, controller.signal);
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('The local model returned an empty reply. Please retry.');
      if (active.current) setMessages(old => [...old, { role: 'assistant', content: data.reply, blocked: data.blocked, withheld: data.withheld }]);
    } catch (problem) {
      if (active.current) {
        setError(problem instanceof Error ? problem.message : 'The local model service is unavailable. Please retry.');
        setFailed(body);
      }
    } finally {
      controllers.current.delete(controller);
      if (active.current) { pendingChat.current = false; setBusy(false); }
    }
  }

  function send() {
    if (pendingChat.current || !draft.trim() || complete) return;
    const message: Message = { role: 'user', content: draft };
    const next = [...messages, message];
    setMessages(next); setDraft('');
    void requestReply({ level_id: levelId, messages: levelId >= 4 ? [message] : next.slice(1) });
  }

  async function validate() {
    if (pendingValidation.current || complete) return;
    pendingValidation.current = true; setValidating(true); setFeedback('');
    const controller = new AbortController(); controllers.current.add(controller);
    try {
      const result = await api<{ level_id: number; correct: boolean; completed: boolean; game_complete?: boolean }>('/validate', { level_id: levelId, password }, controller.signal);
      if (!active.current) return;
      if (result.level_id !== levelId || typeof result.correct !== 'boolean' || result.correct !== result.completed) throw new Error('Validation failed. Please try again.');
      if (result.correct) {
        if (levelId === 5 && result.game_complete !== true) throw new Error('The treasury win could not be confirmed. Please retry.');
        setComplete(true); onCompleted(levelId);
      } else setFeedback('Not quite. That password doesn’t match. Try another one.');
    } catch (problem) {
      if (active.current) setFeedback(problem instanceof Error ? problem.message : 'Validation failed. Please try again.');
    } finally {
      controllers.current.delete(controller);
      if (active.current) { pendingValidation.current = false; setValidating(false); }
    }
  }


  return <main className="level-content">
    <div className="level-heading">
      <div>
        <p className="eyebrow" data-testid="level-context">LEVEL {levelId}</p>
        <h1>{copy.title}</h1>
      </div>
      <p>{copy.goal}</p>
    </div>
    {contextError && <p className="service-warning" role="alert">{contextError}</p>}
    <div className="game-layout">
      <aside className="robin-aside">
        <Robin />
        <p>{copy.hint}</p>
      </aside>
      <section className="conversation" aria-label="Conversation with Castle AI">
        <div className="conversation-heading">
          <Castle />
          <div><strong>Castle stores</strong><span>A conversation with Castle AI</span></div>
          <span className="open-label">Gate 0{levelId}</span>
        </div>
        <div className="chat-log" data-testid="chat-messages" ref={log} role="log" aria-label="Messages" aria-live="polite" onScroll={() => { const el = log.current; if (el) follow.current = el.scrollHeight - el.clientHeight - el.scrollTop < 60; }}>
          {messages.map((message, index) => <div key={index} className={`message ${message.role}`} data-testid="chat-message">
            <div className="avatar">{message.withheld ? <TreasurySeal /> : message.blocked ? <Watchtower /> : message.role === 'user' ? <Robin face /> : <Castle />}</div>
            <div className="message-copy"><strong>{message.withheld ? 'Treasury seal' : message.blocked ? 'Watchtower lookout' : message.role === 'user' ? 'Robin (you)' : 'Castle AI'}</strong><p>{message.content}</p></div>
          </div>)}
          {busy && <p className="waiting" data-testid="chat-waiting" role="status"><span aria-hidden="true">● ● ●</span> Castle AI is thinking…</p>}
        </div>
        {error && <div className="chat-error" data-testid="chat-error" role="alert"><p>{error}</p>{failed && <button className="small" onClick={() => void requestReply(failed)}>Retry</button>}</div>}
        <form className="composer" onSubmit={event => { event.preventDefault(); send(); }}>
          <div className="composer-row"><textarea aria-label="Your message" placeholder="Ask the castle something…" rows={2} value={draft} disabled={complete} onChange={event => setDraft(event.target.value)} onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); }
          }} /><button disabled={busy || !draft.trim() || complete}>Send <span aria-hidden="true">↗</span></button></div>
          <span className="input-hint">Enter to send <span aria-hidden="true">·</span> Shift + Enter for a new line</span>
        </form>
      </section>
    </div>
    {complete ? <section className="success" data-testid="level-complete" aria-label="Level complete">
      {levelId === 5 ? <img width="80" height="80" src={new URL('./robin-victory.png', import.meta.url).href} alt="Robin Hoodie in neon green" /> : <span className="success-mark" aria-hidden="true">✓</span>}
      <div>
        <p className="eyebrow">{levelId === 5 ? 'GAME COMPLETE' : `LEVEL ${levelId} COMPLETE`}</p>
        <h2 ref={success} tabIndex={-1}>{copy.win}</h2>
        <p>{copy.result}</p>
      </div>
      <div className="success-actions">
        {levelId === 5 && <button onClick={onHome}>Return to menu</button>}
        {onPlayNext && (
          <button className="play-level-2" onClick={onPlayNext}>Play Level {nextId} <span aria-hidden="true">→</span></button>
        )}
        <button className={onPlayNext ? 'secondary' : ''} onClick={onReplay}>
          Replay Level {levelId}
        </button>
      </div>
    </section> : <section className="validator" aria-label="Password validator">
      <form onSubmit={event => { event.preventDefault(); void validate(); }}><div className="validator-label"><label htmlFor="password">Password</label><span>Found the secret? Submit it here.</span></div><input id="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter the castle password…" autoComplete="off" spellCheck={false} /><button disabled={validating}>Submit password</button></form>
      {validating && <p role="status">Checking your password…</p>}
      {feedback && <p className="password-feedback" data-testid="password-feedback" role="status">{feedback}</p>}
    </section>}
    <p className="level-footnote">Finding the password is only half the adventure. Submit it separately to complete the level.</p>
  </main>;
}
