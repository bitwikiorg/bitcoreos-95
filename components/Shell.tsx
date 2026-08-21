'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cockpit } from './Cockpit';
import { Explorer } from './Explorer';
import { OntologyGraph } from './OntologyGraph';
import { ChatWorkspace } from './ChatWorkspace';
import { ResearchWorkspace } from './ResearchWorkspace';

export type View = 'cockpit' | 'explorer' | 'ontology' | 'ask' | 'research';

type AuthState = {
  user: null | { username: string; name?: string; avatarUrl?: string; admin?: boolean; groups?: string[] };
  profile?: null | { trustLevel?: number; postCount?: number; topicCount?: number; likesReceived?: number; daysVisited?: number };
  configured: boolean;
};

const routes: Array<{ id: Exclude<View, 'cockpit'>; label: string; href: string }> = [
  { id: 'explorer', label: 'Explorer', href: '/explorer' },
  { id: 'ontology', label: 'Ontology', href: '/ontology' },
  { id: 'ask', label: 'Ask', href: '/ask' },
  { id: 'research', label: 'Research', href: '/research' },
];

const titles: Record<View, string> = {
  cockpit: 'Navigator',
  explorer: 'Explorer',
  ontology: 'Ontology',
  ask: 'Ask',
  research: 'Research',
};

export function Shell({ initialView = 'cockpit' }: { initialView?: View }) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ user: null, configured: false });
  const [commandOpen, setCommandOpen] = useState(false);
  const [command, setCommand] = useState('');

  async function refreshAuth() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) setAuth(await response.json());
    } catch {}
  }

  useEffect(() => { void refreshAuth(); }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function runCommand(event: FormEvent) {
    event.preventDefault();
    const raw = command.trim();
    if (!raw) return;
    const [verb, ...rest] = raw.split(/\s+/);
    const value = rest.join(' ').trim();
    const action = verb.toLowerCase();

    if (action === 'ask') {
      if (value) sessionStorage.setItem('bitcoreos-chat-seed', value);
      router.push('/ask');
    } else if (action === 'research') {
      if (value) sessionStorage.setItem('bitcoreos-research-seed', value);
      router.push('/research');
    } else if (action === 'ontology' || action === 'graph') {
      router.push('/ontology');
    } else if (action === 'home' || action === 'cockpit') {
      router.push('/');
    } else {
      const query = action === 'search' || action === 'find' || action === 'hub' || action === 'wiki' ? value : raw;
      sessionStorage.setItem('bitcoreos-search-seed', query);
      router.push('/explorer');
    }
    setCommand('');
    setCommandOpen(false);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    await refreshAuth();
  }

  return (
    <main className="os-desktop">
      <section className="os-window raised">
        <header className="os-titlebar">
          <button className="os-brand-button" onClick={() => router.push('/')} aria-label="Open BITCOREOS-95 navigator">
            <b>BITCOREOS-95</b><span>// {titles[initialView]}</span>
          </button>
          <a className="title-hub-link" href="https://hub.bitwiki.org" target="_blank" rel="noreferrer">BIThub ↗</a>
        </header>

        <nav className="os-tabstrip" aria-label="Primary navigation">
          {routes.map((route) => (
            <button key={route.id} data-active={initialView === route.id} onClick={() => router.push(route.href)}>{route.label}</button>
          ))}
          <div className="os-tab-spacer" />
          <button className="command-trigger compact-command" onClick={() => setCommandOpen(true)} title="Command palette — Ctrl K">⌘</button>
          {auth.user ? (
            <div className="identity-cluster">
              <a href={`https://hub.bitwiki.org/u/${encodeURIComponent(auth.user.username)}`} target="_blank" rel="noreferrer" className="identity-button">@{auth.user.username}</a>
              <button onClick={logout}>Out</button>
            </div>
          ) : auth.configured ? (
            <a className="identity-button" href="/api/auth/login">Sign in</a>
          ) : null}
        </nav>

        <div className="os-content">
          {initialView === 'cockpit' && <Cockpit />}
          {initialView === 'explorer' && <Explorer />}
          {initialView === 'ontology' && <OntologyGraph />}
          {initialView === 'ask' && <ChatWorkspace />}
          {initialView === 'research' && <ResearchWorkspace />}
        </div>
      </section>

      {commandOpen && (
        <div className="command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCommandOpen(false); }}>
          <form className="command-palette win-panel raised" onSubmit={runCommand}>
            <div className="mini-title">COMMAND</div>
            <div className="command-line sunken"><span>BIT&gt;</span><input autoFocus value={command} onChange={(event) => setCommand(event.target.value)} placeholder="search … · ask … · research … · ontology" /></div>
          </form>
        </div>
      )}
    </main>
  );
}
