'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HydratedResource, Resource, SearchResponse } from '@/lib/resources';

type HubOverview = { categories?: Array<{ id: number; name: string; topicCount?: number }> };
type WikiOverview = { categories?: Array<{ name: string; pages?: number }> };

function compactDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function Explorer() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [detail, setDetail] = useState<HydratedResource | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [hub, setHub] = useState<HubOverview | null>(null);
  const [wiki, setWiki] = useState<WikiOverview | null>(null);
  const [filter, setFilter] = useState<'all' | 'hub' | 'wiki'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const seed = sessionStorage.getItem('bitcoreos-search-seed');
    if (seed) {
      sessionStorage.removeItem('bitcoreos-search-seed');
      setQuery(seed);
      void search(seed);
    }
    void Promise.all([
      fetch('/api/hub/overview').then((response) => response.json()).then(setHub).catch(() => setHub(null)),
      fetch('/api/wiki/overview').then((response) => response.json()).then(setWiki).catch(() => setWiki(null)),
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    const params = new URLSearchParams({ source: selected.source });
    if (selected.source === 'hub') {
      const topicId = Number(selected.metadata?.topicId || selected.id.replace(/^hub:/, ''));
      if (!Number.isInteger(topicId) || topicId <= 0) {
        setDetail(null);
        setDetailError('This BIThub result does not expose a readable topic id.');
        return;
      }
      params.set('topicId', String(topicId));
    } else {
      params.set('title', selected.title);
    }

    const controller = new AbortController();
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);

    fetch(`/api/resource?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
        return payload as HydratedResource;
      })
      .then(setDetail)
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setDetailError(error instanceof Error ? error.message : 'Unable to hydrate this resource.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });

    return () => controller.abort();
  }, [selected]);

  async function search(value = query) {
    const q = value.trim();
    if (!q) return;
    setLoading(true);
    setSelected(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const payload = await response.json();
      setData(payload);
      const resources = Array.isArray(payload?.resources) ? payload.resources : [];
      setSelected(resources[0] ?? null);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void search();
  }

  const visible = useMemo(() => {
    const resources = data?.resources ?? [];
    return filter === 'all' ? resources : resources.filter((resource) => resource.source === filter);
  }, [data, filter]);

  function useResource(mode: 'ask' | 'research') {
    if (!selected) return;
    sessionStorage.setItem('bitcoreos-context-resource', JSON.stringify(selected));
    if (mode === 'research') {
      sessionStorage.setItem('bitcoreos-research-seed', `Research and reconcile: ${selected.title}`);
      router.push('/research');
    } else {
      sessionStorage.setItem('bitcoreos-chat-seed', `Explain this resource and its relationship to the BITwiki ecosystem: ${selected.title}`);
      router.push('/ask');
    }
  }

  const inspected = detail ?? selected;

  return (
    <div className="explorer-shell">
      <aside className="explorer-tree win-panel raised">
        <div className="mini-title">SYSTEM TREE</div>
        <button className="tree-root" onClick={() => { setQuery('BIThub'); void search('BIThub'); }}>▾ BIThub</button>
        <div className="tree-children">
          {(hub?.categories ?? []).slice(0, 14).map((category) => (
            <button key={category.id} onClick={() => { setQuery(category.name); void search(category.name); }}>
              <span>□ {category.name}</span><small>{category.topicCount ?? ''}</small>
            </button>
          ))}
        </div>
        <button className="tree-root" onClick={() => { setQuery('BITwiki'); void search('BITwiki'); }}>▾ BITwiki</button>
        <div className="tree-children">
          {(wiki?.categories ?? []).slice(0, 14).map((category) => (
            <button key={category.name} onClick={() => { setQuery(category.name); void search(category.name); }}>
              <span>◇ {category.name}</span><small>{category.pages ?? ''}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="explorer-results win-panel raised">
        <form className="explorer-search sunken" onSubmit={submit}>
          <span className="search-glyph">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics, guides, concepts, people, artifacts…" autoFocus />
          <button type="submit">{loading ? 'Reading…' : 'Search'}</button>
        </form>
        <div className="result-tabs">
          <button data-active={filter === 'all'} onClick={() => setFilter('all')}>All <small>{data?.resources?.length ?? 0}</small></button>
          <button data-active={filter === 'hub'} onClick={() => setFilter('hub')}>BIThub <small>{data?.sources?.hub?.count ?? 0}</small></button>
          <button data-active={filter === 'wiki'} onClick={() => setFilter('wiki')}>BITwiki <small>{data?.sources?.wiki?.count ?? 0}</small></button>
          <span className="source-health">H:{data?.sources?.hub?.ok === false ? '!' : '●'} W:{data?.sources?.wiki?.ok === false ? '!' : '●'}</span>
        </div>
        <div className="resource-list sunken">
          {!data && <div className="explorer-empty"><b>Research index ready.</b><span>Select a layer or search across both systems.</span></div>}
          {data && visible.length === 0 && <div className="explorer-empty"><b>No matches.</b><span>Try a broader term or another system layer.</span></div>}
          {visible.map((resource) => (
            <button key={resource.id} className="resource-row" data-selected={selected?.id === resource.id} onClick={() => setSelected(resource)}>
              <span className={`source-chip ${resource.source}`}>{resource.source === 'hub' ? 'HUB' : 'WIKI'}</span>
              <div><strong>{resource.title}</strong><p>{resource.excerpt || resource.kind}</p></div>
              <small>{resource.kind}</small>
            </button>
          ))}
        </div>
      </section>

      <aside className="resource-inspector win-panel raised">
        <div className="mini-title">INSPECTOR // SOURCE READER</div>
        {!selected && <div className="inspector-empty">Select a result to inspect the source without leaving the cockpit.</div>}
        {selected && inspected && (
          <>
            <div className={`inspector-source ${inspected.source}`}>{inspected.source === 'hub' ? 'BIThub' : 'BITwiki'} · {inspected.kind}</div>
            <h2>{inspected.title}</h2>
            <p>{inspected.excerpt || 'No excerpt supplied by the source API.'}</p>
            <div className="inspector-actions inspector-actions-inline">
              <a href={inspected.url} target="_blank" rel="noreferrer">Open source ↗</a>
              <button onClick={() => useResource('ask')}>Ask</button>
              <button onClick={() => useResource('research')}>Research</button>
            </div>
            <dl>
              {Object.entries(inspected.metadata ?? {}).slice(0, 10).map(([key, value]) => (
                <div key={key}><dt>{key}</dt><dd>{String(value ?? '—')}</dd></div>
              ))}
            </dl>

            <div className="inspector-reader">
              <div className="reader-heading">
                <span>READER // HYDRATED SOURCE</span>
                {detail && <small>{detail.complete ? 'complete' : 'bounded view'}</small>}
              </div>
              {detailLoading && <div className="reader-state">Loading source content…</div>}
              {detailError && <div className="reader-state reader-error">{detailError}</div>}
              {detail?.details?.posts?.length ? (
                <div className="reader-posts">
                  {detail.details.posts.map((post) => (
                    <article className="reader-post" key={post.id}>
                      <header>
                        <b>@{post.username}</b>
                        <span>#{post.postNumber}{post.createdAt ? ` · ${compactDate(post.createdAt)}` : ''}</span>
                      </header>
                      <div>{post.text || 'Empty post.'}</div>
                    </article>
                  ))}
                </div>
              ) : detail?.content ? (
                <div className="reader-text">{detail.content}</div>
              ) : !detailLoading && !detailError ? (
                <div className="reader-state">No readable source body was returned.</div>
              ) : null}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
