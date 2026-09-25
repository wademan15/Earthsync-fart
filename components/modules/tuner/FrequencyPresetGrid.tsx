import React from 'react';
import { Brain, ChevronDown } from 'lucide-react';
import { ENTRAINMENT_MODES } from '../visuals/shared';
import { useDropdownClamp } from '../../../hooks/useDropdownClamp';

export interface FrequencyPresetGridProps {
  binauralFreq: number;
  isFractalSync: boolean;
  isOpen: boolean;
  customBinauralInput: string;
  onToggleDropdown: () => void;
  onCloseDropdown: () => void;
  onCustomInputChange: (val: string) => void;
  onApplyCustomFreq: () => void;
  onSelectEntrainmentMode: (freq: number) => void;
}

export const FrequencyPresetGrid: React.FC<FrequencyPresetGridProps> = ({
  binauralFreq,
  isFractalSync,
  isOpen,
  customBinauralInput,
  onToggleDropdown,
  onCloseDropdown,
  onCustomInputChange,
  onApplyCustomFreq,
  onSelectEntrainmentMode,
}) => {
  const menuRef = useDropdownClamp(isOpen && !isFractalSync);

  return (
    <div
      className="relative flex items-center bg-black/40 rounded px-1.5 sm:px-2 py-0.5 cursor-pointer shrink-0"
      onClick={() => !isFractalSync && onToggleDropdown()}
    >
      <Brain size={11} className="text-purple-400 mr-1 sm:mr-1.5 shrink-0" />
      <div className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 text-center w-13 sm:w-16 py-0.5 ${isFractalSync ? 'opacity-50' : ''}`}>
        {(binauralFreq || 8.0).toFixed(2)}Hz
      </div>
      <ChevronDown size={9} className="text-slate-500 ml-0.5 shrink-0" />

      {isOpen && !isFractalSync && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onCloseDropdown(); }} />
          <div
            ref={menuRef}
            className="absolute bottom-full left-0 translate-x-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 w-[calc(100vw-28px)] max-w-60 sm:max-w-64 max-h-[min(55vh,calc(100vh-160px))] bg-slate-950/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col"
          >
            <div className="p-2.5 border-b border-white/10 bg-white/[0.02] shrink-0">
              <div className="text-[8px] font-bold uppercase tracking-widest text-purple-400 mb-1.5 flex items-center justify-between">
                <span>Custom Frequency</span>
                <span className="font-mono text-[9px] text-slate-400">0.1 – 100 Hz</span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onApplyCustomFreq();
                }}
                className="flex items-center gap-1.5"
              >
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1000"
                    value={customBinauralInput}
                    onChange={(e) => onCustomInputChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="e.g. 7.83"
                    className="w-full bg-black/60 border border-purple-500/40 rounded px-2 py-1 text-xs font-mono font-bold text-purple-200 focus:outline-none focus:border-purple-400 text-center"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-mono pointer-events-none">Hz</span>
                </div>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApplyCustomFreq();
                  }}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm shrink-0"
                >
                  Set
                </button>
              </form>
            </div>

            <div className="px-2.5 py-1.5 bg-black/40 border-b border-white/5 flex justify-between items-center shrink-0">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Brainwave Presets</span>
            </div>

            <div className="max-h-44 sm:max-h-48 overflow-y-auto divide-y divide-white/5">
              {ENTRAINMENT_MODES.map((mode) => (
                <div
                  key={mode.name}
                  className={`px-3 py-2 text-[10px] font-mono hover:bg-white/10 flex justify-between items-center transition-colors cursor-pointer ${Math.abs(binauralFreq - mode.freq) < 0.001 ? 'bg-purple-900/30 text-purple-300' : 'text-slate-300'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEntrainmentMode(mode.freq);
                    onCloseDropdown();
                  }}
                >
                  <span className="font-bold">{mode.freq.toFixed(3)} Hz</span>
                  <span className="opacity-70 text-[9px] uppercase tracking-wider">{mode.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
