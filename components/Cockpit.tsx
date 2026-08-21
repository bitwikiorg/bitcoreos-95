'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CodexDiagram } from './CodexDiagram';

type HubOverview = {
  latest: Array<{ id: number; title: string; url: string; posts?: number; views?: number; lastPostedAt?: string }>;
  categories: Array<{ id: number; name: string; url: string; topicCount?: number }>;
  top: Array<{ id: number; title: string; url: string }>;
  health: Record<string, boolean>;
};

type WikiOverview = {
  recent: Array<{ id: number; title: string; user?: string; comment?: string; timestamp?: string; url: string }>;
  categories: Array<{ name: string; pages?: number; url: string }>;
  statistics: { articles?: number; edits?: number; pages?: number; activeUsers?: number };
  health: Record<string, boolean>;
};

export function Cockpit() {
  const router = useRouter();
  const [hub, setHub] = useState<HubOverview | null>(null);
  const [wiki, setWiki] = useState<WikiOverview | null>(null);
  const [request, setRequest] = useState('');

  useEffect(() => {
    void Promise.all([
      fetch('/api/hub/overview').then((response) => response.json()).then(setHub).catch(() => setHub(null)),
      fetch('/api/wiki/overview').then((response) => response.json()).then(setWiki).catch(() => setWiki(null)),
    ]);
  }, []);

  const hubHealthy = useMemo(() => hub ? Object.values(hub.health ?? {}).some(Boolean) : false, [hub]);
  const wikiHealthy = useMemo(() => wiki ? Object.values(wiki.health ?? {}).some(Boolean) : false, [wiki]);

  function deployResearch() {
    const value = request.trim();
    if (!value) return;
    sessionStorage.setItem('bitcoreos-research-seed', value);
    router.push('/research');
  }

  return (
    <div className="cockpit-grid">
      <section className="cockpit-primary">
        <div className="section-kicker">RESEARCH COCKPIT // PUBLIC SYSTEM VIEW</div>
        <div className="cockpit-intro">
          <div>
            <h1>Navigate the work. Interrogate the knowledge. Deploy research.</h1>
            <p>BIThub is the live work surface. BITwiki is durable semantic memory. This cockpit keeps both visible without forcing the user to learn their internal structure first.</p>
          </div>
          <div className="codex-chamber"><CodexDiagram /></div>
        </div>

        <div className="research-deploy raised">
          <div className="panel-heading">
            <div><span className="signal-dot" />Deploy a research request</div>
            <small>request → evidence map → wiki-ready research packet</small>
          </div>
          <div className="research-command">
            <textarea
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              placeholder="What should the system investigate, reconcile, or turn into durable BITwiki knowledge?"
              rows={3}
            />
            <button className="spectral-button" onClick={deployResearch}>Deploy →</button>
          </div>
        </div>

        <div className="dual-feed">
          <section className="win-panel raised feed-panel">
            <div className="panel-heading"><div>BIThub // latest work</div><button onClick={() => router.push('/explorer')}>Explore</button></div>
            <div className="feed-list">
              {(hub?.latest ?? []).slice(0, 7).map((topic) => (
                <a href={topic.url} target="_blank" rel="noreferrer" key={topic.id} className="feed-row">
                  <span className="feed-mark hub-mark">H</span>
                  <div><strong>{topic.title}</strong><small>{topic.posts ?? 0} posts · {topic.views ?? 0} views</small></div>
                </a>
              ))}
              {!hub && <div className="loading-plate">Reading BIThub…</div>}
            </div>
          </section>

          <section className="win-panel raised feed-panel">
            <div className="panel-heading"><div>BITwiki // recent memory</div><a href="https://bitwiki.org/Special:RecentChanges" target="_blank" rel="noreferrer">History</a></div>
            <div className="feed-list">
              {(wiki?.recent ?? []).slice(0, 7).map((change) => (
                <a href={change.url} target="_blank" rel="noreferrer" key={change.id} className="feed-row">
                  <span className="feed-mark wiki-mark">W</span>
                  <div><strong>{change.title}</strong><small>{change.user ? `@${change.user}` : 'BITwiki'}{change.comment ? ` · ${change.comment}` : ''}</small></div>
                </a>
              ))}
              {!wiki && <div className="loading-plate">Reading BITwiki…</div>}
            </div>
          </section>
        </div>
      </section>

      <aside className="cockpit-rail">
        <section className="win-panel raised rail-block">
          <div className="mini-title">SYSTEM SIGNALS</div>
          <div className="health-row"><span className={hubHealthy ? 'health-on' : 'health-off'} />BIThub API <b>{hubHealthy ? 'LIVE' : 'CHECK'}</b></div>
          <div className="health-row"><span className={wikiHealthy ? 'health-on' : 'health-off'} />BITwiki API <b>{wikiHealthy ? 'LIVE' : 'CHECK'}</b></div>
        </section>

        <section className="win-panel raised rail-block">
          <div className="mini-title">BITWIKI MEMORY</div>
          <div className="stat-matrix">
            <div><b>{wiki?.statistics?.articles ?? '—'}</b><span>articles</span></div>
            <div><b>{wiki?.statistics?.edits ?? '—'}</b><span>edits</span></div>
            <div><b>{wiki?.statistics?.pages ?? '—'}</b><span>pages</span></div>
            <div><b>{wiki?.statistics?.activeUsers ?? '—'}</b><span>active users</span></div>
          </div>
        </section>

        <section className="win-panel raised rail-block">
          <div className="mini-title">NAVIGATION LAYERS</div>
          <div className="layer-buttons">
            {(hub?.categories ?? []).slice(0, 9).map((category) => (
              <button key={category.id} onClick={() => {
                sessionStorage.setItem('bitcoreos-search-seed', category.name);
                router.push('/explorer');
              }}>
                <span>{category.name}</span><small>{category.topicCount ?? ''}</small>
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
