import React from 'react';
import { ChevronDown, SlidersHorizontal, Sparkles, Radio, Music, Edit3, Check, VolumeX } from 'lucide-react';
import { PresetType, HarmonicChannel } from '../visuals/shared';
import { useDropdownClamp } from '../../../hooks/useDropdownClamp';

export interface CategoryFilterBarProps {
  activeToneArray: PresetType;
  totalActiveTones: number;
  presets: readonly { id: string; name: string; channels: HarmonicChannel[] }[];
  isToneArrayDropdownOpen: boolean;
  isProgressionActive: boolean;
  isExperienceActive?: boolean;
  activeExperienceName?: string;
  onToggleDropdown: () => void;
  onCloseDropdown: () => void;
  onSelectToneArray: (pkgId: PresetType) => void;
  onOpenCustomToneModal: () => void;
  onOpenProgressionModal: () => void;
  onOpenExperienceModal?: () => void;
  onClearAllTones: () => void;
  getChannelsForPreset: (pkgId: string) => HarmonicChannel[];
  isChannelActive: (channelId: string) => boolean;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  activeToneArray,
  totalActiveTones,
  presets,
  isToneArrayDropdownOpen,
  isProgressionActive,
  isExperienceActive,
  activeExperienceName,
  onToggleDropdown,
  onCloseDropdown,
  onSelectToneArray,
  onOpenCustomToneModal,
  onOpenProgressionModal,
  onOpenExperienceModal,
  onClearAllTones,
  getChannelsForPreset,
  isChannelActive,
}) => {
  const menuRef = useDropdownClamp(isToneArrayDropdownOpen);

  return (
    <div className="relative shrink-0 flex items-center gap-0.5">
      <button
        onClick={onToggleDropdown}
        className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hover:bg-white/10 transition-all border whitespace-nowrap ${totalActiveTones > 0 ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]' : 'border-white/10 text-slate-300'}`}
      >
        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider max-w-[85px] sm:max-w-none truncate">
          {activeToneArray === 'CUSTOM' ? 'CUSTOM' : (activeToneArray === 'KNOB' ? 'THE KNOB' : (presets.find(p => p.id === activeToneArray)?.name || 'UNIVERSAL'))}
        </span>
        {totalActiveTones > 0 && (
          <span className="px-1 sm:px-1.5 py-0.2 text-[7px] sm:text-[8px] font-mono font-bold rounded-full bg-cyan-400 text-black leading-tight">
            {totalActiveTones}
          </span>
        )}
        <ChevronDown size={9} className="text-slate-400 shrink-0" />
      </button>

      {activeToneArray === 'CUSTOM' && (
        <button
          onClick={onOpenCustomToneModal}
          className="p-1 sm:p-1.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-colors"
          title="Edit Custom Tone Frequencies"
        >
          <SlidersHorizontal size={10} />
        </button>
      )}

      {activeToneArray === 'MUSIC_SCALE' && (
        <button
          onClick={onOpenProgressionModal}
          className={`p-1 sm:p-1.5 rounded transition-all border flex items-center gap-1 ${isProgressionActive ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-slate-400 hover:text-white border-white/10'}`}
          title="Musical Mode & Chord Progression Engine"
        >
          <Sparkles size={10} className={isProgressionActive ? 'text-amber-400 animate-pulse' : ''} />
          <span className="text-[8px] font-bold uppercase tracking-wider hidden sm:inline">{isProgressionActive ? 'Chords' : 'Moods'}</span>
        </button>
      )}

      {/* Experience Designer shortcut on pill when active */}
      {isExperienceActive && onOpenExperienceModal && (
        <button
          onClick={onOpenExperienceModal}
          className="p-1 sm:p-1.5 rounded transition-all border flex items-center gap-1 bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse"
          title="Open Experience Designer & Sequences"
        >
          <Sparkles size={10} className="text-amber-400" />
          <span className="text-[8px] font-bold uppercase tracking-wider hidden sm:inline">Designer</span>
        </button>
      )}

      {isToneArrayDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onCloseDropdown} />
          <div
            ref={menuRef}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[85vw] sm:w-68 max-w-[300px] max-h-[min(55vh,calc(100vh-160px))] bg-slate-950/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 flex flex-col"
          >
            <div className="px-3 py-2 border-b border-white/10 flex justify-between items-center bg-white/[0.03] shrink-0">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Tone Arrays</span>
              {totalActiveTones > 0 ? (
                <span className="text-[9px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                  {totalActiveTones} Active
                </span>
              ) : (
                <span className="text-[8px] font-mono text-slate-600">All Silent</span>
              )}
            </div>

            <div className="max-h-52 sm:max-h-60 overflow-y-auto py-1 divide-y divide-white/5">
              {presets.map(pkg => {
                const channels = getChannelsForPreset(pkg.id);
                const activeCount = channels.filter(ch => isChannelActive(ch.id)).length;
                const isCurrentSelected = activeToneArray === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors group cursor-pointer ${isCurrentSelected ? 'text-cyan-300 bg-cyan-500/15' : 'text-slate-300'}`}
                    onClick={() => {
                      onSelectToneArray(pkg.id as PresetType);
                      onCloseDropdown();
                    }}
                  >
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      {pkg.id === 'KNOB' ? <Radio size={11} className="text-cyan-400 shrink-0" /> : (pkg.id === 'MUSIC_SCALE' ? <Music size={11} className="text-cyan-400 shrink-0" /> : null)}
                      <span className="truncate">{pkg.name}</span>
                      {activeCount > 0 && (
                        <span className="shrink-0 px-1.5 py-0.2 text-[7px] sm:text-[8px] font-mono font-bold rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse">
                          {activeCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {pkg.id === 'MUSIC_SCALE' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectToneArray('MUSIC_SCALE');
                            onCloseDropdown();
                            onOpenProgressionModal();
                          }}
                          className="px-1.5 py-0.5 rounded bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 text-[8px] uppercase tracking-wider flex items-center gap-1 border border-amber-500/30 transition-colors"
                          title="Open Moods & Progression Engine"
                        >
                          <Sparkles size={9} className="text-amber-400" />
                          Moods
                        </button>
                      )}
                      {pkg.id === 'CUSTOM' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectToneArray('CUSTOM');
                            onCloseDropdown();
                            onOpenCustomToneModal();
                          }}
                          className="px-1.5 py-0.5 rounded bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-200 text-[8px] uppercase tracking-wider flex items-center gap-1"
                        >
                          <Edit3 size={9} />
                          Edit
                        </button>
                      )}
                      {isCurrentSelected && <Check size={12} className="text-cyan-400 shrink-0" />}
                    </div>
                  </div>
                );
              })}

              {/* Experience Designer Entry (just like Musical Keyboard & Custom) */}
              <div
                className={`w-full flex items-center justify-between px-3 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors group cursor-pointer border-t border-amber-500/20 ${isExperienceActive ? 'text-amber-300 bg-amber-500/15' : 'text-slate-300 hover:text-amber-200'}`}
                onClick={() => {
                  onOpenExperienceModal?.();
                  onCloseDropdown();
                }}
              >
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <Sparkles size={11} className={`shrink-0 ${isExperienceActive ? 'text-amber-400 animate-pulse' : 'text-amber-400'}`} />
                  <span className="truncate">Experience Designer</span>
                  {isExperienceActive && (
                    <span className="shrink-0 px-1.5 py-0.2 text-[7px] sm:text-[8px] font-mono font-bold rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse">
                      {activeExperienceName || 'Active'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenExperienceModal?.();
                      onCloseDropdown();
                    }}
                    className="px-1.5 py-0.5 rounded bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 text-[8px] uppercase tracking-wider flex items-center gap-1 border border-amber-500/30 transition-colors"
                    title="Open Experience Designer & Acoustic-Breath Sequences"
                  >
                    <Sparkles size={9} className="text-amber-400" />
                    Designer
                  </button>
                  {isExperienceActive && <Check size={12} className="text-amber-400 shrink-0" />}
                </div>
              </div>
            </div>

            {totalActiveTones > 0 && (
              <div className="p-1.5 bg-black/60 border-t border-white/10">
                <button
                  onClick={() => {
                    onClearAllTones();
                    onCloseDropdown();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 hover:border-rose-500/70 transition-all shadow-sm active:scale-[0.98]"
                >
                  <VolumeX size={12} />
                  Clear All Tones ({totalActiveTones})
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
