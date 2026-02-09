import { create } from 'zustand';
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
} from '@xyflow/react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type { NodeTypeMeta, PipelineResult } from '../api/client';
import { fetchNodeTypes, runPipeline } from '../api/client';

export interface PipelineNode extends Node {
  data: {
    label: string;
    nodeType: string;
    params: Record<string, unknown>;
    meta?: NodeTypeMeta;
  };
}

interface PipelineState {
  nodes: PipelineNode[];
  edges: Edge[];
  nodeTypes: NodeTypeMeta[];
  selectedNodeId: string | null;
  results: PipelineResult | null;
  isRunning: boolean;
  dataPreviewHeight: number;
  sidePanelWidth: number;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedNode: (id: string | null) => void;
  setNodeParam: (nodeId: string, paramName: string, value: unknown) => void;
  loadNodeTypes: () => Promise<void>;
  run: () => Promise<void>;
  addNode: (type: string, position: { x: number; y: number }) => void;
  setDataPreviewHeight: (h: number) => void;
  setSidePanelWidth: (w: number) => void;
}

let nextId = 10;

const DEFAULT_NODES: PipelineNode[] = [
  {
    id: 'n1',
    type: 'mlNode',
    position: { x: 50, y: 200 },
    data: { label: 'Data Source', nodeType: 'data_source', params: { city: 'houston', train_ratio: 0.8 } },
  },
  {
    id: 'n2',
    type: 'mlNode',
    position: { x: 320, y: 200 },
    data: { label: 'Preprocess', nodeType: 'preprocess', params: { scaler: 'standard', fill_method: 'interpolate', add_lag_features: 3 } },
  },
  {
    id: 'n3',
    type: 'mlNode',
    position: { x: 590, y: 200 },
    data: { label: 'Autoencoder', nodeType: 'autoencoder', params: { latent_dim: 5, epochs: 50, learning_rate: 0.001, batch_size: 32 } },
  },
  {
    id: 'n4',
    type: 'mlNode',
    position: { x: 860, y: 200 },
    data: { label: 'XGBoost', nodeType: 'xgboost', params: { n_estimators: 100, max_depth: 6, learning_rate: 0.1, subsample: 0.8 } },
  },
];

const DEFAULT_EDGES: Edge[] = [
  { id: 'e1-2', source: 'n1', sourceHandle: 'output', target: 'n2', targetHandle: 'input' },
  { id: 'e2-3', source: 'n2', sourceHandle: 'output', target: 'n3', targetHandle: 'input' },
  { id: 'e3-4', source: 'n3', sourceHandle: 'output', target: 'n4', targetHandle: 'input' },
];

export const usePipelineStore = create<PipelineState>((set, get) => ({
  nodes: DEFAULT_NODES,
  edges: DEFAULT_EDGES,
  nodeTypes: [],
  selectedNodeId: null,
  results: null,
  isRunning: false,
  dataPreviewHeight: 25,
  sidePanelWidth: 340,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as PipelineNode[] });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection: Connection) => {
    set({ edges: addEdge(connection, get().edges) });
  },
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setNodeParam: (nodeId, paramName, value) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, params: { ...n.data.params, [paramName]: value } } }
          : n,
      ),
    });
  },
  loadNodeTypes: async () => {
    const types = await fetchNodeTypes();
    // Enrich default nodes with metadata
    set({
      nodeTypes: types,
      nodes: get().nodes.map((n) => {
        const meta = types.find((t) => t.node_type === n.data.nodeType);
        return meta ? { ...n, data: { ...n.data, meta } } : n;
      }),
    });
  },
  run: async () => {
    set({ isRunning: true, results: null });
    try {
      const { nodes, edges } = get();
      const payload = nodes.map((n) => ({
        id: n.id,
        type: n.data.nodeType,
        params: n.data.params,
      }));
      const edgePayload = edges.map((e) => ({
        source: e.source,
        sourceHandle: e.sourceHandle || 'output',
        target: e.target,
        targetHandle: e.targetHandle || 'input',
      }));
      const result = await runPipeline(payload, edgePayload);
      set({ results: result });
    } catch (err) {
      console.error('Pipeline run failed:', err);
    } finally {
      set({ isRunning: false });
    }
  },
  addNode: (type, position) => {
    const meta = get().nodeTypes.find((t) => t.node_type === type);
    if (!meta) return;
    const id = `n${nextId++}`;
    const params: Record<string, unknown> = {};
    meta.parameter_schema.forEach((p) => {
      params[p.name] = p.default;
    });
    const newNode: PipelineNode = {
      id,
      type: 'mlNode',
      position,
      data: { label: meta.display_name, nodeType: type, params, meta },
    };
    set({ nodes: [...get().nodes, newNode] });
  },
  setDataPreviewHeight: (h) => set({ dataPreviewHeight: Math.max(10, Math.min(50, h)) }),
  setSidePanelWidth: (w) => set({ sidePanelWidth: Math.max(280, Math.min(800, w)) }),
}));
