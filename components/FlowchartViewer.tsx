import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

import type { FlowchartResponse } from "@/types/flowchart";

interface FlowchartViewerProps {
  data: FlowchartResponse;
}

export function FlowchartViewer({ data }: FlowchartViewerProps) {
  const nodes = useMemo<Node[]>(
    () =>
      data.nodes.map((node, index) => ({
        id: node.id,
        data: {
          label: (
            <div className="space-y-1">
              <p className="text-sm font-semibold">{node.title}</p>
              <p className="text-xs text-white/70">{node.description}</p>
            </div>
          ),
        },
        position: {
          x: (index % 2) * 260,
          y: Math.floor(index / 2) * 140,
        },
        style: {
          borderRadius: 18,
          padding: "12px",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(5,6,15,0.9)",
          color: "white",
          width: 240,
          boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
        },
      })),
    [data.nodes]
  );

  const edges = useMemo<Edge[]>(
    () =>
      data.edges.map((edge, index) => ({
        id: edge.id ?? `${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "step",
        animated: true,
        style: { stroke: "rgba(123,92,255,0.7)" },
        labelBgStyle: {
          fill: "rgba(0,0,0,0.65)",
          fillOpacity: 0.85,
          color: "#fff",
          padding: "4px 8px",
          borderRadius: 999,
        },
      })),
    [data.edges]
  );

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-[32px] border border-white/10 bg-black/30">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background color="rgba(255,255,255,0.07)" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
