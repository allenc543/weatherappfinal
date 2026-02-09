import { usePipelineStore } from '../store/pipelineStore';

export default function ParametersPanel() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const setNodeParam = usePipelineStore((s) => s.setNodeParam);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        Select a node to edit its parameters
      </div>
    );
  }

  const { label, params, meta } = selectedNode.data;
  const schema = meta?.parameter_schema || [];

  return (
    <div className="p-4 overflow-y-auto h-full">
      <h3 className="text-white font-semibold mb-3 text-sm">{label} Parameters</h3>
      <div className="space-y-3">
        {schema.map((p) => {
          const value = params[p.name] ?? p.default;
          if (p.type === 'select') {
            return (
              <div key={p.name}>
                <label className="block text-xs text-gray-400 mb-1">{p.name}</label>
                <select
                  value={String(value)}
                  onChange={(e) => setNodeParam(selectedNode.id, p.name, e.target.value)}
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 border border-gray-600 focus:border-blue-500 outline-none"
                >
                  {(p.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          }
          if (p.type === 'slider') {
            return (
              <div key={p.name}>
                <label className="block text-xs text-gray-400 mb-1">
                  {p.name}: <span className="text-white font-mono">{String(value)}</span>
                </label>
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={Number(value)}
                  onChange={(e) => setNodeParam(selectedNode.id, p.name, Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
