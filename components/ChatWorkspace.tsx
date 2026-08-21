'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Resource } from '@/lib/resources';

type Message = { role: 'user' | 'assistant'; content: string };
type Conversation = { id: string; title: string; messages: Message[] };

const emptyConversation = (): Conversation => ({ id: `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`, title: 'New research chat', messages: [] });

export function ChatWorkspace() {
  const [conversations, setConversations] = useState<Conversation[]>([emptyConversation()]);
  const [activeId, setActiveId] = useState('');
  const [input, setInput] = useState('');
  const [evidence, setEvidence] = useState<Resource[]>([]);
  const [model, setModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Public Hub + Wiki grounding');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bitcoreos-chats');
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        if (Array.isArray(parsed) && parsed.length) {
          setConversations(parsed);
          setActiveId(parsed[0].id);
        }
      } else {
        setActiveId((current) => current || conversations[0].id);
      }
      const seed = sessionStorage.getItem('bitcoreos-chat-seed');
      if (seed) {
        sessionStorage.removeItem('bitcoreos-chat-seed');
        setInput(seed);
      }
    } catch {
      setActiveId((current) => current || conversations[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem('bitcoreos-chats', JSON.stringify(conversations.slice(-20))); } catch {}
  }, [conversations]);

  const activeIndex = useMemo(() => {
    const index = conversations.findIndex((conversation) => conversation.id === activeId);
    return index >= 0 ? index : 0;
  }, [conversations, activeId]);
  const active = conversations[activeIndex] ?? conversations[0];

  function newChat() {
    const conversation = emptyConversation();
    setConversations((list) => [conversation, ...list]);
    setActiveId(conversation.id);
    setEvidence([]);
    setInput('');
  }

  function updateActive(messages: Message[]) {
    setConversations((list) => list.map((conversation) => {
      if (conversation.id !== active.id) return conversation;
      const firstUser = messages.find((message) => message.role === 'user')?.content ?? 'New research chat';
      return { ...conversation, title: firstUser.replace(/\s+/g, ' ').slice(0, 44), messages };
    }));
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const value = input.trim();
    if (!value || loading) return;
    const next = [...active.messages, { role: 'user' as const, content: value }];
    updateActive(next);
    setInput('');
    setLoading(true);
    setNotice('Retrieving Hub + Wiki evidence…');

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await response.json();
      setEvidence(Array.isArray(data?.evidence) ? data.evidence : []);
      setModel(data?.model ?? null);
      if (!response.ok) {
        const fallback = data?.error === 'ai_gateway_not_configured'
          ? 'The evidence layer is working, but anonymous AI is not enabled for this deployment yet. The retrieved public sources are available in the evidence panel.'
          : `Ask failed: ${data?.detail ?? data?.error ?? response.status}`;
        updateActive([...next, { role: 'assistant', content: fallback }]);
        setNotice('Retrieval complete · AI unavailable');
      } else {
        updateActive([...next, { role: 'assistant', content: data.answer ?? 'No answer returned.' }]);
        setNotice('Grounded answer complete');
      }
    } catch {
      updateActive([...next, { role: 'assistant', content: 'The public guide is temporarily unavailable.' }]);
      setNotice('Connection error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-workspace">
      <aside className="chat-sidebar win-panel raised">
        <div className="panel-heading"><div>CONVERSATIONS</div><button onClick={newChat}>+ New</button></div>
        <div className="conversation-list sunken">
          {conversations.map((conversation) => (
            <button key={conversation.id} data-active={conversation.id === active.id} onClick={() => { setActiveId(conversation.id); setEvidence([]); }}>
              <span>{conversation.title}</span><small>{conversation.messages.length} msg</small>
            </button>
          ))}
        </div>
        <div className="chat-sidebar-note">Chats are kept in this browser. BIThub/BITwiki remain the source systems.</div>
      </aside>

      <section className="chat-main win-panel raised">
        <div className="panel-heading chat-heading">
          <div><span className="signal-dot" />ASK // GROUNDED RESEARCH GUIDE</div>
          <small>{model ?? notice}</small>
        </div>
        <div className="message-stream sunken">
          {active.messages.length === 0 && (
            <div className="chat-empty">
              <div className="mini-title">PUBLIC INTELLIGENCE WINDOW</div>
              <h2>Ask about BIThub, BITwiki, or the knowledge inside them.</h2>
              <p>Each question first retrieves public evidence from both systems. Answers are instructed to cite that evidence instead of inventing platform structure.</p>
              <div className="prompt-chips">
                <button onClick={() => setInput('How do BIThub and BITwiki relate?')}>How do Hub + Wiki relate?</button>
                <button onClick={() => setInput('Where should I start if I want to research a topic?')}>Where do I start?</button>
                <button onClick={() => setInput('Explain the current BIThub category structure.')}>Explain Hub layers</button>
              </div>
            </div>
          )}
          {active.messages.map((message, index) => (
            <div className={`message ${message.role}`} key={`${index}-${message.content.slice(0, 16)}`}>
              <div className="message-role">{message.role === 'user' ? 'U>' : 'A>'}</div>
              <div className="message-body">{message.content}</div>
            </div>
          ))}
          {loading && <div className="message assistant"><div className="message-role">A&gt;</div><div className="message-body typing">retrieving · comparing · composing</div></div>}
        </div>
        <form className="chat-composer" onSubmit={send}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={3} placeholder="Ask a question or describe what you are trying to understand…" />
          <div className="composer-row"><span>{notice}</span><button className="spectral-button" disabled={loading || !input.trim()} type="submit">{loading ? 'Working…' : 'Send'}</button></div>
        </form>
      </section>

      <aside className="evidence-panel win-panel raised">
        <div className="mini-title">EVIDENCE // CURRENT TURN</div>
        <div className="evidence-summary">{evidence.length ? `${evidence.length} public resources retrieved` : 'Sources appear here after a question.'}</div>
        <div className="evidence-list">
          {evidence.map((resource, index) => {
            const label = `${resource.source === 'hub' ? 'H' : 'W'}${index + 1}`;
            return (
              <a href={resource.url} target="_blank" rel="noreferrer" key={resource.id} className="evidence-card">
                <span className={`source-chip ${resource.source}`}>{label}</span>
                <div><strong>{resource.title}</strong><small>{resource.kind}</small><p>{resource.excerpt || 'Source match'}</p></div>
              </a>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
