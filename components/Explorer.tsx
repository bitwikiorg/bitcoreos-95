'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HydratedResource, Resource, SearchResponse } from '@/lib/resources';
import { SemanticFacts, type SemanticFact } from './SemanticFacts';

type Mode = 'feed' | 'search' | 'agents';
type HubOverview = { latest?: any[]; categories?: any[] };
type WikiOverview = { recent?: any[]; categories?: any[] };
type AgentData = { registryUrl?: string; agents?: Array<{ index: number; name: string; username?: string; registryIdentity: string; intent: string; family: string }> };

function compactDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

export function Explorer() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('feed');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [hub, setHub] = useState<HubOverview>({});
  const [wiki, setWiki] = useState<WikiOverview>({});
  const [agents, setAgents] = useState<AgentData>({});
  const [selected, setSelected] = useState<Resource | null>(null);
  const [detail, setDetail] = useState<HydratedResource | null>(null);
  const [semanticFacts, setSemanticFacts] = useState<SemanticFact[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'hub' | 'wiki'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const seed = sessionStorage.getItem('bitcoreos-search-seed');
    if (seed) {
      sessionStorage.removeItem('bitcoreos-search-seed');
      setQuery(seed);
      setMode('search');
      void search(seed);
    }
    void Promise.all([
      fetch('/api/hub/overview').then((r) => r.json()).then(setHub).catch(() => setHub({})),
      fetch('/api/wiki/overview').then((r) => r.json()).then(setWiki).catch(() => setWiki({})),
      fetch('/api/agents').then((r) => r.json()).then(setAgents).catch(() => setAgents({})),
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSemanticFacts([]);
    if (!selected) { setDetail(null); return; }
    const params = new URLSearchParams({ source: selected.source });
    if (selected.source === 'hub') {
      const topicId = Number(selected.metadata?.topicId || selected.id.replace(/^hub:/, ''));
      if (!Number.isInteger(topicId) || topicId <= 0) { setDetail(null); return; }
      params.set('topicId', String(topicId));
    } else params.set('title', selected.title);

    const controller = new AbortController();
    setDetail(null);
    setDetailLoading(true);
    const reads: Promise<unknown>[] = [
      fetch(`/api/resource?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => response.ok ? response.json() : Promise.reject(new Error('source_read_failed')))
        .then(setDetail),
    ];
    if (selected.source === 'wiki') {
      reads.push(
        fetch(`/api/wiki/semantic?title=${encodeURIComponent(selected.title)}`, { signal: controller.signal })
          .then((response) => response.ok ? response.json() : null)
          .then((payload) => setSemanticFacts(Array.isArray(payload?.facts) ? payload.facts : [])),
      );
    }
    Promise.allSettled(reads).finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selected]);

  async function search(value = query) {
    const q = value.trim();
    if (!q) return;
    setMode('search');
    setLoading(true);
    setSelected(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const payload = await response.json();
      setData(payload);
    } finally { setLoading(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void search(); }

  const feed = useMemo<Resource[]>(() => {
    const hubItems: Resource[] = (hub.latest || []).map((item: any) => ({
      id: `hub:${item.id}`, source: 'hub', kind: 'topic', title: item.title,
      excerpt: `${item.posts ?? 0} posts · ${item.views ?? 0} views`, url: item.url,
      tags: item.tags || [], metadata: { topicId: item.id, categoryId: item.categoryId, lastPostedAt: item.lastPostedAt },
    }));
    const wikiItems: Resource[] = (wiki.recent || []).map((item: any) => ({
      id: `wiki:${item.pageId || item.id}`, source: 'wiki', kind: 'change', title: item.title,
      excerpt: item.comment || 'Recent BITwiki change', url: item.url,
      author: item.user, metadata: { pageId: item.pageId, revisionId: item.revisionId, timestamp: item.timestamp },
    }));
    return [...hubItems, ...wikiItems]
      .sort((a, b) => Date.parse(String(b.metadata?.lastPostedAt || b.metadata?.timestamp || 0)) - Date.parse(String(a.metadata?.lastPostedAt || a.metadata?.timestamp || 0)))
      .slice(0, 24);
  }, [hub, wiki]);

  const visible = useMemo(() => {
    const items = mode === 'feed' ? feed : (data?.resources || []);
    return filter === 'all' ? items : items.filter((resource) => resource.source === filter);
  }, [mode, feed, data, filter]);

  function useResource(target: 'ask' | 'research') {
    if (!selected) return;
    sessionStorage.setItem('bitcoreos-context-resource', JSON.stringify(selected));
    if (target === 'research') {
      sessionStorage.setItem('bitcoreos-research-seed', `Research and reconcile: ${selected.title}`);
      sessionStorage.setItem('bitcoreos-research-target', selected.title);
      router.push('/research');
    } else {
      sessionStorage.setItem('bitcoreos-chat-seed', `Explain this resource and its relationship to the BITwiki ecosystem: ${selected.title}`);
      router.push('/ask');
    }
  }

  return (
    <div className="explore-simple">
      <section className="explore-main win-panel raised">
        <div className="explore-modebar">
          <button data-active={mode === 'feed'} onClick={() => { setMode('feed'); setSelected(null); }}>Feed</button>
          <button data-active={mode === 'search'} onClick={() => setMode('search')}>Search</button>
          <button data-active={mode === 'agents'} onClick={() => { setMode('agents'); setSelected(null); }}>Agents</button>
          <button onClick={() => router.push('/ontology')}>Knowledge graph ↗</button>
        </div>

        {mode === 'search' && (
          <form className="explorer-search sunken" onSubmit={submit}>
            <span className="search-glyph">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search BIThub + BITwiki…" autoFocus />
            <button type="submit">{loading ? 'Reading…' : 'Search'}</button>
          </form>
        )}

        {mode !== 'agents' && (
          <>
            <div className="result-tabs compact-tabs">
              <button data-active={filter === 'all'} onClick={() => setFilter('all')}>All</button>
              <button data-active={filter === 'hub'} onClick={() => setFilter('hub')}>BIThub</button>
              <button data-active={filter === 'wiki'} onClick={() => setFilter('wiki')}>BITwiki</button>
            </div>
            <div className="resource-list sunken relaxed-list">
              {mode === 'search' && !data && <div className="explorer-empty"><b>Search both systems.</b><span>Results stay readable here; source detail opens only when selected.</span></div>}
              {visible.map((resource) => (
                <button key={resource.id} className="resource-row relaxed-row" data-selected={selected?.id === resource.id} onClick={() => setSelected(resource)}>
                  <span className={`source-chip ${resource.source}`}>{resource.source === 'hub' ? 'HUB' : 'WIKI'}</span>
                  <div><strong>{resource.title}</strong><p>{resource.excerpt || resource.kind}</p></div>
                  <small>{compactDate(String(resource.metadata?.lastPostedAt || resource.metadata?.timestamp || ''))}</small>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'agents' && (
          <div className="agent-directory sunken">
            <div className="explorer-empty agent-intro"><b>BIThub agent registry</b><span>Public constructs from the same registry used by the official B8 agent plugin.</span></div>
            {(agents.agents || []).map((agent) => {
              const href = agent.username ? `https://hub.bitwiki.org/u/${encodeURIComponent(agent.username)}` : (agents.registryUrl || 'https://hub.bitwiki.org/t/30145');
              return (
                <a key={agent.index} href={href} target="_blank" rel="noreferrer" className="agent-row">
                  <span className="agent-index">{String(agent.index).padStart(2, '0')}</span>
                  <div><strong>{agent.name}</strong><p>{agent.intent}</p></div>
                  <small>{agent.username ? `@${agent.username}` : agent.family}</small>
                </a>
              );
            })}
          </div>
        )}

        <details className="browse-details">
          <summary>Browse categories</summary>
          <div className="browse-grid">
            <div><b>BIThub</b>{(hub.categories || []).slice(0, 12).map((category: any) => <button key={category.id} onClick={() => { setQuery(category.name); void search(category.name); }}>{category.name}</button>)}</div>
            <div><b>BITwiki</b>{(wiki.categories || []).slice(0, 12).map((category: any) => <button key={category.name} onClick={() => { setQuery(category.name); void search(category.name); }}>{category.name}</button>)}</div>
          </div>
        </details>
      </section>

      <aside className="explore-reader win-panel raised" data-empty={!selected}>
        {!selected && <div className="reader-placeholder"><div className="mini-title">SOURCE READER</div><h2>Select only what you want to inspect.</h2><p>The reader stays quiet until a resource is selected.</p></div>}
        {selected && (
          <>
            <div className={`inspector-source ${selected.source}`}>{selected.source === 'hub' ? 'BIThub' : 'BITwiki'} · {selected.kind}</div>
            <h2>{detail?.title || selected.title}</h2>
            <div className="inspector-actions inspector-actions-inline">
              <a href={selected.url} target="_blank" rel="noreferrer">Source ↗</a>
              <button onClick={() => useResource('ask')}>Ask</button>
              <button onClick={() => useResource('research')}>Research</button>
            </div>
            <div className="reader-text simple-reader">{detailLoading ? 'Reading source…' : (detail?.content || selected.excerpt || 'No readable body returned.')}</div>
            {selected.source === 'wiki' && (
              <details className="reader-semantic">
                <summary>Semantic relations {semanticFacts.length ? `(${semanticFacts.length})` : ''}</summary>
                <SemanticFacts facts={semanticFacts} />
              </details>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
