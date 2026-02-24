import React from 'react';
import { PipelineConfig } from '../types';
import { X, Save, Sliders } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PipelineConfig;
  onSave: (newConfig: PipelineConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = React.useState<PipelineConfig>(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e1e1e] border border-surfaceHighlight rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surfaceHighlight bg-[#252526]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white">Pipeline Configuration</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Drift Threshold (P-Value)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                value={localConfig.driftThreshold}
                onChange={(e) => setLocalConfig({ ...localConfig, driftThreshold: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="w-12 text-right text-sm font-mono text-primary">{localConfig.driftThreshold.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted">Lower values make the drift detector more sensitive (e.g., 0.05 means 5% significance level).</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Max Accuracy Drop Allowed</label>
             <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                value={localConfig.accuracyThreshold}
                onChange={(e) => setLocalConfig({ ...localConfig, accuracyThreshold: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="w-12 text-right text-sm font-mono text-purple-400">{(localConfig.accuracyThreshold * 100).toFixed(0)}%</span>
            </div>
            <p className="text-xs text-muted">Retrain if model accuracy drops by more than this percentage compared to baseline.</p>
          </div>

           <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Max Retraining Attempts</label>
             <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="10"
                value={localConfig.maxRetrainingAttempts}
                onChange={(e) => setLocalConfig({ ...localConfig, maxRetrainingAttempts: parseInt(e.target.value) })}
                className="flex-1 bg-black/20 border border-surfaceHighlight rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
            <p className="text-xs text-muted">Limit automatic retraining loops to prevent resource exhaustion.</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-surfaceHighlight bg-[#252526] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(localConfig); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;