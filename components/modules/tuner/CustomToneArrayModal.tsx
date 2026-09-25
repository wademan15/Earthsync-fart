import React from 'react';
import { SlidersHorizontal, X, Plus, RotateCcw, Check, VolumeX, Activity, Trash2 } from 'lucide-react';
import { HarmonicChannel, getMerrickColor } from '../visuals/shared';

export interface CustomToneArrayModalProps {
  isOpen: boolean;
  onClose: () => void;
  customChannels: HarmonicChannel[];
  mutes: Record<string, boolean>;
  onUpdateChannel: (index: number, key: 'freq' | 'name' | 'noteLabel', value: string | number) => void;
  onToggleMute: (channelId: string) => void;
  onRemoveChannel: (index: number) => void;
  onAddChannel: () => void;
  onResetToDefault: () => void;
  onActivateCustomArray: () => void;
}

export const CustomToneArrayModal: React.FC<CustomToneArrayModalProps> = ({
  isOpen,
  onClose,
  customChannels,
  mutes,
  onUpdateChannel,
  onToggleMute,
  onRemoveChannel,
  onAddChannel,
  onResetToDefault,
  onActivateCustomArray
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col animate-in fade-in duration-200 pointer-events-auto">
      <div className="flex-1 flex flex-col max-w-lg w-full mx-auto bg-slate-950 border-x border-white/10 shadow-2xl relative overflow-hidden my-auto sm:my-6 rounded-none sm:rounded-2xl max-h-[100vh] sm:max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold tracking-wide text-white uppercase">Custom Tone Array</h2>
              <span className="text-[10px] text-slate-400">Add or tune any custom frequencies in real time</span>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            title="Close Custom Tone Modal"
            aria-label="Close Custom Tone Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tone List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-900/30">
          {customChannels.map((channel, idx) => {
            const isMuted = mutes[channel.id] ?? false;
            const toneColor = getMerrickColor(channel.freq);
            return (
              <div 
                key={channel.id} 
                className={`p-3 rounded-xl border transition-all flex items-center gap-3 bg-black/40 ${isMuted ? 'border-white/5 opacity-60' : 'border-white/15'}`}
              >
                {/* Tone Index & Color Indicator */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-slate-500 w-4">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                  <div 
                    className="w-3.5 h-3.5 rounded-full shadow-md"
                    style={{ 
                      backgroundColor: toneColor, 
                      boxShadow: isMuted ? 'none' : `0 0 10px ${toneColor}` 
                    }} 
                  />
                </div>

                {/* Frequency Input */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="20000"
                        value={channel.freq}
                        onChange={(e) => onUpdateChannel(idx, 'freq', e.target.value)}
                        className="w-full bg-black/70 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400 text-left"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 pointer-events-none">Hz</span>
                    </div>

                    {/* Label Input */}
                    <input
                      type="text"
                      value={channel.noteLabel || channel.name}
                      onChange={(e) => onUpdateChannel(idx, 'noteLabel', e.target.value)}
                      placeholder="Label"
                      className="w-24 bg-black/70 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Mute Button */}
                <button
                  onClick={() => onToggleMute(channel.id)}
                  className={`p-1.5 rounded-lg border transition-colors shrink-0 ${!isMuted ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm' : 'bg-white/5 text-slate-500 border-white/5 hover:text-white'}`}
                  title={isMuted ? "Unmute Tone" : "Mute Tone"}
                >
                  {isMuted ? <VolumeX size={14} /> : <Activity size={14} />}
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => onRemoveChannel(idx)}
                  disabled={customChannels.length <= 1}
                  className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none shrink-0"
                  title="Delete Tone"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-white/10 bg-slate-950 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onAddChannel}
              disabled={customChannels.length >= 16}
              className="flex-1 py-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Plus size={14} /> Add Tone ({customChannels.length}/16)
            </button>
            <button
              onClick={onResetToDefault}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              title="Reset to Solfeggio Frequencies"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          <button
            onClick={onActivateCustomArray}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-widest text-xs rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Check size={15} /> Activate Custom Array
          </button>
        </div>
      </div>
    </div>
  );
};
