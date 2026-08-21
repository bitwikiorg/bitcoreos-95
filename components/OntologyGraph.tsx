'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, { Background, Handle, MarkerType, Position, type Edge, type Node, type NodeProps } from 'reactflow';

type LayerData = {
  label: string;
  source: 'system' | 'hub' | 'wiki';
  kind: string;
  url?: string;
  description?: string;
  count?: number;
};

type LayerNode = Node<LayerData>;

const SemanticNode = memo(function SemanticNode({ data }: NodeProps<LayerData>) {
  const glyph = data.source === 'hub' ? '□' : data.source === 'wiki' ? '◇' : '⊙';
  return (
    <div className={`semantic-node ${data.source} kind-${data.kind}`}>
      <Handle type="target" position={Position.Top} className="semantic-handle" />
      <div className="semantic-node-top"><span>{glyph}</span><small>{data.source === 'system' ? 'MAP' : data.source.toUpperCase()}</small></div>
      <strong>{data.label}</strong>
      <div className="semantic-node-meta"><span>{data.kind}</span>{typeof data.count === 'number' && <b>{data.count}</b>}</div>
      <Handle type="source" position={Position.Bottom} className="semantic-handle" />
    </div>
  );
});

const nodeTypes = { semantic: SemanticNode };

export function OntologyGraph() {
  const router = useRouter();
  const [hubCategories, setHubCategories] = useState<any[]>([]);
  const [wikiCategories, setWikiCategories] = useState<any[]>([]);
  const [selected, setSelected] = useState<LayerData>({ label: 'BIT Ecosystem', source: 'system', kind: 'root', description: 'BIThub is the live work plane; BITwiki is durable semantic memory.' });

  useEffect(() => {
    void Promise.all([
      fetch('/api/hub/overview').then((r) => r.json()).then((data) => setHubCategories(data?.categories ?? [])).catch(() => setHubCategories([])),
      fetch('/api/wiki/overview').then((r) => r.json()).then((data) => setWikiCategories(data?.categories ?? [])).catch(() => setWikiCategories([])),
    ]);
  }, []);

  const { nodes, edges } = useMemo(() => {
    const ns: LayerNode[] = [
      { id: 'ecosystem', type: 'semantic', position: { x: 380, y: 10 }, data: { label: 'BIT Ecosystem', source: 'system', kind: 'root', description: 'One navigation map across two authoritative systems.' } },
      { id: 'hub', type: 'semantic', position: { x: 135, y: 155 }, data: { label: 'BIThub', source: 'hub', kind: 'work plane', url: 'https://hub.bitwiki.org', description: 'Questions, discussions, agents, workflows, artifacts, and live work.' } },
      { id: 'wiki', type: 'semantic', position: { x: 635, y: 155 }, data: { label: 'BITwiki', source: 'wiki', kind: 'memory plane', url: 'https://bitwiki.org', description: 'Durable knowledge, semantic assertions, computed views, and provenance.' } },
    ];
    const es: Edge[] = [
      { id: 'eco-hub', source: 'ecosystem', target: 'hub', label: 'work', markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'eco-wiki', source: 'ecosystem', target: 'wiki', label: 'memory', markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'hub-wiki', source: 'hub', target: 'wiki', label: 'research → review → crystallize', markerEnd: { type: MarkerType.ArrowClosed }, className: 'spectral-edge', animated: true },
    ];

    hubCategories.slice(0, 8).forEach((category, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const id = `hub-${category.id}`;
      ns.push({ id, type: 'semantic', position: { x: 15 + col * 210, y: 330 + row * 120 }, data: { label: category.name, source: 'hub', kind: 'category', url: category.url, description: category.description, count: category.topicCount } });
      es.push({ id: `edge-${id}`, source: 'hub', target: id, markerEnd: { type: MarkerType.ArrowClosed } });
    });

    wikiCategories.slice(0, 8).forEach((category, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const id = `wiki-${index}`;
      ns.push({ id, type: 'semantic', position: { x: 540 + col * 210, y: 330 + row * 120 }, data: { label: category.name, source: 'wiki', kind: 'category', url: category.url, description: `${category.pages ?? 0} pages · ${category.subcats ?? 0} subcategories`, count: category.pages } });
      es.push({ id: `edge-${id}`, source: 'wiki', target: id, markerEnd: { type: MarkerType.ArrowClosed } });
    });

    return { nodes: ns, edges: es };
  }, [hubCategories, wikiCategories]);

  function exploreSelected() {
    if (!selected?.label) return;
    sessionStorage.setItem('bitcoreos-search-seed', selected.label);
    router.push('/explorer');
  }

  return (
    <div className="ontology-workspace graph-secondary">
      <section className="ontology-canvas win-panel raised">
        <div className="panel-heading simple-heading"><div>KNOWLEDGE GRAPH</div><small>Explore → Graph · live categories now, semantic relations next</small></div>
        <div className="graph-canvas sunken">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.18 }} minZoom={0.45} maxZoom={1.35} nodesDraggable={false} nodesConnectable={false} onNodeClick={(_, node) => setSelected(node.data as LayerData)} proOptions={{ hideAttribution: true }}>
            <Background gap={26} size={1} />
          </ReactFlow>
        </div>
      </section>

      <aside className="ontology-inspector win-panel raised">
        <div className="mini-title">SELECTED LAYER</div>
        <div className={`inspector-source ${selected.source}`}>{selected.source.toUpperCase()} · {selected.kind}</div>
        <h2>{selected.label}</h2>
        <p>{selected.description || 'A navigable layer in the current ecosystem map.'}</p>
        {typeof selected.count === 'number' && <div className="layer-count"><b>{selected.count}</b><span>items</span></div>}
        <div className="inspector-actions"><button onClick={exploreSelected}>Explore this layer</button>{selected.url && <a href={selected.url} target="_blank" rel="noreferrer">Source ↗</a>}</div>
        <div className="graph-note">This view is intentionally secondary. Ask, Research, and Explore are the primary work surfaces.</div>
      </aside>
    </div>
  );
}
