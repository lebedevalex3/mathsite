"use client";

import { useMemo } from "react";
import dagre from "dagre";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";

type SkillMapFlowNode = {
  id: string;
  title: string;
  subtitle?: string;
  status?: "ready" | "soon";
  href?: string;
};

type SkillMapFlowEdge = {
  from: string;
  to: string;
};

type SkillMapFlowProps = {
  nodes: SkillMapFlowNode[];
  edges: SkillMapFlowEdge[];
  onNodeClick?: (id: string) => void;
};

type TopicSkillNodeData = SkillMapFlowNode & {
  onNodeClick?: (id: string) => void;
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 70;

function TopicSkillNode({ data }: NodeProps<TopicSkillNodeData>) {
  const router = useRouter();
  const disabled = data.status === "soon";

  const activate = () => {
    if (disabled) return;
    if (data.href) {
      router.push(data.href);
      return;
    }
    data.onNodeClick?.(data.id);
  };

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="!opacity-0 !pointer-events-none" />
      <div
        role={disabled ? undefined : "button"}
        tabIndex={disabled ? -1 : 0}
        onClick={activate}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activate();
          }
        }}
        className={[
          "w-[220px] rounded-xl border bg-white px-3 py-2 shadow-sm transition-all",
          disabled
            ? "cursor-not-allowed border-slate-200 opacity-80"
            : "cursor-pointer border-slate-300 hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300",
        ].join(" ")}
        aria-disabled={disabled || undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5 text-slate-900">{data.title}</p>
            {data.subtitle ? (
              <p className="mt-0.5 text-xs leading-4 text-slate-500">{data.subtitle}</p>
            ) : null}
          </div>
          {disabled ? (
            <span className="shrink-0 rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Скоро
            </span>
          ) : null}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!opacity-0 !pointer-events-none" />
    </div>
  );
}

const nodeTypes = {
  topicSkill: TopicSkillNode,
};

function layoutGraph(
  nodes: SkillMapFlowNode[],
  edges: SkillMapFlowEdge[],
  onNodeClick?: (id: string) => void,
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 28,
    ranksep: 64,
    marginx: 20,
    marginy: 20,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.from, edge.to);
  }

  dagre.layout(g);

  const flowNodes: Node<TopicSkillNodeData>[] = nodes.map((node) => {
    const positioned = g.node(node.id);
    return {
      id: node.id,
      type: "topicSkill",
      position: {
        x: (positioned?.x ?? 0) - NODE_WIDTH / 2,
        y: (positioned?.y ?? 0) - NODE_HEIGHT / 2,
      },
      data: {
        ...node,
        onNodeClick,
      },
      draggable: false,
      selectable: false,
    };
  });

  const flowEdges: Edge[] = edges.map((edge, index) => ({
    id: `edge-${index}-${edge.from}-${edge.to}`,
    source: edge.from,
    target: edge.to,
    type: "smoothstep",
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: "#64748b",
    },
    style: { stroke: "#64748b", strokeWidth: 2 },
  }));

  return { flowNodes, flowEdges };
}

function SkillMapFlowInner({ nodes, edges, onNodeClick }: SkillMapFlowProps) {
  const { flowNodes, flowEdges } = useMemo(
    () => layoutGraph(nodes, edges, onNodeClick),
    [edges, nodes, onNodeClick],
  );

  return (
    <div className="skill-map-flow overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="h-[260px] w-full sm:h-[300px]">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          panOnDrag={false}
          panOnScroll
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} color="#e2e8f0" />
        </ReactFlow>
      </div>
    </div>
  );
}

export function SkillMapFlow(props: SkillMapFlowProps) {
  return (
    <ReactFlowProvider>
      <SkillMapFlowInner {...props} />
    </ReactFlowProvider>
  );
}

export type { SkillMapFlowNode, SkillMapFlowEdge };

