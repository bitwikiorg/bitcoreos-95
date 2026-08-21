'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { Resource } from '@/lib/resources';
import { OntologyGraph } from './OntologyGraph';

type View = 'home' | 'explorer' | 'graph' | 'chat' | 'terminal';

const intents = [
  ['Find something', 'Search BIThub and BITwiki together.', 'explorer'],
  ['Ask BIThub', 'Ask a public-data-grounded guide.', 'chat'],
  ['Explore ecosystem', 'Navigate layers and relationships.', 'graph'],
  ['Open terminal', 'Power-user navigation and commands.', 'terminal'],
] as const;

export function Shell() {
  const [view, setView] = useState<View>('home');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Guest · public access');

  async function search(value = query) {
    const q = value.trim();
    if (!q) return;
    setLoading(true);
    setView('explorer');
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      setResults(Array.isArray(data.resources) ? data.resources : []);
      setStatus(`${data.resources?.length ?? 0} resources · Hub + Wiki`);
    } catch {
      setResults([]);
      setStatus('Search unavailable');
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void search();
  }

  function selectGraph(label: string) {
    setQuery(label);
    void search(label);
  }

  const grouped = useMemo(() => ({
    hub: results.filter((item) => item.source === 'hub'),
    wiki: results.filter((item) => item.source === 'wiki'),
  }), [results]);

  return (
    <main className="desktop">
      <header className="menubar">
        <button className="brand" onClick={() => setView('home')}>BITCOREOS-95</button>
        <nav>
          <button onClick={() => setView('explorer')}>Explorer</button>
          <button onClick={() => setView('graph')}>Ontology</button>
          <button onClick={() => setView('chat')}>Ask</button>
          <button onClick={() => setView('terminal')}>Terminal</button>
        </nav>
        <a href="https://hub.bitwiki.org" target="_blank" rel="noreferrer">Open BIThub ↗</a>
      </header>

      <section className="workspace">
        <div className="window main-window">
          <div className="titlebar">
            <span>{view === 'home' ? 'BIThub Navigator' : view[0].toUpperCase() + view.slice(1)}</span>
            <div className="window-controls"><i>_</i><i>□</i><i>×</i></div>
          </div>

          <form className="addressbar" onSubmit={submit}>
            <span>⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search BIThub + BITwiki" aria-label="Search BIThub and BITwiki" />
            <button type="submit">Go</button>
          </form>

          {view === 'home' && (
            <div className="home-panel">
              <div className="hero">
                <p className="eyebrow">BITWIKI ECOSYSTEM ACCESS LAYER</p>
                <h1>Find the right knowledge, discussion, tool, or workflow.</h1>
                <p>Use BIThub without learning its internal architecture first.</p>
              </div>
              <div className="intent-grid">
                {intents.map(([title, copy, target]) => (
                  <button className="intent-card" key={title} onClick={() => setView(target as View)}>
                    <strong>{title}</strong><span>{copy}</span>
                  </button>
                ))}
              </div>
              <div className="systems-row">
                <a className="system-card" href="https://hub.bitwiki.org" target="_blank" rel="noreferrer"><b>BIThub</b><span>work · discussion · constructs</span></a>
                <a className="system-card" href="https://bitwiki.org" target="_blank" rel="noreferrer"><b>BITwiki</b><span>knowledge · concepts · semantic data</span></a>
              </div>
            </div>
          )}

          {view === 'explorer' && (
            <div className="explorer">
              <aside className="tree">
                <b>BIT Ecosystem</b>
                <button onClick={() => void search('BIThub')}>▾ BIThub</button>
                <span>　Community</span><span>　Constructs</span><span>　Resources</span>
                <button onClick={() => void search('BITwiki')}>▾ BITwiki</button>
                <span>　Concepts</span><span>　Semantic data</span><span>　History</span>
              </aside>
              <section className="results">
                <div className="results-head"><b>{loading ? 'Searching…' : query ? `Results for “${query}”` : 'Search the ecosystem'}</b><span>Hub {grouped.hub.length} · Wiki {grouped.wiki.length}</span></div>
                {!loading && results.length === 0 && <div className="empty">Enter a concept, project, person, guide, tool, or question.</div>}
                {results.map((item) => (
                  <a className="result-row" href={item.url} target="_blank" rel="noreferrer" key={item.id}>
                    <span className={`source-badge ${item.source}`}>{item.source.toUpperCase()}</span>
                    <div><b>{item.title}</b><p>{item.excerpt || item.kind}</p></div>
                    <small>{item.kind}</small>
                  </a>
                ))}
              </section>
            </div>
          )}

          {view === 'graph' && (
            <div className="graph-view">
              <div className="panel-note"><b>Ontology navigator</b><span>Click a layer to search it across the ecosystem. This graph describes relationships; it does not execute workflows.</span></div>
              <OntologyGraph onSelect={selectGraph} />
            </div>
          )}

          {view === 'chat' && (
            <div className="placeholder-view">
              <div className="chat-mark">▣</div><h2>Ask BIThub</h2>
              <p>Anonymous, public-data-grounded AI belongs here. Retrieval is being built first so answers can cite BIThub and BITwiki rather than hallucinate platform structure.</p>
              <button onClick={() => { setView('explorer'); setQuery('getting started'); void search('getting started'); }}>Try public retrieval</button>
            </div>
          )}

          {view === 'terminal' && (
            <div className="terminal">
              <div>BITCOREOS-95 [public navigator]</div>
              <div>Type commands through the GUI for now; interactive parser follows the shared resource API.</div>
              <br />
              <div><span className="prompt">BIT&gt;</span> help</div>
              <div className="terminal-help">search &lt;query&gt;　 hub &lt;query&gt;　 wiki &lt;query&gt;　 ask &lt;question&gt;　 open &lt;resource&gt;　 login</div>
              <div><span className="prompt">BIT&gt;</span> _</div>
            </div>
          )}

          <footer className="statusbar"><span>{status}</span><span>BIThub + BITwiki</span></footer>
        </div>
      </section>
    </main>
  );
}
