import { useCallback, useRef, useState, useEffect } from 'react';
import { usePipelineStore } from '../store/pipelineStore';

export default function DataPreviewPanel() {
  const results = usePipelineStore((s) => s.results);
  const dataPreviewHeight = usePipelineStore((s) => s.dataPreviewHeight);
  const setDataPreviewHeight = usePipelineStore((s) => s.setDataPreviewHeight);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Find data source node preview with sample data
  const previewData = results
    ? Object.values(results.results || {}).find(
        (r) => r.node_type === 'data_source' && r.preview?.sample,
      )?.preview
    : null;

  const sample = (previewData?.sample as Record<string, unknown>[]) || [];
  const columns = (previewData?.columns as string[]) || [];

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      const vh = window.innerHeight;
      const newPct = ((vh - e.clientY) / vh) * 100;
      setDataPreviewHeight(Math.round(newPct));
    };
    const onMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, setDataPreviewHeight]);

  return (
    <div
      ref={panelRef}
      className="bg-gray-900 border-t border-gray-700 flex flex-col"
      style={{ height: `${dataPreviewHeight}vh` }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="h-1.5 bg-gray-700 hover:bg-blue-500 cursor-ns-resize flex-shrink-0 transition-colors"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-800 flex-shrink-0">
        <span className="text-xs font-semibold text-gray-400">Data Preview</span>
        {previewData && (
          <span className="text-[10px] text-gray-500">
            {previewData.rows as number} rows | {(previewData.columns as string[]).length} columns
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {sample.length === 0 ? (
          <div className="p-4 text-gray-500 text-xs">
            Run the pipeline to preview data
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-800">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-1.5 text-left text-gray-400 font-medium whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sample.map((row, i) => (
                <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/50">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-1 text-gray-300 font-mono whitespace-nowrap">
                      {row[col] != null ? String(row[col]) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
