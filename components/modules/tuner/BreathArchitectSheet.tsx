import React from 'react';
import { Wind, X, Sliders, Play, Trash2, Save } from 'lucide-react';
import { 
  DEFAULT_BREATH_PRESETS, 
  PatternPreviewBar, 
  CATEGORY_GRADIENTS, 
  CATEGORY_ICONS, 
  CATEGORY_ACCENT, 
  BreathPreset, 
  BreathDesigner 
} from '../designers/BreathDesigner';

export interface BreathArchitectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  breathSheetTab: 'PRESETS' | 'CUSTOM' | 'DESIGNER';
  onTabChange: (tab: 'PRESETS' | 'CUSTOM' | 'DESIGNER') => void;
  previewPreset: BreathPreset;
  deckPreviewId: string;
  onSelectPreviewPreset: (id: string) => void;
  groupedPresets: Record<string, BreathPreset[]>;
  onActivatePreset: (preset: BreathPreset) => void;
  onDeleteCustomPreset: (id: string, e: React.MouseEvent) => void;
  customInhale: number;
  setCustomInhale: (fn: ((v: number) => number) | number) => void;
  customHoldIn: number;
  setCustomHoldIn: (fn: ((v: number) => number) | number) => void;
  customExhale: number;
  setCustomExhale: (fn: ((v: number) => number) | number) => void;
  customHoldOut: number;
  setCustomHoldOut: (fn: ((v: number) => number) | number) => void;
  customPresetTitle: string;
  setCustomPresetTitle: (title: string) => void;
  onSaveCustomPreset: () => void;
  onApplyCustomPattern: () => void;
  controller: {
    temporal?: {
      breathConfig?: Record<string, unknown>;
      isBreathActive?: boolean;
    };
    [key: string]: unknown;
  };
  uiConfig: Record<string, unknown>;
}

export const BreathArchitectSheet: React.FC<BreathArchitectSheetProps> = ({
  isOpen,
  onClose,
  breathSheetTab,
  onTabChange,
  previewPreset,
  deckPreviewId,
  onSelectPreviewPreset,
  groupedPresets,
  onActivatePreset,
  onDeleteCustomPreset,
  customInhale,
  setCustomInhale,
  customHoldIn,
  setCustomHoldIn,
  customExhale,
  setCustomExhale,
  customHoldOut,
  setCustomHoldOut,
  customPresetTitle,
  setCustomPresetTitle,
  onSaveCustomPreset,
  onApplyCustomPattern,
  controller,
  uiConfig
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col animate-in fade-in duration-200 pointer-events-auto">
      <div className="flex-1 flex flex-col max-w-lg w-full mx-auto bg-slate-950 border-x border-white/10 shadow-2xl relative overflow-hidden my-auto sm:my-6 rounded-none sm:rounded-2xl max-h-[100vh] sm:max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <Wind size={18} className="text-cyan-400" />
            <span className="text-sm font-bold tracking-wide text-white uppercase">Breath Architect</span>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center p-1 bg-black/60 rounded-lg border border-white/10">
            <button
              onClick={() => onTabChange('PRESETS')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${breathSheetTab === 'PRESETS' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Presets
            </button>
            <button
              onClick={() => onTabChange('CUSTOM')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${breathSheetTab === 'CUSTOM' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Timing
            </button>
            <button
              onClick={() => onTabChange('DESIGNER')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${breathSheetTab === 'DESIGNER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Sound & Pacer
            </button>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            title="Close Breath Architect"
            aria-label="Close Breath Architect"
          >
            <X size={18} />
          </button>
        </div>

        {breathSheetTab === 'PRESETS' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={`p-5 shrink-0 relative bg-gradient-to-b ${CATEGORY_GRADIENTS[previewPreset.category as keyof typeof CATEGORY_GRADIENTS]}`}>
              <div className="flex justify-center mb-3">
                <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${CATEGORY_ACCENT[previewPreset.category as keyof typeof CATEGORY_ACCENT]}`}>
                  {CATEGORY_ICONS[previewPreset.category as keyof typeof CATEGORY_ICONS]} {previewPreset.category}
                </span>
              </div>
              <h2 className="text-xl font-light text-center text-white mb-1.5 tracking-wide">{previewPreset.name}</h2>
              <p className="text-xs text-center text-slate-300 leading-relaxed mb-3 px-2 font-medium">{previewPreset.description}</p>
              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                {previewPreset.benefits.map((b, i) => (
                  <span key={i} className="text-[9px] font-bold uppercase tracking-wide bg-black/30 text-slate-200 px-2 py-0.5 rounded border border-white/10">{b}</span>
                ))}
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-[9px] font-mono text-slate-400 px-1 mb-1">
                  <span>IN: {previewPreset.config.inhale}s</span>
                  <span>HOLD: {previewPreset.config.holdIn}s</span>
                  <span>OUT: {previewPreset.config.exhale}s</span>
                  <span>WAIT: {previewPreset.config.holdOut}s</span>
                </div>
                <PatternPreviewBar config={previewPreset.config} />
              </div>
              <button 
                onClick={() => onActivatePreset(previewPreset)} 
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-xs rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Play size={14} fill="currentColor" /> Activate Breath
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-900/50 p-4 space-y-4">
              {Object.entries(groupedPresets).map(([cat, items]) => (
                items.length > 0 && (
                  <div key={cat} className="space-y-1.5">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2 border-l-2 border-white/10 ml-1">{cat}</div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {items.map(p => { 
                        const isPreview = deckPreviewId === p.id; 
                        return (
                          <div 
                            key={p.id} 
                            onClick={() => onSelectPreviewPreset(p.id)} 
                            onDoubleClick={() => onActivatePreset(p)} 
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all duration-200 flex items-center justify-between group ${isPreview ? `bg-white/10 border-white/30` : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                          >
                            <div className="flex flex-col">
                              <span className={`text-xs font-bold transition-colors ${isPreview ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{p.name}</span>
                              <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-400">{p.config.inhale}s - {p.config.holdIn}s - {p.config.exhale}s - {p.config.holdOut}s</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isPreview ? (
                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_currentColor]" />
                              ) : (
                                !DEFAULT_BREATH_PRESETS.some(dp => dp.id === p.id) && (
                                  <button 
                                    onClick={(e) => onDeleteCustomPreset(p.id, e)} 
                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    title="Delete Preset"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ); 
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        ) : breathSheetTab === 'CUSTOM' ? (
          /* Custom Pattern Designer */
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-900/40">
            <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Sliders size={14} /> Interval Durations (Seconds)
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  Total: {(customInhale + customHoldIn + customExhale + customHoldOut).toFixed(1)}s ({(60 / Math.max(0.1, customInhale + customHoldIn + customExhale + customHoldOut)).toFixed(1)} BPM)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Inhale */}
                <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20 space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-cyan-300 block">Inhale</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCustomInhale(v => Math.max(0.5, Number((v - 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-mono font-bold flex items-center justify-center text-xs">-</button>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="30"
                      value={customInhale}
                      onChange={(e) => setCustomInhale(Math.max(0.1, parseFloat(e.target.value) || 0))}
                      className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-center font-mono text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button onClick={() => setCustomInhale(v => Math.min(30, Number((v + 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-mono font-bold flex items-center justify-center text-xs">+</button>
                  </div>
                </div>

                {/* Hold In */}
                <div className="p-3 rounded-lg bg-black/40 border border-amber-500/20 space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-amber-300 block">Hold In</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCustomHoldIn(v => Math.max(0, Number((v - 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-mono font-bold flex items-center justify-center text-xs">-</button>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={customHoldIn}
                      onChange={(e) => setCustomHoldIn(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-center font-mono text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                    <button onClick={() => setCustomHoldIn(v => Math.min(30, Number((v + 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-mono font-bold flex items-center justify-center text-xs">+</button>
                  </div>
                </div>

                {/* Exhale */}
                <div className="p-3 rounded-lg bg-black/40 border border-blue-500/20 space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-blue-300 block">Exhale</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCustomExhale(v => Math.max(0.5, Number((v - 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-mono font-bold flex items-center justify-center text-xs">-</button>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="30"
                      value={customExhale}
                      onChange={(e) => setCustomExhale(Math.max(0.1, parseFloat(e.target.value) || 0))}
                      className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-center font-mono text-sm font-bold text-white focus:outline-none focus:border-blue-400"
                    />
                    <button onClick={() => setCustomExhale(v => Math.min(30, Number((v + 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-mono font-bold flex items-center justify-center text-xs">+</button>
                  </div>
                </div>

                {/* Hold Out */}
                <div className="p-3 rounded-lg bg-black/40 border border-purple-500/20 space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-purple-300 block">Hold Out</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCustomHoldOut(v => Math.max(0, Number((v - 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-mono font-bold flex items-center justify-center text-xs">-</button>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={customHoldOut}
                      onChange={(e) => setCustomHoldOut(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-center font-mono text-sm font-bold text-white focus:outline-none focus:border-purple-400"
                    />
                    <button onClick={() => setCustomHoldOut(v => Math.min(30, Number((v + 0.5).toFixed(1))))} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-mono font-bold flex items-center justify-center text-xs">+</button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Live Visual Preview</span>
                <PatternPreviewBar config={{ inhale: customInhale, holdIn: customHoldIn, exhale: customExhale, holdOut: customHoldOut }} />
              </div>

              <button
                onClick={onApplyCustomPattern}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-widest text-xs rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <Play size={14} fill="currentColor" /> Apply Custom Pattern Now
              </button>
            </div>

            {/* Save Preset Section */}
            <div className="bg-slate-950/60 border border-white/10 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Save size={14} className="text-emerald-400" /> Save As Preset
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Preset Name (e.g. My 4-7-8 Breath)"
                  value={customPresetTitle}
                  onChange={(e) => setCustomPresetTitle(e.target.value)}
                  className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={onSaveCustomPreset}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm shrink-0"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Full Breath Designer & Sound Architect */
          <div className="flex-1 overflow-y-auto bg-slate-950/95 p-3 sm:p-4">
            <BreathDesigner
              temporal={controller.temporal}
              audioSys={controller.audioSys}
              uiConfig={uiConfig}
              bpm={controller.audio.bpm}
            />
          </div>
        )}
      </div>
    </div>
  );
};
