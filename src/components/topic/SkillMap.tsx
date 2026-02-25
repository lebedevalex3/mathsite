import type { TopicMapEdge, TopicMapNode } from "@/src/lib/topicMaps";

type SkillMapProps = {
  nodes: TopicMapNode[];
  edges: TopicMapEdge[];
};

type PositionedNode = TopicMapNode & {
  layer: number;
  row: number;
  x: number;
  y: number;
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;
const LAYER_GAP = 72;
const ROW_GAP = 28;
const PADDING_X = 24;
const PADDING_Y = 24;

function buildLayers(nodes: TopicMapNode[], edges: TopicMapEdge[]) {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const edge of edges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }

  const queue = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0).map((n) => n.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    order.push(current);
    for (const next of outgoing.get(current) ?? []) {
      const left = (incoming.get(next) ?? 0) - 1;
      incoming.set(next, left);
      if (left === 0) queue.push(next);
    }
  }

  if (order.length !== nodes.length) {
    // Fallback for invalid graph/cycle: keep declared order.
    return nodes.map((node, index) => ({ id: node.id, layer: index }));
  }

  const layerById = new Map<string, number>();
  for (const nodeId of order) {
    const incomingSources = edges.filter((edge) => edge.target === nodeId).map((edge) => edge.source);
    const layer =
      incomingSources.length === 0
        ? 0
        : Math.max(...incomingSources.map((source) => layerById.get(source) ?? 0)) + 1;
    layerById.set(nodeId, layer);
  }

  return nodes.map((node) => ({ id: node.id, layer: layerById.get(node.id) ?? 0 }));
}

function layoutNodes(nodes: TopicMapNode[], edges: TopicMapEdge[]): PositionedNode[] {
  const layered = buildLayers(nodes, edges);
  const layerMap = new Map(layered.map((item) => [item.id, item.layer]));
  const byLayer = new Map<number, TopicMapNode[]>();

  for (const node of nodes) {
    const layer = layerMap.get(node.id) ?? 0;
    byLayer.set(layer, [...(byLayer.get(layer) ?? []), node]);
  }

  const layers = [...byLayer.keys()].sort((a, b) => a - b);
  const positioned: PositionedNode[] = [];

  for (const layer of layers) {
    const layerNodes = byLayer.get(layer) ?? [];
    layerNodes.forEach((node, row) => {
      positioned.push({
        ...node,
        layer,
        row,
        x: PADDING_X + layer * (NODE_WIDTH + LAYER_GAP),
        y: PADDING_Y + row * (NODE_HEIGHT + ROW_GAP),
      });
    });
  }

  return positioned;
}

function edgePath(from: PositionedNode, to: PositionedNode) {
  const x1 = from.x + NODE_WIDTH;
  const y1 = from.y + NODE_HEIGHT / 2;
  const x2 = to.x;
  const y2 = to.y + NODE_HEIGHT / 2;
  const dx = Math.max(24, (x2 - x1) / 2);

  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export function SkillMap({ nodes, edges }: SkillMapProps) {
  const positioned = layoutNodes(nodes, edges);
  const byId = new Map(positioned.map((node) => [node.id, node]));
  const maxLayer = positioned.length > 0 ? Math.max(...positioned.map((node) => node.layer)) : 0;
  const maxRow = positioned.length > 0 ? Math.max(...positioned.map((node) => node.row)) : 0;

  const width = PADDING_X * 2 + (maxLayer + 1) * NODE_WIDTH + maxLayer * LAYER_GAP;
  const height = PADDING_Y * 2 + (maxRow + 1) * NODE_HEIGHT + maxRow * ROW_GAP;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
      {/* If we need an interactive map later, replace this SVG with React Flow. */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[520px]"
        role="img"
        aria-label="Схема навыков темы"
      >
        <defs>
          <marker
            id="skill-map-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
          <filter id="skill-map-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#94a3b8" floodOpacity="0.15" />
          </filter>
        </defs>

        {edges.map((edge) => {
          const source = byId.get(edge.source);
          const target = byId.get(edge.target);
          if (!source || !target) return null;
          return (
            <path
              key={edge.id}
              d={edgePath(source, target)}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              markerEnd="url(#skill-map-arrow)"
            />
          );
        })}

        {positioned.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`} filter="url(#skill-map-shadow)">
            <rect
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx="12"
              ry="12"
              fill="#ffffff"
              stroke="#cbd5e1"
            />
            <foreignObject x="10" y="8" width={NODE_WIDTH - 20} height={NODE_HEIGHT - 16}>
              <div className="flex h-full items-center justify-center text-center text-xs font-medium leading-4 text-slate-800">
                {node.title}
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  );
}

