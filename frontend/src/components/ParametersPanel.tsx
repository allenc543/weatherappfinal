import { useState } from 'react';
import { usePipelineStore } from '../store/pipelineStore';

const PARAM_DESCRIPTIONS: Record<string, Record<string, string>> = {
  data_source: {
    city: "Which city's weather history to train on. Each city has ~6 years of daily data from Open-Meteo. Houston and Dallas are your classic hot-and-humid vs. hot-and-dry comparison; NYC is there because every dataset needs a New York option or people get suspicious.",
    train_ratio: "What fraction of the data to use for training vs. testing. 0.8 means the model learns from the first 80% of days and gets tested on the remaining 20%. Setting this too high is like studying for an exam by memorizing the answer key — you'll ace the practice test and bomb the real one.",
  },
  preprocess: {
    scaler: "How to normalize the features before feeding them to the model. 'Standard' centers everything around zero with unit variance — the statistical equivalent of grading on a curve. 'MinMax' squishes everything to [0,1], which some models prefer. 'None' passes the raw values through, for those who enjoy living dangerously.",
    fill_method: "How to handle missing data points, because weather stations occasionally take days off. 'Interpolate' draws a straight line between known values, which is reasonable since weather doesn't usually teleport. 'Forward fill' just copies the last known value, on the theory that tomorrow's weather is probably similar to today's. 'Mean' replaces gaps with the average, which is the statistical equivalent of shrugging.",
    add_lag_features: "How many previous days of data to include as features. A lag of 3 means each prediction can see the last three days' worth of temperature, precipitation, etc. This is how you tell the model that weather is a time series and not just random numbers. More lags capture longer patterns but add complexity — there's a reason meteorologists don't usually cite conditions from two weeks ago.",
  },
  autoencoder: {
    latent_dim: "The number of dimensions in the autoencoder's compressed representation. Think of it as the model's internal summary of the weather. A latent_dim of 5 means the autoencoder has to compress all your weather features into just 5 numbers, forcing it to learn only the important patterns. Too few and you lose information; too many and you're not really compressing anything, which defeats the purpose of the whole exercise.",
    epochs: "How many times the autoencoder loops through the entire training set. Each epoch is one complete pass. 50 epochs means the model sees every data point 50 times. More epochs generally means better learning, up to a point — eventually the model is just rearranging deck chairs and the loss curve flatlines. If you set this to 200 you're probably just burning electricity for the warm fuzzy feeling of watching a progress bar.",
    learning_rate: "How aggressively the autoencoder updates its weights after each batch. 0.001 is the 'sensible default' that works almost always. Higher values learn faster but risk overshooting the optimal solution — like trying to parallel park at 60 mph. Lower values are more careful but proportionally more tedious.",
    batch_size: "How many samples the model processes before updating its weights. Smaller batches (8-16) give noisier but more frequent updates, like checking your GPS every ten seconds. Larger batches (64-128) give smoother gradients but update less often. 32 is the 'I don't want to think about this' choice, and honestly that's fine.",
  },
  xgboost: {
    n_estimators: "The number of decision trees in the ensemble. XGBoost works by training trees sequentially, where each new tree tries to fix the mistakes of all previous trees. 100 trees is a solid starting point. 500 trees is for when you really want to squeeze out that last 0.1% of accuracy and don't mind waiting. Think of it as hiring more consultants — helpful up to a point, then they start arguing with each other.",
    max_depth: "How deep each decision tree can grow. A depth of 6 means each tree can ask at most 6 yes/no questions before making a prediction. Deeper trees can capture more complex patterns but are also more likely to memorize noise. A depth of 2-3 gives you a simple model that's hard to overfit; a depth of 15 gives you a model with strong opinions about very specific scenarios.",
    learning_rate: "How much each new tree contributes to the ensemble. At 0.1, each tree gets a 10% vote. Lower values mean you need more trees but often get better results — it's the tortoise-and-hare dynamic. At 0.3 you're being aggressive. At 0.01 you're being very patient and probably should increase n_estimators to compensate.",
    subsample: "What fraction of training data each tree gets to see. At 0.8, each tree is trained on a random 80% of the data. This randomness actually helps prevent overfitting — it's counterintuitive, but giving each tree less information makes the ensemble smarter, the same way a jury works better when members don't all read the same newspaper.",
  },
};

export default function ParametersPanel() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const setNodeParam = usePipelineStore((s) => s.setNodeParam);
  const [expandedParam, setExpandedParam] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        Select a node to edit its parameters
      </div>
    );
  }

  const { label, nodeType, params, meta } = selectedNode.data;
  const schema = meta?.parameter_schema || [];
  const descriptions = PARAM_DESCRIPTIONS[nodeType] || {};

  return (
    <div className="p-4 overflow-y-auto h-full">
      <h3 className="text-white font-semibold mb-3 text-sm">{label} Parameters</h3>
      <div className="space-y-3">
        {schema.map((p) => {
          const value = params[p.name] ?? p.default;
          const desc = descriptions[p.name];
          const isExpanded = expandedParam === `${nodeType}.${p.name}`;

          return (
            <div key={p.name}>
              {/* Label with info toggle */}
              <div className="flex items-center gap-1.5 mb-1">
                {p.type === 'slider' ? (
                  <label className="text-xs text-gray-400">
                    {p.name}: <span className="text-white font-mono">{String(value)}</span>
                  </label>
                ) : (
                  <label className="text-xs text-gray-400">{p.name}</label>
                )}
                {desc && (
                  <button
                    onClick={() => setExpandedParam(isExpanded ? null : `${nodeType}.${p.name}`)}
                    className="w-4 h-4 rounded-full text-[10px] font-bold leading-none flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      background: isExpanded ? '#3b82f6' : '#374151',
                      color: isExpanded ? '#fff' : '#9ca3af',
                    }}
                  >
                    ?
                  </button>
                )}
              </div>

              {/* Description */}
              {isExpanded && desc && (
                <p className="text-[11px] text-gray-400 leading-relaxed mb-2 pl-1 border-l-2 border-gray-700 italic">
                  {desc}
                </p>
              )}

              {/* Control */}
              {p.type === 'select' && (
                <select
                  value={String(value)}
                  onChange={(e) => setNodeParam(selectedNode.id, p.name, e.target.value)}
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 border border-gray-600 focus:border-blue-500 outline-none"
                >
                  {(p.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              {p.type === 'slider' && (
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={Number(value)}
                  onChange={(e) => setNodeParam(selectedNode.id, p.name, Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
