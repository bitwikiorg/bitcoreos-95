'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Resource } from '@/lib/resources';
import type { ContextCapsule } from '@/lib/context';
import type { ConversationKind, ConversationMessage, ConversationSummary } from '@/lib/conversations';
import { contextLabel } from '@/lib/context';

type Message = { role: 'user' | 'assistant'; content: string };
type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt?: number;
  context: ContextCapsule;
};
type ConversationIndex = {
  viewer: string | null;
  delegated: boolean;
  scopes?: string[];
  conversations: ConversationSummary[];
};
type Filter = 'all' | 'mine' | 'local' | 'pm' | 'chat' | 'runs';

function localConversationContext(id: string, model?: string | null): ContextCapsule {
  const modelId = model ? `model:${model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'model:ask-runtime';
  return {
    id: `local-ai:${id}`,
    kind: 'Local Ask conversation',
    origin: {
      plane: 'local',
      substrate: 'browser-local conversation',
      canonicalRef: `local:ask:${id}`,
    },
    identity: {
      viewer: 'current-browser-user',
      executor: { kind: 'model', id: modelId, label: model || 'Ask runtime' },
    },
    authority: { visibility: 'local', mode: 'ai-invoke' },
    state: { execution: 'idle' },
    capabilities: ['read', 'ask', 'research', 'persist-local'],
    provenance: [],
    metadata: { storage: 'browser-local' },
  };
}

const emptyConversation = (): Conversation => {
  const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    title: 'New Ask',
    messages: [],
    updatedAt: Date.now(),
    context: localConversationContext(id),
  };
};

function normalizeLocalConversation(value: any): Conversation | null {
  if (!value || typeof value !== 'object') return null;
  const id = typeof value.id === 'string' && value.id ? value.id : `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const messages = Array.isArray(value.messages)
    ? value.messages.filter((message: any) => message && (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
    : [];
  return {
    id,
    title: typeof value.title === 'string' && value.title ? value.title : 'New Ask',
    messages,
    updatedAt: Number(value.updatedAt || Date.now()),
    context: value.context?.origin && value.context?.authority ? value.context as ContextCapsule : localConversationContext(id),
  };
}

function kindLabel(kind: ConversationKind) {
  if (kind === 'construct') return 'CONSTRUCT · PM';
  if (kind === 'pm') return 'PM';
  if (kind === 'chat-dm') return 'CHAT · DM';
  if (kind === 'chat-channel') return 'CHAT';
  if (kind === 'chat-thread') return 'CHAT · THREAD';
  if (kind === 'core-run') return 'CORE';
  if (kind === 'node-run') return 'NODE';
  if (kind === 'mas') return 'MAS';
  return kind.toUpperCase();
}

function bucket(kind: ConversationKind): Exclude<Filter, 'mine' | 'local'> {
  if (kind === 'pm' || kind === 'construct') return 'pm';
  if (kind.startsWith('chat-')) return 'chat';
  if (kind === 'core-run' || kind === 'node-run' || kind === 'mas') return 'runs';
  return 'all';
}

function filterLabel(value: Filter) {
  if (value === 'pm') return 'PM + Bots';
  if (value === 'runs') return 'Runs';
  return value[0].toUpperCase() + value.slice(1);
}

function compactTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ChatWorkspace() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([emptyConversation()]);
  const [activeId, setActiveId] = useState('');
  const [remoteIndex, setRemoteIndex] = useState<ConversationIndex>({ viewer: null, delegated: false, conversations: [] });
  const [activeRemote, setActiveRemote] = useState<ConversationSummary | null>(null);
  const [remoteMessages, setRemoteMessages] = useState<ConversationMessage[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [input, setInput] = useState('');
  const [evidence, setEvidence] = useState<Resource[]>([]);
  const [model, setModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Grounded in the ecosystem');

  async function loadRemoteIndex() {
    try {
      const response = await fetch('/api/conversations', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setRemoteIndex({
        viewer: data?.viewer || null,
        delegated: Boolean(data?.delegated),
        scopes: Array.isArray(data?.scopes) ? data.scopes : [],
        conversations: Array.isArray(data?.conversations) ? data.conversations : [],
      });
    } catch {}
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bitcoreos-chats');
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalized = Array.isArray(parsed)
          ? parsed.map(normalizeLocalConversation).filter((item): item is Conversation => Boolean(item))
          : [];
        if (normalized.length) {
          setConversations(normalized);
          setActiveId(normalized[0].id);
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
    void loadRemoteIndex();
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

  const visibleLocal = filter === 'all' || filter === 'mine' || filter === 'local' ? conversations : [];
  const visibleRemote = remoteIndex.conversations.filter((conversation) => {
    if (filter === 'all') return true;
    if (filter === 'local') return false;
    if (filter === 'mine') {
      const viewer = remoteIndex.viewer;
      if (!viewer) return false;
      if (conversation.context.identity?.viewer === viewer) return true;
      if (conversation.context.identity?.author === viewer) return true;
      return Boolean(conversation.context.identity?.participants?.includes(viewer));
    }
    return bucket(conversation.kind) === filter;
  });

  function newChat() {
    const conversation = emptyConversation();
    setConversations((list) => [conversation, ...list]);
    setActiveId(conversation.id);
    setActiveRemote(null);
    setRemoteMessages([]);
    setEvidence([]);
    setInput('');
  }

  function selectLocal(id: string) {
    setActiveId(id);
    setActiveRemote(null);
    setRemoteMessages([]);
    setEvidence([]);
  }

  async function selectRemote(conversation: ConversationSummary) {
    setActiveRemote(conversation);
    setEvidence([]);
    setRemoteMessages([]);
    setRemoteLoading(true);
    try {
      const id = conversation.topicId || conversation.threadId || conversation.channelId;
      if (!id) return;
      const params = new URLSearchParams({ kind: conversation.kind, id: String(id) });
      if (conversation.channelId && conversation.kind === 'chat-thread') params.set('channelId', String(conversation.channelId));
      const response = await fetch(`/api/conversations/read?${params.toString()}`, { credentials: 'include', cache: 'no-store' });
      const data = await response.json();
      if (response.ok) setRemoteMessages(Array.isArray(data?.messages) ? data.messages : []);
    } finally {
      setRemoteLoading(false);
    }
  }

  function updateActive(messages: Message[]) {
    setConversations((list) => list.map((conversation) => {
      if (conversation.id !== active.id) return conversation;
      const firstUser = messages.find((message) => message.role === 'user')?.content ?? 'New Ask';
      return {
        ...conversation,
        title: firstUser.replace(/\s+/g, ' ').slice(0, 44),
        messages,
        updatedAt: Date.now(),
      };
    }));
  }

  function updateActiveContext(resources: Resource[], modelName: string | null, execution: string) {
    setConversations((list) => list.map((conversation) => {
      if (conversation.id !== active.id) return conversation;
      const nextContext = localConversationContext(conversation.id, modelName);
      return {
        ...conversation,
        context: {
          ...nextContext,
          state: { ...nextContext.state, execution },
          provenance: resources.slice(0, 16).map((resource) => ({
            relation: 'references' as const,
            targetId: resource.context?.id || resource.id,
            targetKind: resource.context?.kind || resource.kind,
            label: resource.title,
          })),
          metadata: {
            ...nextContext.metadata,
            evidenceCount: resources.length,
            lastUpdatedAt: new Date().toISOString(),
          },
        },
      };
    }));
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (activeRemote) return;
    const value = input.trim();
    if (!value || loading) return;
    const next = [...active.messages, { role: 'user' as const, content: value }];
    updateActive(next);
    setInput('');
    setLoading(true);
    setNotice('Reading relevant knowledge…');

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await response.json();
      const turnEvidence = Array.isArray(data?.evidence) ? data.evidence as Resource[] : [];
      const modelName = typeof data?.model === 'string' ? data.model : null;
      setEvidence(turnEvidence);
      setModel(modelName);
      updateActiveContext(turnEvidence, modelName, response.ok ? 'ready' : 'partial');
      if (!response.ok) {
        const fallback = data?.error === 'ai_gateway_not_configured'
          ? 'Relevant sources were found, but this conversation runtime is unavailable right now.'
          : 'This conversation could not complete.';
        updateActive([...next, { role: 'assistant', content: fallback }]);
        setNotice('Sources ready');
      } else {
        updateActive([...next, { role: 'assistant', content: data.answer ?? 'No answer returned.' }]);
        setNotice('Ready');
      }
    } catch {
      updateActiveContext([], model, 'interrupted');
      updateActive([...next, { role: 'assistant', content: 'This conversation is temporarily unavailable.' }]);
      setNotice('Connection interrupted');
    } finally {
      setLoading(false);
    }
  }

  function researchRemote() {
    if (!activeRemote) return;
    sessionStorage.setItem('bitcoreos-context-object', JSON.stringify(activeRemote.context));
    sessionStorage.setItem('bitcoreos-research-seed', `Research and distill this ${activeRemote.context.kind}: ${activeRemote.title}`);
    router.push('/research');
  }

  function researchLocal() {
    if (!active.messages.length) return;
    const transcript = active.messages
      .map((message) => `${message.role === 'user' ? 'USER' : 'ASSISTANT'}:\n${message.content}`)
      .join('\n\n')
      .slice(-6200);
    sessionStorage.setItem('bitcoreos-context-object', JSON.stringify(active.context));
    sessionStorage.setItem('bitcoreos-research-seed', `Research and distill this local Ask conversation: ${active.title}\n\n${transcript}`);
    router.push('/research');
  }

  const remoteContext: ContextCapsule | null = activeRemote?.context || null;

  return (
    <div className="chat-workspace unified-ask">
      <aside className="chat-sidebar win-panel raised">
        <div className="panel-heading"><div>ASK HISTORY</div><button onClick={newChat}>+ New</button></div>
        <div className="conversation-filters" aria-label="Conversation filters">
          {(['all', 'mine', 'local', 'pm', 'chat', 'runs'] as Filter[]).map((value) => (
            <button key={value} data-active={filter === value} onClick={() => setFilter(value)}>{filterLabel(value)}</button>
          ))}
        </div>
        <div className="conversation-list sunken unified-conversation-list">
          {visibleLocal.map((conversation) => (
            <button key={conversation.id} data-active={!activeRemote && conversation.id === active.id} onClick={() => selectLocal(conversation.id)}>
              <div className="conversation-row-head"><span className="conversation-kind local">LOCAL</span><small>{conversation.messages.length} msg</small></div>
              <strong>{conversation.title}</strong>
            </button>
          ))}
          {visibleRemote.map((conversation) => (
            <button key={conversation.id} data-active={activeRemote?.id === conversation.id} onClick={() => void selectRemote(conversation)}>
              <div className="conversation-row-head">
                <span className={`conversation-kind ${conversation.kind}`}>{kindLabel(conversation.kind)}</span>
                <small>{conversation.unread ? '● ' : ''}{compactTime(conversation.lastActivity)}</small>
              </div>
              <strong>{conversation.title}</strong>
              {conversation.excerpt && <span className="conversation-excerpt">{conversation.excerpt}</span>}
            </button>
          ))}
          {!visibleLocal.length && !visibleRemote.length && <div className="conversation-empty">No conversations in this view.</div>}
        </div>
        <div className="chat-sidebar-note conversation-access">
          {!remoteIndex.viewer && <><span>Local Ask + public runs are ready.</span><a href="/api/auth/login">Sign in for private conversations</a></>}
          {remoteIndex.viewer && !remoteIndex.delegated && <><span>@{remoteIndex.viewer}</span><a href="/api/auth/user-key/start?return=/ask">Add private conversations</a></>}
          {remoteIndex.viewer && remoteIndex.delegated && <><span>@{remoteIndex.viewer}</span><b>Private state connected</b></>}
        </div>
      </aside>

      <section className="chat-main win-panel raised">
        <div className="panel-heading chat-heading">
          <div><span className="signal-dot" />{activeRemote ? activeRemote.title : 'ASK'}</div>
          <small>{activeRemote ? contextLabel(activeRemote.context) : contextLabel(active.context)}</small>
        </div>
        <div className="message-stream sunken">
          {!activeRemote && active.messages.length === 0 && (
            <div className="chat-empty">
              <div className="mini-title">START OR CONTINUE</div>
              <h2>Ask, open a conversation, or bring any object into context.</h2>
              <p>Local Ask, public CORE runs, PM-backed Constructs, private messages, and native Chat share one interaction surface while keeping their actual identity, visibility, transport, and provenance.</p>
              <div className="prompt-chips">
                <button onClick={() => setInput('Map the relationships between current discussions, agents, and durable knowledge.')}>Map the ecosystem</button>
                <button onClick={() => setInput('What knowledge should we research next?')}>Find knowledge gaps</button>
                <button onClick={() => setInput('Show me how current work can become reusable durable knowledge.')}>Trace provenance</button>
              </div>
            </div>
          )}
          {!activeRemote && active.messages.map((message, index) => (
            <div className={`message ${message.role}`} key={`${index}-${message.content.slice(0, 16)}`}>
              <div className="message-role">{message.role === 'user' ? 'U>' : 'A>'}</div>
              <div className="message-body">{message.content}</div>
            </div>
          ))}
          {!activeRemote && loading && <div className="message assistant"><div className="message-role">A&gt;</div><div className="message-body typing">reading · comparing · composing</div></div>}

          {activeRemote && remoteLoading && <div className="conversation-loading">Reading conversation…</div>}
          {activeRemote && !remoteLoading && remoteMessages.map((message) => {
            const mine = Boolean(remoteIndex.viewer && message.username === remoteIndex.viewer);
            return (
              <div className={`message ${mine ? 'user' : 'assistant'} remote-message`} key={message.id}>
                <div className="message-role">@{message.username}&gt;</div>
                <div className="message-body"><div className="remote-message-meta">{message.displayName || message.username}{message.createdAt ? ` · ${new Date(message.createdAt).toLocaleString()}` : ''}</div>{message.text}</div>
              </div>
            );
          })}
          {activeRemote && !remoteLoading && !remoteMessages.length && <div className="conversation-loading">No readable messages returned.</div>}
        </div>

        {!activeRemote ? (
          <form className="chat-composer" onSubmit={send}>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={3} placeholder="Ask anything, or describe what you want to understand…" />
            <div className="composer-row">
              <span>{model ?? notice}</span>
              <div className="composer-actions">
                <button type="button" onClick={researchLocal} disabled={!active.messages.length}>Research conversation</button>
                <button className="spectral-button" disabled={loading || !input.trim()} type="submit">{loading ? 'Working…' : 'Send'}</button>
              </div>
            </div>
          </form>
        ) : (
          <div className="remote-conversation-actions">
            <span>{activeRemote.context.kind} · {activeRemote.context.authority.visibility} · source preserved</span>
            <div>
              <button onClick={researchRemote}>Research this</button>
              {activeRemote.url && <a href={activeRemote.url} target="_blank" rel="noreferrer">Open source ↗</a>}
            </div>
          </div>
        )}
      </section>

      <aside className="evidence-panel win-panel raised">
        {!activeRemote ? (
          <>
            <div className="mini-title">LOCAL CONTEXT // {active.context.authority.visibility.toUpperCase()}</div>
            <div className="evidence-summary">{evidence.length ? `${evidence.length} resources retrieved` : 'Sources appear here when this conversation retrieves them.'}</div>
            <div className="evidence-list">
              {evidence.map((resource, index) => {
                const label = `${resource.source === 'hub' ? 'H' : 'W'}${index + 1}`;
                return (
                  <a href={resource.url} target="_blank" rel="noreferrer" key={resource.id} className="evidence-card">
                    <span className={`source-chip ${resource.source}`}>{label}</span>
                    <div><strong>{resource.title}</strong><small>{resource.context?.kind || resource.kind}</small><p>{resource.excerpt || 'Source match'}</p></div>
                  </a>
                );
              })}
            </div>
            <details className="context-details local-context-details">
              <summary>Conversation identity + provenance</summary>
              <ContextRow label="Origin" value={active.context.origin.plane} />
              <ContextRow label="Transport" value={active.context.origin.substrate} />
              <ContextRow label="Visibility" value={active.context.authority.visibility} />
              {active.context.identity?.executor?.label && <ContextRow label="Executor" value={active.context.identity.executor.label} />}
              <div className="context-capabilities">{active.context.capabilities.map((capability) => <span key={capability}>{capability}</span>)}</div>
              {active.context.provenance?.map((relation, index) => <div className="context-relation" key={`${relation.relation}-${index}`}>{relation.relation} → {relation.label || relation.targetId}</div>)}
            </details>
          </>
        ) : (
          <div className="conversation-context-panel">
            <div className="mini-title">CONTEXT</div>
            <h3>{remoteContext?.kind}</h3>
            <ContextRow label="Origin" value={remoteContext?.origin.plane || ''} />
            <ContextRow label="Transport" value={remoteContext?.origin.substrate || ''} />
            <ContextRow label="Visibility" value={remoteContext?.authority.visibility || ''} />
            {remoteContext?.identity?.executor?.label && <ContextRow label="Identity" value={remoteContext.identity.executor.label} />}
            {remoteContext?.identity?.participants?.length ? <ContextRow label="Participants" value={remoteContext.identity.participants.join(', ')} /> : null}
            <details className="context-details">
              <summary>Capabilities + provenance</summary>
              <div className="context-capabilities">{remoteContext?.capabilities.map((capability) => <span key={capability}>{capability}</span>)}</div>
              {remoteContext?.provenance?.map((relation, index) => <div className="context-relation" key={`${relation.relation}-${index}`}>{relation.relation} → {relation.label || relation.targetId}</div>)}
            </details>
          </div>
        )}
      </aside>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return <div className="context-row"><small>{label}</small><strong>{value}</strong></div>;
}