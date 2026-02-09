import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export interface NodeTypeMeta {
  node_type: string;
  display_name: string;
  category: string;
  input_ports: { name: string; datatype: string }[];
  output_ports: { name: string; datatype: string }[];
  parameter_schema: ParamDef[];
}

export interface ParamDef {
  name: string;
  type: 'slider' | 'select';
  default: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface PipelineResult {
  status: string;
  results: Record<string, {
    node_type?: string;
    metrics?: Record<string, unknown>;
    preview?: Record<string, unknown>;
  }>;
}

export async function fetchNodeTypes(): Promise<NodeTypeMeta[]> {
  const resp = await api.get('/node-types');
  return resp.data.node_types;
}

export async function fetchCities(): Promise<string[]> {
  const resp = await api.get('/data/cities');
  return resp.data.cities;
}

export async function runPipeline(
  nodes: { id: string; type: string; params: Record<string, unknown> }[],
  edges: { source: string; sourceHandle: string; target: string; targetHandle: string }[],
  targetNode?: string,
): Promise<PipelineResult> {
  const resp = await api.post('/pipeline/run', {
    nodes,
    edges,
    target_node: targetNode ?? null,
  });
  return resp.data;
}
