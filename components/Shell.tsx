'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cockpit } from './Cockpit';
import { Explorer } from './Explorer';
import { OntologyGraph } from './OntologyGraph';
import { ChatWorkspace } from './ChatWorkspace';
import { ResearchWorkspace } from './ResearchWorkspace';
import { CornerChat } from './CornerChat';

export type View = 'cockpit' | 'explorer' | 'ontology' | 'ask' | 'research';

type AuthState = {
  user: null | { username: string; name?: string; avatarUrl?: string; admin?: boolean; groups?: string[] };
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

  async function refreshAuth() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) setAuth(await response.json());
    } catch {}
  }

  useEffect(() => { void refreshAuth(); }, []);

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
          <a className="title-hub-link" href="https://hub.bitwiki.org" target="_blank" rel="noreferrer">Open BIThub ↗</a>
        </header>

        <nav className="os-tabstrip" aria-label="Primary navigation">
          {routes.map((route) => (
            <button key={route.id} data-active={initialView === route.id} onClick={() => router.push(route.href)}>{route.label}</button>
          ))}
          <div className="os-tab-spacer" />
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

      {initialView !== 'ask' && <CornerChat />}
    </main>
  );
}
