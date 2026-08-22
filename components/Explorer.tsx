'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HydratedResource, Resource, SearchResponse } from '@/lib/resources';
import { contextLabel, publicHubTopicContext, publicWikiPageContext } from '@/lib/context';
import { SemanticFacts, type SemanticFact } from './SemanticFacts';

type Mode = 'feed' | 'search' | 'spaces' | 'agents' | 'mine';
type HubOverview = { latest?: any[]; categories?: any[] };
type WikiOverview = { recent?: any[]; categories?: any[] };
type AgentData = { registryUrl?: string; agents?: Array<{ index: number; name: string; username?: string; registryIdentity: string; intent: string; family: string }> };
type SpaceState = null | { id: number; slug: string; label: string; name: string; description?: string; url?: string };
type MineState = { viewer: string | null; delegated: boolean; resources: Resource[]; loading: boolean; error?: string };

const SPACE_DEFS = [
  { label: 'Discussions', category: 'Community', glyph: '◌' },
  { label: 'Nodes', category: 'Nodes', glyph: '◇' },
  { label: 'Cores', category: 'Cores', glyph: '◆' },
  { label: 'Markets', category: 'Marketplace', glyph: '¤' },
  { label: 'Artifacts', category: 'Artifacts', glyph: '▣' },
  { label: 'Workspaces', category: 'Workspaces', glyph: '▤' },
  { label: 'Feeds', category: 'Feeds', glyph: '≈' },
  { label: 'BITCOREOS', category: 'BITCOREOS', glyph: '⊙' },
] as const;

function compactDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

function resourceDate(resource: Resource) {
  return String(
    resource.metadata?.lastPostedAt
    || resource.metadata?.timestamp
    || resource.metadata?.createdAt
    || resource.metadata?.grantedAt
    || '',
  );
}

export function Explorer() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('feed');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [hub, setHub] = useState<HubOverview>({});
  const [wiki, setWiki] = useState<WikiOverview>({});
  const [agents, setAgents] = useState<AgentData>({});
  const [mine, setMine] = useState<MineState>({ viewer: null, delegated: false, resources: [], loading: false });
  const [selected, setSelected] = useState<Resource | null>(null);
  const [detail, setDetail] = useState<HydratedResource | null>(null);
  const [semanticFacts, setSemanticFacts] = useState<SemanticFact[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'hub' | 'wiki'>('all');
  const [loading, setLoading] = useState(false);
  const [activeSpace, setActiveSpace] = useState<SpaceState>(null);
  const [spaceResources, setSpaceResources] = useState<Resource[]>([]);
  const [spaceLoading, setSpaceLoading] = useState(false);

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
    if (!selected) { setDetail(null); setDetailLoading(false); return; }
    const params = new URLSearchParams({ source: selected.source });
    if (selected.source === 'hub') {
      const topicId = Number(selected.metadata?.topicId || selected.id.replace(/^hub:/, ''));
      if (!Number.isInteger(topicId) || topicId <= 0) { setDetail(null); setDetailLoading(false); return; }
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

  async function openMine() {
    setMode('mine');
    setSelected(null);
    setMine((current) => ({ ...current, loading: true, error: undefined }));
    try {
      const response = await fetch('/api/me/resources', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMine({ viewer: payload?.viewer || null, delegated: false, resources: [], loading: false, error: payload?.error || 'mine_unavailable' });
        return;
      }
      setMine({
        viewer: payload?.viewer || null,
        delegated: Boolean(payload?.delegated),
        resources: Array.isArray(payload?.resources) ? payload.resources : [],
        loading: false,
      });
    } catch {
      setMine({ viewer: null, delegated: false, resources: [], loading: false, error: 'mine_unavailable' });
    }
  }

  async function openSpace(space: any) {
    const id = Number(space?.id);
    const slug = String(space?.slug || '').trim();
    if (!Number.isInteger(id) || id <= 0 || !slug) {
      if (space?.url) window.open(space.url, '_blank', 'noopener,noreferrer');
      return;
    }
    setSpaceLoading(true);
    setSelected(null);
    setSpaceResources([]);
    setActiveSpace({ id, slug, label: String(space.label), name: String(space.name || space.category || space.label), description: space.description, url: space.url });
    try {
      const response = await fetch(`/api/hub/category?id=${id}&slug=${encodeURIComponent(slug)}`);
      const payload = await response.json();
      if (response.ok) {
        setSpaceResources(Array.isArray(payload?.resources) ? payload.resources : []);
        setActiveSpace((current) => current ? { ...current, name: payload?.category?.name || current.name, description: payload?.category?.description || current.description, url: payload?.category?.url || current.url } : current);
      }
    } finally { setSpaceLoading(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void search(); }

  const feed = useMemo<Resource[]>(() => {
    const hubItems: Resource[] = (hub.latest || []).map((item: any) => {
      const topicId = Number(item.id);
      return {
        id: `hub:${topicId}`, source: 'hub', kind: 'topic', title: item.title,
        excerpt: `${item.posts ?? 0} posts · ${item.views ?? 0} views`, url: item.url,
        tags: item.tags || [], metadata: { topicId, categoryId: item.categoryId, lastPostedAt: item.lastPostedAt },
        context: publicHubTopicContext({ topicId, url: item.url, categoryId: Number(item.categoryId || 0) || undefined }),
      };
    });
    const wikiItems: Resource[] = (wiki.recent || []).map((item: any) => {
      const pageId = item.pageId || item.id || item.title;
      return {
        id: `wiki:${pageId}`, source: 'wiki', kind: 'change', title: item.title,
        excerpt: item.comment || 'Recent BITwiki change', url: item.url,
        author: item.user, metadata: { pageId: item.pageId, revisionId: item.revisionId, timestamp: item.timestamp },
        context: publicWikiPageContext({ id: pageId, title: item.title, url: item.url, author: item.user, kind: 'Recent Wiki change', substrate: 'MediaWiki revision projection' }),
      };
    });
    return [...hubItems, ...wikiItems]
      .sort((a, b) => Date.parse(resourceDate(b) || '0') - Date.parse(resourceDate(a) || '0'))
      .slice(0, 24);
  }, [hub, wiki]);

  const spaces = useMemo(() => SPACE_DEFS.map((definition) => {
    const category = (hub.categories || []).find((item: any) => String(item.name).toLowerCase() === definition.category.toLowerCase());
    return category ? { ...definition, ...category } : { ...definition };
  }), [hub]);

  const visible = useMemo(() => {
    const items = mode === 'feed' ? feed : mode === 'mine' ? mine.resources : (data?.resources || []);
    return filter === 'all' ? items : items.filter((resource) => resource.source === filter);
  }, [mode, feed, mine.resources, data, filter]);

  function useResource(target: 'ask' | 'research') {
    if (!selected) return;
    sessionStorage.setItem('bitcoreos-context-resource', JSON.stringify(selected));
    if (selected.context) sessionStorage.setItem('bitcoreos-context-object', JSON.stringify(selected.context));
    if (target === 'research') {
      sessionStorage.setItem('bitcoreos-research-seed', `Research and reconcile this ${selected.context?.kind || selected.kind}: ${selected.title}`);
      if (selected.source === 'wiki') sessionStorage.setItem('bitcoreos-research-target', selected.title);
      else sessionStorage.removeItem('bitcoreos-research-target');
      router.push('/research');
    } else {
      sessionStorage.setItem('bitcoreos-chat-seed', `Explain this ${selected.context?.kind || selected.kind} in context: ${selected.title}`);
      router.push('/ask');
    }
  }

  return (
    <div className="explore-simple">
      <section className="explore-main win-panel raised">
        <div className="explore-modebar">
          <button data-active={mode === 'feed'} onClick={() => { setMode('feed'); setSelected(null); }}>Feed</button>
          <button data-active={mode === 'search'} onClick={() => setMode('search')}>Search</button>
          <button data-active={mode === 'spaces'} onClick={() => { setMode('spaces'); setSelected(null); }}>Spaces</button>
          <button data-active={mode === 'agents'} onClick={() => { setMode('agents'); setSelected(null); }}>Agents</button>
          <button data-active={mode === 'mine'} onClick={() => void openMine()}>Mine</button>
          <button className="secondary-mode" onClick={() => router.push('/ontology')}>Graph ↗</button>
        </div>

        {mode === 'search' && (
          <form className="explorer-search sunken" onSubmit={submit}>
            <span className="search-glyph">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search BIThub + BITwiki…" autoFocus />
            <button type="submit">{loading ? 'Reading…' : 'Search'}</button>
          </form>
        )}

        {(mode === 'feed' || mode === 'search' || mode === 'mine') && (
          <>
            <div className="result-tabs compact-tabs">
              <button data-active={filter === 'all'} onClick={() => setFilter('all')}>All</button>
              <button data-active={filter === 'hub'} onClick={() => setFilter('hub')}>BIThub</button>
              <button data-active={filter === 'wiki'} onClick={() => setFilter('wiki')}>BITwiki</button>
            </div>
            <div className="resource-list sunken relaxed-list">
              {mode === 'search' && !data && <div className="explorer-empty"><b>Search the ecosystem.</b><span>Origin is a facet; the object remains the same object wherever you use it.</span></div>}
              {mode === 'mine' && mine.loading && <div className="quiet-empty">Reading your objects…</div>}
              {mode === 'mine' && !mine.loading && mine.error === 'not_authenticated' && <div className="explorer-empty"><b>Mine requires identity.</b><span><a href="/api/auth/login">Sign in</a> to project your authored, saved, notification, badge, and Wiki contribution objects here.</span></div>}
              {mode === 'mine' && !mine.loading && mine.error && mine.error !== 'not_authenticated' && <div className="quiet-empty">Mine is unavailable: {mine.error}</div>}
              {mode === 'mine' && !mine.loading && mine.viewer && <div className="mine-strip"><b>@{mine.viewer}</b><span>{mine.delegated ? 'public + delegated objects' : 'public identity objects · connect private state for saved + notifications'}</span></div>}
              {visible.map((resource) => (
                <button key={resource.id} className="resource-row relaxed-row" data-selected={selected?.id === resource.id} onClick={() => setSelected(resource)}>
                  <span className={`source-chip ${resource.source}`}>{resource.source === 'hub' ? 'HUB' : 'WIKI'}</span>
                  <div><strong>{resource.title}</strong><p>{resource.excerpt || resource.context?.kind || resource.kind}</p></div>
                  <small>{compactDate(resourceDate(resource))}</small>
                </button>
              ))}
              {mode === 'mine' && !mine.loading && mine.viewer && !visible.length && <div className="quiet-empty">No Mine objects match this origin filter.</div>}
            </div>
          </>
        )}

        {mode === 'spaces' && !activeSpace && (
          <div className="space-directory sunken">
            <div className="explorer-empty space-intro"><b>Spaces</b><span>Curated entry points over actual discussion and workflow categories.</span></div>
            <div className="space-grid">
              {spaces.map((space) => (
                <article className="space-card" key={space.label}>
                  <div className="space-card-head"><span>{space.glyph}</span><strong>{space.label}</strong><small>{typeof space.topicCount === 'number' ? space.topicCount : ''}</small></div>
                  <p>{space.description || `Open the ${space.label} area.`}</p>
                  <div className="space-card-actions">
                    <button onClick={() => void openSpace(space)}>Explore</button>
                    {space.url && <a href={space.url} target="_blank" rel="noreferrer">Source ↗</a>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {mode === 'spaces' && activeSpace && (
          <div className="space-stream">
            <div className="space-stream-head">
              <button onClick={() => { setActiveSpace(null); setSpaceResources([]); setSelected(null); }}>← Spaces</button>
              <div><b>{activeSpace.label}</b><span>{activeSpace.description || activeSpace.name}</span></div>
              {activeSpace.url && <a href={activeSpace.url} target="_blank" rel="noreferrer">Source ↗</a>}
            </div>
            <div className="resource-list sunken relaxed-list">
              {spaceLoading && <div className="quiet-empty">Reading {activeSpace.label}…</div>}
              {!spaceLoading && spaceResources.map((resource) => (
                <button key={resource.id} className="resource-row relaxed-row" data-selected={selected?.id === resource.id} onClick={() => setSelected(resource)}>
                  <span className="source-chip hub">HUB</span>
                  <div><strong>{resource.title}</strong><p>{resource.excerpt || resource.context?.kind || 'Discussion object'}</p></div>
                  <small>{compactDate(resourceDate(resource))}</small>
                </button>
              ))}
              {!spaceLoading && !spaceResources.length && <div className="quiet-empty">No public topics returned for this space.</div>}
            </div>
          </div>
        )}

        {mode === 'agents' && (
          <div className="agent-directory sunken">
            <div className="explorer-empty agent-intro"><b>Agent registry</b><span>Public Constructs from the same registry used by the B8 agent layer.</span></div>
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

        {(mode === 'feed' || mode === 'search') && (
          <details className="browse-details">
            <summary>More categories</summary>
            <div className="browse-grid">
              <div><b>BIThub</b>{(hub.categories || []).slice(0, 12).map((category: any) => <button key={category.id} onClick={() => { setQuery(category.name); void search(category.name); }}>{category.name}</button>)}</div>
              <div><b>BITwiki</b>{(wiki.categories || []).slice(0, 12).map((category: any) => <button key={category.name} onClick={() => { setQuery(category.name); void search(category.name); }}>{category.name}</button>)}</div>
            </div>
          </details>
        )}
      </section>

      <aside className="explore-reader win-panel raised" data-empty={!selected}>
        {!selected && <div className="reader-placeholder"><div className="mini-title">OBJECT READER</div><h2>Select only what you want to inspect.</h2><p>The reader stays quiet until an object is selected.</p></div>}
        {selected && (
          <>
            <div className={`inspector-source ${selected.source}`}>{selected.source === 'hub' ? 'BIThub' : 'BITwiki'} · {selected.context?.kind || selected.kind}</div>
            <h2>{detail?.title || selected.title}</h2>
            <div className="inspector-actions inspector-actions-inline">
              <a href={selected.url} target="_blank" rel="noreferrer">Source ↗</a>
              <button onClick={() => useResource('ask')}>Ask</button>
              <button onClick={() => useResource('research')}>Research</button>
            </div>
            {selected.context && (
              <details className="reader-object-context">
                <summary>{contextLabel(selected.context)}</summary>
                <ObjectContextRow label="Origin" value={selected.context.origin.plane} />
                <ObjectContextRow label="Substrate" value={selected.context.origin.substrate} />
                <ObjectContextRow label="Visibility" value={selected.context.authority.visibility} />
                {selected.context.identity?.author && <ObjectContextRow label="Author" value={`@${selected.context.identity.author}`} />}
                {selected.context.identity?.executor?.label && <ObjectContextRow label="Executor" value={selected.context.identity.executor.label} />}
                <div className="context-capabilities">{selected.context.capabilities.map((capability) => <span key={capability}>{capability}</span>)}</div>
                {selected.context.provenance?.map((relation, index) => <div className="context-relation" key={`${relation.relation}-${index}`}>{relation.relation} → {relation.label || relation.targetId}</div>)}
              </details>
            )}
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

function ObjectContextRow({ label, value }: { label: string; value: string }) {
  return <div className="context-row"><small>{label}</small><strong>{value}</strong></div>;
}