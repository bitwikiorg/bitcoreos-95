'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cockpit } from './Cockpit';
import { Explorer } from './Explorer';
import { OntologyGraph } from './OntologyGraph';
import { ChatWorkspace } from './ChatWorkspace';
import { ResearchWorkspace } from './ResearchWorkspace';
import { PersonalSpace } from './PersonalSpace';
import { OphanimSeal } from './OphanimSeal';

export type View = 'cockpit' | 'explorer' | 'ontology' | 'ask' | 'research' | 'my';

type AuthState = {
  user: null | { username: string; name?: string; avatarUrl?: string; admin?: boolean; groups?: string[] };
  configured: boolean;
};

const routes: Array<{ id: 'ask' | 'research' | 'explorer'; label: string; href: string }> = [
  { id: 'ask', label: 'Ask', href: '/ask' },
  { id: 'research', label: 'Research', href: '/research' },
  { id: 'explorer', label: 'Explore', href: '/explorer' },
];

const titles: Record<View, string> = {
  cockpit: 'Navigator',
  explorer: 'Explore',
  ontology: 'Knowledge Graph',
  ask: 'Ask',
  research: 'Research',
  my: 'My BIThub',
};

export function Shell({ initialView = 'cockpit' }: { initialView?: View }) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ user: null, configured: false });

  async function refreshAuth() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      if (response.ok) setAuth(await response.json());
    } catch {}
  }

  useEffect(() => { void refreshAuth(); }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    await refreshAuth();
    router.push('/');
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
            <button key={route.id} data-active={initialView === route.id || (route.id === 'explorer' && initialView === 'ontology')} onClick={() => router.push(route.href)}>{route.label}</button>
          ))}
          <div className="os-tab-spacer" />
          <button className="identity-button" data-active={initialView === 'my'} onClick={() => router.push('/my')}>
            {auth.user ? `@${auth.user.username}` : 'Anonymous'}
          </button>
          {auth.user
            ? <button onClick={logout}>Out</button>
            : <a className="tab-signin" href="/api/auth/login">Sign in</a>}
        </nav>

        <div className="os-content">
          {initialView === 'cockpit' && <Cockpit />}
          {initialView === 'explorer' && <Explorer />}
          {initialView === 'ontology' && <OntologyGraph />}
          {initialView === 'ask' && <ChatWorkspace />}
          {initialView === 'research' && <ResearchWorkspace />}
          {initialView === 'my' && <PersonalSpace />}
        </div>
      </section>

      <OphanimSeal />
    </main>
  );
}
