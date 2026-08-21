'use client';

import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType, type Edge, type Node } from 'reactflow';

type Props = { onSelect?: (label: string) => void };

const baseNodes: Node[] = [
  { id: 'ecosystem', position: { x: 360, y: 20 }, data: { label: 'BIT Ecosystem' }, type: 'input' },
  { id: 'hub', position: { x: 100, y: 140 }, data: { label: 'BIThub' } },
  { id: 'wiki', position: { x: 620, y: 140 }, data: { label: 'BITwiki' } },
  { id: 'community', position: { x: 10, y: 280 }, data: { label: 'Community' } },
  { id: 'constructs', position: { x: 160, y: 280 }, data: { label: 'Constructs' } },
  { id: 'resources', position: { x: 310, y: 280 }, data: { label: 'Resources' } },
  { id: 'concepts', position: { x: 540, y: 280 }, data: { label: 'Concepts' } },
  { id: 'semantic', position: { x: 690, y: 280 }, data: { label: 'Semantic data' } },
  { id: 'history', position: { x: 840, y: 280 }, data: { label: 'History' } },
  { id: 'core', position: { x: 90, y: 420 }, data: { label: 'COREs' } },
  { id: 'nodes', position: { x: 220, y: 420 }, data: { label: 'Nodes' } },
  { id: 'workspaces', position: { x: 350, y: 420 }, data: { label: 'Workspaces' } },
  { id: 'artifacts', position: { x: 500, y: 420 }, data: { label: 'Artifacts' } },
  { id: 'ontology', position: { x: 670, y: 420 }, data: { label: 'Ontology' } },
];

const connect = (source: string, target: string, label?: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  label,
  markerEnd: { type: MarkerType.ArrowClosed },
});

const baseEdges: Edge[] = [
  connect('ecosystem', 'hub', 'work'),
  connect('ecosystem', 'wiki', 'knowledge'),
  connect('hub', 'community'),
  connect('hub', 'constructs'),
  connect('hub', 'resources'),
  connect('constructs', 'core'),
  connect('constructs', 'nodes'),
  connect('constructs', 'workspaces'),
  connect('resources', 'artifacts'),
  connect('wiki', 'concepts'),
  connect('wiki', 'semantic'),
  connect('wiki', 'history'),
  connect('semantic', 'ontology'),
  connect('concepts', 'ontology', 'typed by'),
  connect('artifacts', 'concepts', 'documents'),
  connect('community', 'concepts', 'discusses'),
];

export function OntologyGraph({ onSelect }: Props) {
  const nodes = useMemo(() => baseNodes, []);
  const edges = useMemo(() => baseEdges, []);

  return (
    <div className="graph-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.45}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(_, node) => onSelect?.(String(node.data.label))}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
