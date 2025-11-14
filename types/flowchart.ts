export interface FlowchartNode {
  id: string;
  title: string;
  description: string;
  category?: string;
}

export interface FlowchartEdge {
  id?: string;
  source: string;
  target: string;
  label?: string;
}

export interface FlowchartResponse {
  summary: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}
