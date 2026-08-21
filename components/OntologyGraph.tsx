'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, { Background, Controls, MarkerType, type Edge, type Node } from 'reactflow';

type LayerData = {
  label: string;
  source: 'system' | 'hub' | 'wiki';
  kind: string;
  url?: string;
  description?: string;
  count?: number;
};

type LayerNode = Node<LayerData>;

export function OntologyGraph() {
  const router = useRouter();
  const [hubCategories, setHubCategories] = useState<any[]>([]);
  const [wikiCategories, setWikiCategories] = useState<any[]>([]);
  const [selected, setSelected] = useState<LayerData>({ label: 'BIT Ecosystem', source: 'system', kind: 'root', description: 'Two authoritative systems projected through one navigation layer.' });

  useEffect(() => {
    void Promise.all([
      fetch('/api/hub/overview').then((response) => response.json()).then((data) => setHubCategories(data?.categories ?? [])).catch(() => setHubCategories([])),
      fetch('/api/wiki/overview').then((response) => response.json()).then((data) => setWikiCategories(data?.categories ?? [])).catch(() => setWikiCategories([])),
    ]);
  }, []);

  const { nodes, edges } = useMemo(() => {
    const ns: LayerNode[] = [
      { id: 'ecosystem', position: { x: 420, y: 15 }, data: { label: 'BIT Ecosystem', source: 'system', kind: 'root', description: 'Unified navigation projection.' }, className: 'ontology-root' },
      { id: 'hub', position: { x: 150, y: 145 }, data: { label: 'BIThub', source: 'hub', kind: 'system', url: 'https://hub.bitwiki.org', description: 'Live work, discussion, tools, artifacts and operating surfaces.' }, className: 'ontology-system hub-node' },
      { id: 'wiki', position: { x: 690, y: 145 }, data: { label: 'BITwiki', source: 'wiki', kind: 'system', url: 'https://bitwiki.org', description: 'Durable semantic memory and canonical knowledge.' }, className: 'ontology-system wiki-node' },
    ];
    const es: Edge[] = [
      { id: 'eco-hub', source: 'ecosystem', target: 'hub', label: 'work', markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'eco-wiki', source: 'ecosystem', target: 'wiki', label: 'memory', markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'hub-wiki', source: 'hub', target: 'wiki', label: 'validate → preserve', markerEnd: { type: MarkerType.ArrowClosed }, className: 'spectral-edge', animated: true },
    ];

    hubCategories.slice(0, 12).forEach((category, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const id = `hub-${category.id}`;
      ns.push({
        id,
        position: { x: 10 + col * 170, y: 305 + row * 105 },
        data: {
          label: category.name,
          source: 'hub',
          kind: 'category',
          url: category.url,
          description: category.description,
          count: category.topicCount,
        },
        className: 'ontology-layer hub-layer',
      });
      es.push({ id: `hub-${id}`, source: 'hub', target: id, markerEnd: { type: MarkerType.ArrowClosed } });
    });

    wikiCategories.slice(0, 12).forEach((category, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const id = `wiki-${index}-${category.name}`;
      ns.push({
        id,
        position: { x: 555 + col * 170, y: 305 + row * 105 },
        data: {
          label: category.name,
          source: 'wiki',
          kind: 'category',
          url: category.url,
          description: `${category.pages ?? 0} pages · ${category.subcats ?? 0} subcategories`,
          count: category.pages,
        },
        className: 'ontology-layer wiki-layer',
      });
      es.push({ id: `wiki-${id}`, source: 'wiki', target: id, markerEnd: { type: MarkerType.ArrowClosed } });
    });

    return { nodes: ns, edges: es };
  }, [hubCategories, wikiCategories]);

  function exploreSelected() {
    if (!selected?.label) return;
    sessionStorage.setItem('bitcoreos-search-seed', selected.label);
    router.push('/explorer');
  }

  return (
    <div className="ontology-workspace">
      <section className="ontology-canvas win-panel raised">
        <div className="panel-heading"><div>ONTOLOGY // LIVE NAVIGATION SCHEMA</div><small>structural edges are monochrome · active cross-system transfer is spectral</small></div>
        <div className="graph-canvas sunken">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.35}
            maxZoom={1.7}
            nodesDraggable={false}
            nodesConnectable={false}
            onNodeClick={(_, node) => setSelected(node.data as LayerData)}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={22} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </section>

      <aside className="ontology-inspector win-panel raised">
        <div className="mini-title">LAYER INSPECTOR</div>
        <div className={`inspector-source ${selected.source === 'system' ? 'system' : selected.source}`}>{selected.source.toUpperCase()} · {selected.kind}</div>
        <h2>{selected.label}</h2>
        <p>{selected.description || 'A navigable layer in the current ecosystem schema.'}</p>
        {typeof selected.count === 'number' && <div className="layer-count"><b>{selected.count}</b><span>indexed items</span></div>}
        <div className="geometry-key">
          <div><span className="geo cube" />bounded system/layer</div>
          <div><span className="geo lattice" />semantic knowledge</div>
          <div><span className="geo arc" />active transfer</div>
        </div>
        <div className="inspector-actions">
          <button onClick={exploreSelected}>Explore this layer</button>
          {selected.url && <a href={selected.url} target="_blank" rel="noreferrer">Open source ↗</a>}
        </div>
      </aside>
    </div>
  );
}
