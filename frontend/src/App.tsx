import { useEffect } from 'react';
import { usePipelineStore } from './store/pipelineStore';
import PipelineCanvas from './components/PipelineCanvas';
import ParametersPanel from './components/ParametersPanel';
import ResultsPanel from './components/ResultsPanel';
import NodePalette from './components/NodePalette';
import DataPreviewPanel from './components/DataPreviewPanel';

export default function App() {
  const loadNodeTypes = usePipelineStore((s) => s.loadNodeTypes);
  const run = usePipelineStore((s) => s.run);
  const isRunning = usePipelineStore((s) => s.isRunning);
  const dataPreviewHeight = usePipelineStore((s) => s.dataPreviewHeight);

  useEffect(() => {
    loadNodeTypes();
  }, [loadNodeTypes]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold tracking-wide text-blue-400">
            Weather ML Pipeline
          </h1>
          <NodePalette />
        </div>
        <button
          onClick={run}
          disabled={isRunning}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isRunning ? 'Running...' : 'Run Pipeline'}
        </button>
      </div>

      {/* Main content: left canvas + right panels */}
      <div className="flex flex-1 overflow-hidden" style={{ height: `calc(${100 - dataPreviewHeight}vh - 48px)` }}>
        {/* Left: Pipeline Canvas */}
        <div className="flex-1 min-w-0">
          <PipelineCanvas />
        </div>

        {/* Right: Parameters + Results */}
        <div className="w-80 flex-shrink-0 border-l border-gray-800 flex flex-col">
          <div className="flex-1 border-b border-gray-800 overflow-hidden">
            <ParametersPanel />
          </div>
          <div className="flex-1 overflow-hidden">
            <ResultsPanel />
          </div>
        </div>
      </div>

      {/* Bottom: Data Preview */}
      <DataPreviewPanel />
    </div>
  );
}
