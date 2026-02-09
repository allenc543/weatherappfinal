import { usePipelineStore } from '../store/pipelineStore';

const CATEGORY_COLORS: Record<string, string> = {
  data: '#3b82f6',
  preprocess: '#8b5cf6',
  model: '#f59e0b',
};

export default function NodePalette() {
  const nodeTypes = usePipelineStore((s) => s.nodeTypes);
  const addNode = usePipelineStore((s) => s.addNode);

  const onDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {nodeTypes.map((nt) => (
        <div
          key={nt.node_type}
          draggable
          onDragStart={(e) => onDragStart(e, nt.node_type)}
          onClick={() => addNode(nt.node_type, { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 })}
          className="px-3 py-1.5 rounded text-white text-xs font-medium cursor-grab active:cursor-grabbing select-none hover:brightness-110 transition-all"
          style={{ background: CATEGORY_COLORS[nt.category] || '#6b7280' }}
        >
          + {nt.display_name}
        </div>
      ))}
    </div>
  );
}
