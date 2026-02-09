import { useState } from 'react';
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

const METRIC_DESCRIPTIONS: Record<string, string> = {
  final_train_loss: "The autoencoder's reconstruction error on training data at the end of training. This is an MSE value — how well the model can compress and then recreate the input. Lower is better. If this is still high after many epochs, the model is struggling to find a good compressed representation, which is either a sign you need more latent dimensions or a sign the data is genuinely complicated.",
  test_reconstruction_loss: "Same as train loss, but measured on data the autoencoder never saw during training. This is the one that actually matters. If it's much higher than the train loss, the autoencoder memorized the training data instead of learning general patterns — the neural network equivalent of a student who can recite the textbook but can't answer novel questions.",
  latent_dim: "The dimensionality of the bottleneck layer. This is how many numbers the autoencoder uses to summarize each data point. Reported here so you don't have to scroll back up to remember what you set it to.",
  epochs_trained: "How many complete passes through the training data the autoencoder performed. Again, mostly here for your reference. If the loss curve has clearly flattened, you could have gotten away with fewer.",
  train_rmse: "Root Mean Squared Error on the training set, in the same units as the target variable (degrees). XGBoost's RMSE on training data is usually suspiciously low because gradient boosting is very good at fitting training data — this is the metric's way of saying 'I memorized everything you showed me.' The test RMSE is more informative.",
  test_rmse: "Root Mean Squared Error on held-out test data. This is the headline number — on average, how many degrees off is each prediction? An RMSE of 3.0 means the model's predictions are typically about 3 degrees wrong. Whether that's good depends on your standards; weather forecasters would call it decent for a statistical model, though they'd also note they have radar and satellites.",
  test_mae: "Mean Absolute Error on test data. Like RMSE but without squaring, so it's less punishing of occasional big misses. If MAE is much lower than RMSE, it means the model usually does well but occasionally faceplants spectacularly. If they're similar, the errors are consistent. MAE is what you'd quote if someone asked 'how far off is it, usually?'",
  test_r2: "R-squared, the proportion of variance explained. 1.0 means perfect predictions, 0.0 means the model is no better than just guessing the average every time. 0.85 is quite good for weather prediction from historical data alone — it means the model explains 85% of why temperatures vary from day to day. The remaining 15% is weather being weather.",
};

export default function ResultsPanel() {
  const results = usePipelineStore((s) => s.results);
  const isRunning = usePipelineStore((s) => s.isRunning);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

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
            <div className="space-y-1.5">
              {Object.entries(data.metrics).map(([key, val]) => {
                if (key === 'chart_data' || key === 'loss_curve') return null;
                const desc = METRIC_DESCRIPTIONS[key];
                const isExpanded = expandedMetric === `${nodeId}.${key}`;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 flex items-center gap-1">
                        {key}
                        {desc && (
                          <button
                            onClick={() => setExpandedMetric(isExpanded ? null : `${nodeId}.${key}`)}
                            className="w-3.5 h-3.5 rounded-full text-[9px] font-bold leading-none inline-flex items-center justify-center flex-shrink-0 transition-colors"
                            style={{
                              background: isExpanded ? '#3b82f6' : '#374151',
                              color: isExpanded ? '#fff' : '#9ca3af',
                            }}
                          >
                            ?
                          </button>
                        )}
                      </span>
                      <span className="text-white font-mono">{String(val)}</span>
                    </div>
                    {isExpanded && desc && (
                      <p className="text-[11px] text-gray-400 leading-relaxed mt-1 mb-1 pl-1 border-l-2 border-gray-700 italic">
                        {desc}
                      </p>
                    )}
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
