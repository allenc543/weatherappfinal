import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { usePipelineStore } from '../store/pipelineStore';

const CATEGORY_COLORS: Record<string, string> = {
  data: '#3b82f6',
  preprocess: '#8b5cf6',
  model: '#f59e0b',
};

export default function BaseMLNode({ id, data, selected }: NodeProps) {
  const setSelectedNode = usePipelineStore((s) => s.setSelectedNode);
  const results = usePipelineStore((s) => s.results);
  const nodeData = data as {
    label: string;
    nodeType: string;
    params: Record<string, unknown>;
    meta?: { category: string; input_ports: { name: string }[]; output_ports: { name: string }[] };
  };

  const category = nodeData.meta?.category || 'data';
  const color = CATEGORY_COLORS[category] || '#6b7280';
  const hasMetrics = results?.results?.[id]?.metrics;

  return (
    <div
      onClick={() => setSelectedNode(id)}
      className="relative rounded-lg shadow-lg border-2 cursor-pointer min-w-[160px]"
      style={{
        borderColor: selected ? '#fff' : color,
        background: '#1e1e2e',
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-1.5 rounded-t-md text-white text-xs font-semibold tracking-wide"
        style={{ background: color }}
      >
        {nodeData.label}
      </div>

      {/* Body */}
      <div className="px-3 py-2 text-[11px] text-gray-300">
        {Object.entries(nodeData.params).slice(0, 3).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <span className="text-gray-500">{k}</span>
            <span className="font-mono">{String(v)}</span>
          </div>
        ))}
        {hasMetrics && (
          <div className="mt-1 pt-1 border-t border-gray-700 text-green-400 text-[10px]">
            ✓ Results ready
          </div>
        )}
      </div>

      {/* Input handles */}
      {(nodeData.meta?.input_ports || []).map((port, i) => (
        <Handle
          key={`in-${port.name}`}
          type="target"
          position={Position.Left}
          id={port.name}
          style={{
            top: `${30 + i * 20}px`,
            background: '#94a3b8',
            width: 10,
            height: 10,
            border: '2px solid #1e1e2e',
          }}
        />
      ))}

      {/* Output handles */}
      {(nodeData.meta?.output_ports || []).map((port, i) => (
        <Handle
          key={`out-${port.name}`}
          type="source"
          position={Position.Right}
          id={port.name}
          style={{
            top: `${30 + i * 20}px`,
            background: '#22d3ee',
            width: 10,
            height: 10,
            border: '2px solid #1e1e2e',
          }}
        />
      ))}
    </div>
  );
}
