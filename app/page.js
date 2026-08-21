'use client';

import { useMemo, useState } from 'react';
import { allNodes, connections, layers } from '../lib/ontology';

const surfaces = ['Explorer', 'Ask', 'Graph', 'Terminal'];

function Window({ title, children }) {
  return <section className="window"><div className="titlebar"><span>▦</span><strong>{title}</strong><div className="window-controls" aria-hidden="true"><button>_</button><button>□</button><button>×</button></div></div>{children}</section>;
}

function GraphNavigator() {
  const [selectedId, setSelectedId] = useState('ask');
  const [layerFilter, setLayerFilter] = useState('all');
  const selected = allNodes.find(node => node.id === selectedId) || allNodes[0];
  const related = useMemo(() => {
    const ids = connections.filter(([a,b]) => a === selectedId || b === selectedId).flatMap(([a,b]) => [a,b]).filter(id => id !== selectedId);
    return allNodes.filter(node => ids.includes(node.id));
  }, [selectedId]);
  const visibleLayers = layerFilter === 'all' ? layers : layers.filter(layer => layer.id === layerFilter);

  return <div className="graph-layout">
    <aside className="tree-panel inset-panel"><div className="panel-label">Ontology layers</div><button className={layerFilter==='all'?'tree-item active':'tree-item'} onClick={()=>setLayerFilter('all')}>▾ Ecosystem</button>{layers.map(layer=><button key={layer.id} className={layerFilter===layer.id?'tree-item active':'tree-item'} onClick={()=>setLayerFilter(layer.id)}>├─ {layer.label}</button>)}</aside>
    <div className="graph-canvas inset-panel"><div className="graph-grid">{visibleLayers.map(layer=><div className="graph-layer" key={layer.id}><div className="layer-heading">{layer.label}</div><div className="layer-nodes">{layer.nodes.map(node=><button key={node.id} className={`graph-node ${selectedId===node.id?'selected':''}`} onClick={()=>setSelectedId(node.id)}><span className="node-kind">{node.kind}</span><strong>{node.label}</strong></button>)}</div></div>)}</div></div>
    <aside className="inspector inset-panel"><div className="panel-label">Inspector</div><dl><dt>Object</dt><dd>{selected.label}</dd><dt>Layer</dt><dd>{selected.layerLabel}</dd><dt>Kind</dt><dd>{selected.kind}</dd></dl><p>{selected.description}</p><div className="panel-label">Related</div><div className="related-list">{related.length?related.map(node=><button key={node.id} onClick={()=>{setSelectedId(node.id);setLayerFilter('all')}}>{node.layerLabel} → {node.label}</button>):<span>None mapped yet.</span>}</div></aside>
  </div>;
}

function Explorer() {
  return <div className="explorer-layout">
    <aside className="tree-panel inset-panel"><div className="panel-label">BIT ecosystem</div><div className="tree-static">▾ BIThub</div><div className="tree-static indent">├─ Guides</div><div className="tree-static indent">├─ Community</div><div className="tree-static indent">├─ Constructs</div><div className="tree-static indent">├─ Nodes & COREs</div><div className="tree-static indent">└─ Workspaces</div><div className="tree-static">▾ BITwiki</div><div className="tree-static indent">├─ Concepts</div><div className="tree-static indent">├─ Projects</div><div className="tree-static indent">└─ Schemas</div></aside>
    <main className="resource-panel inset-panel"><div className="panel-label">Start with intent</div><div className="intent-grid"><article><span>🔎</span><strong>Find something</strong><p>Search BIThub and BITwiki as one knowledge environment.</p></article><article><span>💬</span><strong>Ask BIThub</strong><p>Use public knowledge as grounded context without requiring an account.</p></article><article><span>🧭</span><strong>Explore</strong><p>Navigate concepts, guides, tools, people, and projects by semantic layer.</p></article><article><span>⌨</span><strong>Power tools</strong><p>Open the terminal and later authenticated BIThub capabilities.</p></article></div><form className="search-row" action="/api/search"><input name="q" aria-label="Search BIThub and BITwiki" placeholder="Search BIThub + BITwiki..."/><button>Search</button></form><div className="resource-table"><div className="resource-header"><span>Type</span><span>Resource</span><span>Source</span></div><a href="https://hub.bitwiki.org/" target="_blank"><span>Workshop</span><strong>BIThub</strong><span>Discourse</span></a><a href="https://bitwiki.org/" target="_blank"><span>Library</span><strong>BITwiki</strong><span>MediaWiki</span></a></div></main>
  </div>;
}

function Ask() { return <div className="chat-shell inset-panel"><div className="chat-history"><div className="system-message"><strong>BITCOREOS-95 Guide</strong><p>Ask about BIThub, BITwiki, where something belongs, or how to find it. Anonymous mode is public-data-only.</p></div></div><form className="chat-input" onSubmit={e=>e.preventDefault()}><textarea placeholder="What are you trying to find, understand, or do?"/><button>Send</button></form><div className="status-strip">PUBLIC CONTEXT ONLY · WRITE ACTIONS DISABLED · AI ADAPTER PENDING</div></div>; }

function Terminal() { return <div className="terminal inset-panel"><pre>{`BITCOREOS-95 NAVIGATION SHELL\nCopyright (c) BITwiki\n\nBIT> help\n\nSEARCH\n  search <query>      federated Hub + Wiki search\n  hub <query>         search BIThub\n  wiki <query>        search BITwiki\n\nBROWSE\n  topic <id>          open a BIThub topic\n  page <title>        open a BITwiki page\n  graph <object>      inspect ontology relations\n\nAI\n  ask <prompt>        public-data grounded guide\n  explain <resource>  explain a Hub/Wiki object\n\nBIT> _`}</pre></div>; }

export default function Home() {
  const [surface, setSurface] = useState('Explorer');
  return <main className="desktop">
    <header className="topbar"><div className="brand"><span className="brand-mark">B</span><strong>BITCOREOS-95</strong><small>BIThub Navigator</small></div><nav>{surfaces.map(item=><button key={item} data-active={surface===item} onClick={()=>setSurface(item)}>{item}</button>)}</nav><div className="top-actions"><a href="https://hub.bitwiki.org/" target="_blank">Open BIThub</a><a href="https://bitwiki.org/" target="_blank">Open BITwiki</a></div></header>
    <div className="menubar"><button>File</button><button>Navigate</button><button>View</button><button>AI</button><button>Tools</button><button>Help</button></div>
    <div className="workspace"><Window title={`${surface} — BITCOREOS-95`}><div className="toolbar"><button onClick={()=>setSurface('Explorer')}>⌂</button><button>←</button><button>→</button><div className="address">bit://{surface.toLowerCase()}</div><div className="mode">anonymous</div></div><div className="window-body">{surface==='Explorer'&&<Explorer/>}{surface==='Ask'&&<Ask/>}{surface==='Graph'&&<GraphNavigator/>}{surface==='Terminal'&&<Terminal/>}</div><footer className="window-status"><span>BIThub: public adapter</span><span>BITwiki: public adapter</span><span>{surface}</span></footer></Window></div>
    <footer className="taskbar"><button className="start">▣ Start</button><button className="task active">▦ BITCOREOS-95</button><span className="taskbar-spacer"/><span className="clock">AST</span></footer>
  </main>;
}
