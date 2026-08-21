'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CodexDiagram } from './CodexDiagram';

type HubOverview = {
  stats?: { topics?: number; posts?: number; users?: number; activeUsers7Days?: number };
  health?: Record<string, boolean>;
};

type WikiOverview = {
  statistics?: { articles?: number; edits?: number; pages?: number; activeUsers?: number };
  health?: Record<string, boolean>;
};

function number(value?: number) {
  return typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : '—';
}

export function Cockpit() {
  const router = useRouter();
  const [hub, setHub] = useState<HubOverview | null>(null);
  const [wiki, setWiki] = useState<WikiOverview | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void Promise.all([
      fetch('/api/hub/overview').then((response) => response.json()).then(setHub).catch(() => setHub(null)),
      fetch('/api/wiki/overview').then((response) => response.json()).then(setWiki).catch(() => setWiki(null)),
    ]);
  }, []);

  const hubLive = useMemo(() => !!hub && Object.values(hub.health ?? {}).some(Boolean), [hub]);
  const wikiLive = useMemo(() => !!wiki && Object.values(wiki.health ?? {}).some(Boolean), [wiki]);

  function search(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    sessionStorage.setItem('bitcoreos-search-seed', value);
    router.push('/explorer');
  }

  function go(path: string) {
    router.push(path);
  }

  return (
    <div className="home-simple">
      <section className="home-hero">
        <div className="home-copy">
          <div className="section-kicker">BITWIKI ECOSYSTEM ACCESS LAYER</div>
          <h1>Find the right knowledge, discussion, tool, or workflow.</h1>
          <p>Search BIThub and BITwiki. Ask questions. Deploy research.</p>
          <form className="home-search sunken" onSubmit={search}>
            <span>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search BIThub + BITwiki" aria-label="Search BIThub and BITwiki" />
            <button type="submit">Go</button>
          </form>
        </div>
        <div className="home-mark"><CodexDiagram /></div>
      </section>

      <section className="home-actions" aria-label="Primary actions">
        <button onClick={() => go('/explorer')}><b>Find</b><span>Hub + Wiki search</span></button>
        <button onClick={() => go('/ask')}><b>Ask</b><span>Grounded chat</span></button>
        <button onClick={() => go('/ontology')}><b>Explore</b><span>Ontology map</span></button>
        <button onClick={() => go('/research')}><b>Research</b><span>Deploy request</span></button>
      </section>

      <section className="home-systems" aria-label="Source systems">
        <a href="https://hub.bitwiki.org" target="_blank" rel="noreferrer" className="home-system-card">
          <div className="system-name"><span className={hubLive ? 'source-live' : 'source-off'} />BIThub</div>
          <div className="system-stats">
            <span><b>{number(hub?.stats?.topics)}</b> topics</span>
            <span><b>{number(hub?.stats?.posts)}</b> posts</span>
            <span><b>{number(hub?.stats?.users)}</b> members</span>
          </div>
        </a>
        <a href="https://bitwiki.org" target="_blank" rel="noreferrer" className="home-system-card">
          <div className="system-name"><span className={wikiLive ? 'source-live' : 'source-off'} />BITwiki</div>
          <div className="system-stats">
            <span><b>{number(wiki?.statistics?.articles)}</b> articles</span>
            <span><b>{number(wiki?.statistics?.edits)}</b> edits</span>
            <span><b>{number(wiki?.statistics?.pages)}</b> pages</span>
          </div>
        </a>
      </section>
    </div>
  );
}
