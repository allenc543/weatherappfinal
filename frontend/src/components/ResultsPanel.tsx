import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { usePipelineStore } from '../store/pipelineStore';

export default function ResultsPanel() {
  const results = usePipelineStore((s) => s.results);
  const isRunning = usePipelineStore((s) => s.isRunning);

  if (isRunning) {
    return (
      <div className="p-4 text-blue-400 text-sm flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        Running pipeline...
      </div>
    );
  }

  if (!results) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        Run the pipeline to see results
      </div>
    );
  }

  const nodeResults = Object.entries(results.results || {});

  return (
    <div className="p-4 overflow-y-auto h-full space-y-4">
      <h3 className="text-white font-semibold text-sm">Results</h3>
      {nodeResults.map(([nodeId, data]) => (
        <div key={nodeId} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <h4 className="text-xs font-semibold text-gray-300 mb-2">
            {nodeId} — {data.node_type ?? ''}
          </h4>

          {/* Metrics */}
          {!!data.metrics && (
            <div className="space-y-1">
              {Object.entries(data.metrics).map(([key, val]) => {
                if (key === 'chart_data' || key === 'loss_curve') return null;
                return (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-400">{key}</span>
                    <span className="text-white font-mono">{String(val)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* XGBoost prediction chart */}
          {!!data.metrics?.chart_data && (
            <div className="mt-3" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.metrics.chart_data as Record<string, unknown>[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="actual" stroke="#3b82f6" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="predicted" stroke="#f59e0b" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Autoencoder loss curve */}
          {!!data.metrics?.loss_curve && (
            <div className="mt-3" style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={(data.metrics.loss_curve as number[]).map((v, i) => ({ epoch: i, loss: v }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="epoch" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="loss" stroke="#8b5cf6" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data preview */}
          {!!data.preview && (
            <div className="mt-2 text-xs text-gray-400 space-y-0.5">
              {Object.entries(data.preview).map(([k, v]) => {
                if (k === 'sample') return null;
                return (
                  <div key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span className="text-white font-mono">
                      {Array.isArray(v) ? v.join(', ') : String(v)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
