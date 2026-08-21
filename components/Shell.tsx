'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cockpit } from './Cockpit';
import { Explorer } from './Explorer';
import { OntologyGraph } from './OntologyGraph';
import { ChatWorkspace } from './ChatWorkspace';
import { ResearchWorkspace } from './ResearchWorkspace';
import { OphanimSeal } from './OphanimSeal';

export type View = 'cockpit' | 'explorer' | 'ontology' | 'ask' | 'research';

type AuthState = {
  user: null | { username: string; name?: string; avatarUrl?: string; admin?: boolean; groups?: string[] };
  profile?: null | { trustLevel?: number; postCount?: number; topicCount?: number; likesReceived?: number; daysVisited?: number };
  configured: boolean;
};

const routes: Array<{ id: View; label: string; href: string; mark: string }> = [
  { id: 'cockpit', label: 'Cockpit', href: '/', mark: '⌂' },
  { id: 'explorer', label: 'Explorer', href: '/explorer', mark: '⌕' },
  { id: 'ontology', label: 'Ontology', href: '/ontology', mark: '◇' },
  { id: 'ask', label: 'Ask', href: '/ask', mark: '◉' },
  { id: 'research', label: 'Research', href: '/research', mark: '✦' },
];

const titles: Record<View, string> = {
  cockpit: 'Research Cockpit',
  explorer: 'Hub + Wiki Explorer',
  ontology: 'Ontology Schema Navigator',
  ask: 'Grounded Research Chat',
  research: 'Research Deployment',
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

  function navigate(view: View) {
    const route = routes.find((item) => item.id === view);
    if (route) router.push(route.href);
  }

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
    } else if (action === 'wiki' || action === 'hub' || action === 'search' || action === 'find') {
      sessionStorage.setItem('bitcoreos-search-seed', value || action);
      router.push('/explorer');
    } else if (action === 'ontology' || action === 'graph') {
      router.push('/ontology');
    } else if (action === 'home' || action === 'cockpit') {
      router.push('/');
    } else {
      sessionStorage.setItem('bitcoreos-search-seed', raw);
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
          <div className="os-brand"><span className="brand-seal">◎</span><b>BITCOREOS-95</b><span className="title-divider">//</span><span>{titles[initialView]}</span></div>
          <div className="window-caps" aria-hidden="true"><i>_</i><i>□</i><i>×</i></div>
        </header>

        <div className="os-tabstrip" role="navigation" aria-label="Primary cockpit navigation">
          {routes.map((route) => (
            <button key={route.id} data-active={initialView === route.id} onClick={() => navigate(route.id)}>
              <span>{route.mark}</span>{route.label}
            </button>
          ))}
          <div className="os-tab-spacer" />
          <button className="command-trigger" onClick={() => setCommandOpen(true)}>⌘ Command <kbd>Ctrl K</kbd></button>
          {auth.user ? (
            <div className="identity-cluster">
              <a href={`https://hub.bitwiki.org/u/${encodeURIComponent(auth.user.username)}`} target="_blank" rel="noreferrer" className="identity-button">@{auth.user.username}</a>
              <button onClick={logout}>Sign out</button>
            </div>
          ) : auth.configured ? (
            <a className="identity-button" href="/api/auth/login">Sign in with BIThub</a>
          ) : (
            <span className="identity-off" title="Set DISCOURSE_SSO_SECRET and SESSION_SECRET on Vercel to enable BIThub SSO">Guest</span>
          )}
        </div>

        <div className="os-contextbar">
          <div className="breadcrumb"><span>BIT Ecosystem</span><b>›</b><span>{titles[initialView]}</span></div>
          <div className="context-actions">
            {auth.user && auth.profile && <span className="profile-signal">TL{auth.profile.trustLevel ?? '—'} · {auth.profile.postCount ?? '—'} posts</span>}
            <button onClick={() => { sessionStorage.setItem('bitcoreos-search-seed', ''); router.push('/explorer'); }}>⌕ Find</button>
            <a href="https://hub.bitwiki.org" target="_blank" rel="noreferrer">BIThub ↗</a>
            <a href="https://bitwiki.org" target="_blank" rel="noreferrer">BITwiki ↗</a>
          </div>
        </div>

        <div className="os-content">
          {initialView === 'cockpit' && <Cockpit />}
          {initialView === 'explorer' && <Explorer />}
          {initialView === 'ontology' && <OntologyGraph />}
          {initialView === 'ask' && <ChatWorkspace />}
          {initialView === 'research' && <ResearchWorkspace />}
        </div>

        <footer className="os-statusbar">
          <span><i className="status-lamp" /> BIThub + BITwiki public layer</span>
          <span>{auth.user ? `session: @${auth.user.username}` : 'session: guest'}</span>
          <span>main · research cockpit</span>
        </footer>
      </section>

      {commandOpen && (
        <div className="command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCommandOpen(false); }}>
          <form className="command-palette win-panel raised" onSubmit={runCommand}>
            <div className="mini-title">COMMAND PALETTE // NOT A SEPARATE TERMINAL</div>
            <div className="command-line sunken"><span>BIT&gt;</span><input autoFocus value={command} onChange={(event) => setCommand(event.target.value)} placeholder="search carbon sink · ask what is a CORE · research Kordylewski plasma" /></div>
            <div className="command-help"><span>search &lt;query&gt;</span><span>ask &lt;question&gt;</span><span>research &lt;request&gt;</span><span>ontology</span></div>
          </form>
        </div>
      )}

      <OphanimSeal />
    </main>
  );
}
