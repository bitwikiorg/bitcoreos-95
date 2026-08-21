'use client';

import { FormEvent, memo, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, { Background, Handle, MarkerType, Position, type Edge, type Node, type NodeProps } from 'reactflow';
import { SemanticFacts, type SemanticFact } from './SemanticFacts';

type LayerData = {
  label: string;
  source: 'system' | 'hub' | 'wiki';
  kind: string;
  url?: string;
  description?: string;
  count?: number;
  searchTerm?: string;
};

type LayerNode = Node<LayerData>;

type HubOverview = { stats?: { topics?: number; posts?: number }; categories?: Array<{ name: string; topicCount?: number; postCount?: number }> };
type WikiOverview = { statistics?: { articles?: number; pages?: number }; categories?: any[] };
type AgentData = { agents?: any[] };
type RequestData = { requests?: Array<{ status: string }>; source?: string };
type SemanticInfo = { info?: { data?: { info?: Record<string, number> } } };

const SemanticNode = memo(function SemanticNode({ data }: NodeProps<LayerData>) {
  const glyph = data.source === 'hub' ? '□' : data.source === 'wiki' ? '◇' : '⊙';
  return (
    <div className={`semantic-node ${data.source} kind-${data.kind.replace(/\s+/g, '-')}`}>
      <Handle type="target" position={Position.Top} className="semantic-handle" />
      <div className="semantic-node-top"><span>{glyph}</span><small>{data.source === 'system' ? 'MAP' : data.source.toUpperCase()}</small></div>
      <strong>{data.label}</strong>
      <div className="semantic-node-meta"><span>{data.kind}</span>{typeof data.count === 'number' && <b>{data.count.toLocaleString()}</b>}</div>
      <Handle type="source" position={Position.Bottom} className="semantic-handle" />
    </div>
  );
});

const nodeTypes = { semantic: SemanticNode };

function cleanSmwItem(value: string) {
  return value.replace(/#\d+##$/, '').replace(/_/g, ' ');
}

export function OntologyGraph() {
  const router = useRouter();
  const [hub, setHub] = useState<HubOverview>({});
  const [wiki, setWiki] = useState<WikiOverview>({});
  const [agents, setAgents] = useState<AgentData>({});
  const [requests, setRequests] = useState<RequestData>({});
  const [semantic, setSemantic] = useState<SemanticInfo>({});
  const [selected, setSelected] = useState<LayerData>({ label: 'BIT Ecosystem', source: 'system', kind: 'root', description: 'BIThub is the live work plane; BITwiki is durable semantic memory.' });
  const [subjectInput, setSubjectInput] = useState('');
  const [subjectTitle, setSubjectTitle] = useState('');
  const [subjectFacts, setSubjectFacts] = useState<SemanticFact[]>([]);
  const [subjectLoading, setSubjectLoading] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch('/api/hub/overview').then((r) => r.json()).then(setHub).catch(() => setHub({})),
      fetch('/api/wiki/overview').then((r) => r.json()).then(setWiki).catch(() => setWiki({})),
      fetch('/api/agents').then((r) => r.json()).then(setAgents).catch(() => setAgents({})),
      fetch('/api/research/requests?limit=250').then((r) => r.json()).then(setRequests).catch(() => setRequests({})),
      fetch('/api/wiki/semantic?limit=1').then((r) => r.json()).then(setSemantic).catch(() => setSemantic({})),
    ]);
  }, []);

  async function inspectSubject(event: FormEvent) {
    event.preventDefault();
    const title = subjectInput.trim();
    if (!title) return;
    setSubjectLoading(true);
    try {
      const response = await fetch(`/api/wiki/semantic?title=${encodeURIComponent(title)}`);
      const data = await response.json();
      setSubjectTitle(data?.title || title);
      setSubjectFacts(Array.isArray(data?.facts) ? data.facts : []);
      setSelected({ label: data?.title || title, source: 'wiki', kind: 'semantic subject', description: 'Live Semantic MediaWiki assertions for this subject.', searchTerm: data?.title || title });
    } finally { setSubjectLoading(false); }
  }

  const semanticStats = semantic?.info?.data?.info || {};
  const activeRequests = (requests.requests || []).filter((item) => !['satisfied', 'declined'].includes(item.status)).length;
  const workflowCategories = (hub.categories || []).filter((category) => ['Cores', 'Nodes', 'Workspaces'].includes(category.name));
  const workflowCount = workflowCategories.reduce((sum, category) => sum + Number(category.topicCount || 0), 0);

  const layerGraph = useMemo(() => {
    const ns: LayerNode[] = [
      { id: 'ecosystem', type: 'semantic', position: { x: 385, y: 10 }, data: { label: 'BIT Ecosystem', source: 'system', kind: 'root', description: 'One navigation map across the live work plane and durable knowledge plane.' } },
      { id: 'hub', type: 'semantic', position: { x: 150, y: 155 }, data: { label: 'BIThub', source: 'hub', kind: 'work plane', url: 'https://hub.bitwiki.org', description: 'Questions, discussions, agents, workflows, artifacts, and live work.', searchTerm: 'BIThub' } },
      { id: 'wiki', type: 'semantic', position: { x: 620, y: 155 }, data: { label: 'BITwiki', source: 'wiki', kind: 'memory plane', url: 'https://bitwiki.org', description: 'Durable knowledge, semantic assertions, computed views, and provenance.', searchTerm: 'BITwiki' } },
      { id: 'discussion', type: 'semantic', position: { x: 15, y: 330 }, data: { label: 'Discussions', source: 'hub', kind: 'topics', count: hub.stats?.topics, description: 'Public and permissioned Discourse topics form the main live-work substrate.', searchTerm: 'Community' } },
      { id: 'agents', type: 'semantic', position: { x: 220, y: 330 }, data: { label: 'Agents', source: 'hub', kind: 'registry', count: agents.agents?.length, description: 'Constructs and provider identities exposed by the canonical B8 registry.', searchTerm: 'REGISTRY' } },
      { id: 'workflows', type: 'semantic', position: { x: 115, y: 465 }, data: { label: 'Workflow surfaces', source: 'hub', kind: 'Cores · Nodes · Workspaces', count: workflowCount, description: 'Executable or focused AI work surfaces represented in BIThub.', searchTerm: 'Cores' } },
      { id: 'pages', type: 'semantic', position: { x: 520, y: 330 }, data: { label: 'Knowledge pages', source: 'wiki', kind: 'articles', count: wiki.statistics?.articles, description: 'Durable public knowledge objects in the live MediaWiki runtime.', searchTerm: 'Knowledge' } },
      { id: 'semantic', type: 'semantic', position: { x: 725, y: 330 }, data: { label: 'Semantic graph', source: 'wiki', kind: 'SMW facts', count: semanticStats.propcount, description: `${Number(semanticStats.usedpropcount || 0).toLocaleString()} used properties · ${Number(semanticStats.querycount || 0).toLocaleString()} semantic queries.`, searchTerm: 'Ontology' } },
      { id: 'requests', type: 'semantic', position: { x: 620, y: 465 }, data: { label: 'Research requests', source: 'wiki', kind: requests.source === 'cargo' ? 'Cargo' : 'source queue', count: activeRequests, description: 'Missing or weak knowledge targets moving through the canonical research lifecycle.', searchTerm: 'Requested knowledge' } },
    ];
    const es: Edge[] = [
      { id: 'eco-hub', source: 'ecosystem', target: 'hub', label: 'work', markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'eco-wiki', source: 'ecosystem', target: 'wiki', label: 'memory', markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'hub-wiki', source: 'hub', target: 'wiki', label: 'research → review → crystallize', markerEnd: { type: MarkerType.ArrowClosed }, className: 'spectral-edge', animated: true },
      { id: 'hub-discussion', source: 'hub', target: 'discussion' },
      { id: 'hub-agents', source: 'hub', target: 'agents' },
      { id: 'hub-workflows', source: 'hub', target: 'workflows' },
      { id: 'wiki-pages', source: 'wiki', target: 'pages' },
      { id: 'wiki-semantic', source: 'wiki', target: 'semantic' },
      { id: 'wiki-requests', source: 'wiki', target: 'requests' },
      { id: 'agent-workflow', source: 'agents', target: 'workflows', label: 'execute' },
      { id: 'request-work', source: 'requests', target: 'hub', label: 'opens work', className: 'spectral-edge' },
    ];
    return { nodes: ns, edges: es };
  }, [hub, wiki, agents, requests, semanticStats.propcount, semanticStats.querycount, semanticStats.usedpropcount, activeRequests, workflowCount]);

  const subjectGraph = useMemo(() => {
    if (!subjectTitle) return null;
    const ns: LayerNode[] = [
      { id: 'subject', type: 'semantic', position: { x: 390, y: 25 }, data: { label: subjectTitle, source: 'wiki', kind: 'semantic subject', description: 'Live Semantic MediaWiki subject.' } },
    ];
    const es: Edge[] = [];
    subjectFacts.slice(0, 12).forEach((fact, index) => {
      const side = fact.direction === 'inverse' ? 1 : 0;
      const row = Math.floor(index / 2);
      const value = cleanSmwItem(fact.values[0]?.item || fact.property);
      const id = `fact-${index}`;
      ns.push({ id, type: 'semantic', position: { x: side ? 620 : 150, y: 175 + row * 105 }, data: { label: value, source: 'wiki', kind: fact.property.replace(/_/g, ' '), description: `${fact.direction} relation`, searchTerm: value } });
      es.push({ id: `edge-${id}`, source: fact.direction === 'inverse' ? id : 'subject', target: fact.direction === 'inverse' ? 'subject' : id, label: fact.property.replace(/_/g, ' '), markerEnd: { type: MarkerType.ArrowClosed } });
    });
    return { nodes: ns, edges: es };
  }, [subjectTitle, subjectFacts]);

  const graph = subjectGraph || layerGraph;

  function exploreSelected() {
    const term = selected.searchTerm || selected.label;
    if (!term) return;
    sessionStorage.setItem('bitcoreos-search-seed', term);
    router.push('/explorer');
  }

  return (
    <div className="ontology-workspace graph-secondary">
      <section className="ontology-canvas win-panel raised">
        <div className="panel-heading simple-heading"><div>KNOWLEDGE GRAPH</div><small>{subjectGraph ? `SMW subject // ${subjectTitle}` : 'Explore → Graph · layer schema'}</small></div>
        <form className="graph-subject-search" onSubmit={inspectSubject}>
          {subjectGraph && <button type="button" onClick={() => { setSubjectTitle(''); setSubjectFacts([]); setSelected(layerGraph.nodes[0].data); }}>Layer map</button>}
          <input value={subjectInput} onChange={(event) => setSubjectInput(event.target.value)} placeholder="Inspect BITwiki subject…" />
          <button type="submit">{subjectLoading ? 'Reading…' : 'Relations'}</button>
        </form>
        <div className="graph-canvas sunken">
          <ReactFlow key={subjectTitle || 'layers'} nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.45} maxZoom={1.35} nodesDraggable={false} nodesConnectable={false} onNodeClick={(_, node) => setSelected(node.data as LayerData)} proOptions={{ hideAttribution: true }}>
            <Background gap={26} size={1} />
          </ReactFlow>
        </div>
      </section>

      <aside className="ontology-inspector win-panel raised">
        <div className="mini-title">SELECTED</div>
        <div className={`inspector-source ${selected.source}`}>{selected.source.toUpperCase()} · {selected.kind}</div>
        <h2>{selected.label}</h2>
        <p>{selected.description || 'A navigable layer or relation in the current ecosystem map.'}</p>
        {typeof selected.count === 'number' && <div className="layer-count"><b>{selected.count.toLocaleString()}</b><span>items</span></div>}
        <div className="inspector-actions"><button onClick={exploreSelected}>Explore</button>{selected.url && <a href={selected.url} target="_blank" rel="noreferrer">Source ↗</a>}</div>
        {subjectGraph && <details className="graph-facts"><summary>All relations ({subjectFacts.length})</summary><SemanticFacts facts={subjectFacts} /></details>}
        <div className="graph-note">Ask, Research, and Explore remain the primary work surfaces. This graph explains structure and relations.</div>
      </aside>
    </div>
  );
}
