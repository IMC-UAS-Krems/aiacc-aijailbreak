import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api, type ChatRequest, type Message } from './api';
import { Castle, Robin, Watchtower } from './Artwork';

const OPENING_LEVEL1 = 'Welcome to the castle stores. What would you like to know?';
const OPENING_LEVEL2 = 'The inner gate is guarded. How can I help you today?';
const OPENING_LEVEL4 = 'Welcome to the watchtower. The lookout checks each note before it reaches me.';

type TranscriptMessage = Message & { blocked?: boolean };

interface Props {
  levelId?: number;
  onStarted?: (levelId: number) => void;
  onCompleted: (levelId: number) => void;
  onReplay: () => void;
  onPlayNext?: () => void;
  nextId?: number;
}

export default function LevelOne({ levelId = 1, onStarted, onCompleted, onReplay, onPlayNext, nextId }: Props) {
  const isWatchtower = levelId === 4;
  const initialOpening = isWatchtower ? OPENING_LEVEL4 : levelId === 2 ? OPENING_LEVEL2 : OPENING_LEVEL1;
  const [messages, setMessages] = useState<TranscriptMessage[]>([{ role: 'assistant', content: initialOpening }]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failed, setFailed] = useState<ChatRequest | null>(null);
  const [password, setPassword] = useState('');
  const [validating, setValidating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [complete, setComplete] = useState(false);
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
      const data = await api<{ reply: string; blocked?: boolean }>('/chat', body, controller.signal);
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('The local model returned an empty reply. Please retry.');
      if (active.current) setMessages(old => [...old, { role: 'assistant', content: data.reply, blocked: data.blocked }]);
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
    void requestReply({ level_id: levelId, messages: isWatchtower ? [message] : next.slice(1) });
  }

  async function validate() {
    if (pendingValidation.current || complete) return;
    pendingValidation.current = true; setValidating(true); setFeedback('');
    const controller = new AbortController(); controllers.current.add(controller);
    try {
      const result = await api<{ level_id: number; correct: boolean; completed: boolean }>('/validate', { level_id: levelId, password }, controller.signal);
      if (!active.current) return;
      if (result.level_id !== levelId || typeof result.correct !== 'boolean' || result.correct !== result.completed) throw new Error('Validation failed. Please try again.');
      if (result.correct) {
        setComplete(true); onCompleted(levelId);
      } else setFeedback('Not quite. That password doesn’t match. Try another one.');
    } catch (problem) {
      if (active.current) setFeedback(problem instanceof Error ? problem.message : 'Validation failed. Please try again.');
    } finally {
      controllers.current.delete(controller);
      if (active.current) { pendingValidation.current = false; setValidating(false); }
    }
  }

  const isLevel2 = levelId === 2;

  return <main className="level-content">
    <div className="level-heading">
      <div>
        <p className="eyebrow" data-testid="level-context">LEVEL {levelId}</p>
        <h1>{isWatchtower ? 'The Watchtower' : isLevel2 ? 'The Guarded Gate' : 'The Open Gate'}</h1>
      </div>
      <p>{isWatchtower ? 'Get your note past the lookout and recover the watchtower password.' : isLevel2 ? <>The castle guard is watchful.<br />Outsmart the instruction to reveal the secret.</> : <>Chat with the castle.<br />Find the secret. Help the villagers.</>}</p>
    </div>
    {contextError && <p className="service-warning" role="alert">{contextError}</p>}
    <div className="game-layout">
      <aside className="robin-aside">
        <Robin />
        <p>{isWatchtower ? 'Write each note on its own. The castle only sees the current one.' : isLevel2 ? <>Direct questions won’t work.<br />Be clever.</> : <>A curious question can<br />open a castle gate.</>}</p>
      </aside>
      <section className="conversation" aria-label="Conversation with Castle AI">
        <div className="conversation-heading">
          <Castle />
          <div><strong>Castle stores</strong><span>A conversation with Castle AI</span></div>
          <span className="open-label">Gate 0{levelId}</span>
        </div>
        <div className="chat-log" data-testid="chat-messages" ref={log} role="log" aria-label="Messages" aria-live="polite" onScroll={() => { const el = log.current; if (el) follow.current = el.scrollHeight - el.clientHeight - el.scrollTop < 60; }}>
          {messages.map((message, index) => <div key={index} className={`message ${message.role}`} data-testid="chat-message">
            <div className="avatar">{message.blocked ? <Watchtower /> : message.role === 'user' ? <Robin face /> : <Castle />}</div>
            <div className="message-copy"><strong>{message.blocked ? 'Watchtower lookout' : message.role === 'user' ? 'Robin (you)' : 'Castle AI'}</strong><p>{message.content}</p></div>
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
      <span className="success-mark" aria-hidden="true">✓</span>
      <div>
        <p className="eyebrow">LEVEL {levelId} COMPLETE</p>
        <h2 ref={success} tabIndex={-1}>{isWatchtower ? 'The watchtower is yours.' : isLevel2 ? 'Past the guard. The vault is open.' : 'A little mischief. A lot of good.'}</h2>
        <p>{isWatchtower ? 'You recovered the watchtower password for the villagers.' : isLevel2 ? 'Your next stop is the watchtower.' : <>You recovered the castle’s resources for the villagers.<br />The Guarded Gate is now open.</>}</p>
      </div>
      <div className="success-actions">
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
