import React, { useState, useMemo } from 'react';
import { Music, VolumeX, Wind, Layers, Sparkles, SlidersHorizontal, Volume2, X, Palette, Check, Info } from 'lucide-react';
import { Fader } from '../ui/Faders';
import { 
  COLOR_WHEEL_PRESETS, 
  COLOR_WHEEL_ORDER, 
  COLOR_WHEEL_CATEGORIES, 
  CHROMATIC_NOTE_NAMES, 
  HarmonicColorWheelId, 
  ColorWheelCategory 
} from '../../data/colorWheels';
import { getActiveColorWheelId, setActiveColorWheelId } from '../../services/kinematics/color';
import { UIConfig } from '../../types';

interface SoundDesignMenuProps {
  isOpen: boolean;
  onClose: () => void;
  entrainmentMode: 'SYNCED' | 'DRONE' | 'SILENT';
  onSetEntrainmentMode: (mode: 'SYNCED' | 'DRONE' | 'SILENT') => void;
  isPerfectFifth: boolean;
  isPerfectFifthBreathSync: boolean;
  onTogglePerfectFifth: (active: boolean) => void;
  onSetPerfectFifthSync: (isBreathSync: boolean) => void;
  toneTimbre: string;
  onSetToneTimbre: (timbre: 'SINE' | 'ANALOG' | 'TRIANGLE' | 'WARM_PAD') => void;
  harmonicMasterVolume: number;
  onHarmonicMasterVolumeChange: (vol: number) => void;
  uiConfig?: UIConfig;
  activeColorWheel?: HarmonicColorWheelId;
  onSelectColorWheel?: (id: HarmonicColorWheelId) => void;
}

export const SoundDesignMenu: React.FC<SoundDesignMenuProps> = ({
  isOpen,
  onClose,
  entrainmentMode,
  onSetEntrainmentMode,
  isPerfectFifth,
  isPerfectFifthBreathSync,
  onTogglePerfectFifth,
  onSetPerfectFifthSync,
  toneTimbre,
  onSetToneTimbre,
  harmonicMasterVolume,
  onHarmonicMasterVolumeChange,
  uiConfig,
  activeColorWheel,
  onSelectColorWheel,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ColorWheelCategory>('ALL');
  const [showInspector, setShowInspector] = useState(true);

  const filteredWheels = useMemo(() => {
    if (selectedCategory === 'ALL') return COLOR_WHEEL_ORDER;
    return COLOR_WHEEL_ORDER.filter((id) => COLOR_WHEEL_PRESETS[id]?.category === selectedCategory);
  }, [selectedCategory]);

  if (!isOpen) return null;

  const currentColorWheelId = activeColorWheel || getActiveColorWheelId();
  const currentPreset = COLOR_WHEEL_PRESETS[currentColorWheelId] || COLOR_WHEEL_PRESETS.MERRICK;

  const handleWheelSelect = (id: HarmonicColorWheelId) => {
    setActiveColorWheelId(id);
    if (onSelectColorWheel) onSelectColorWheel(id);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="fixed sm:absolute top-14 sm:top-full left-1/2 sm:left-auto sm:right-0 -translate-x-1/2 sm:translate-x-0 sm:mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 max-h-[calc(100dvh-14rem)] sm:max-h-[min(640px,calc(100dvh-16rem))] overflow-y-auto bg-slate-950/95 backdrop-blur-2xl border border-purple-500/40 rounded-2xl sm:rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-[80] p-3 sm:p-3.5 pb-4 animate-in fade-in zoom-in-95 duration-150 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
            <Music size={12} /> Tones & Harmonics
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                entrainmentMode === 'SYNCED'
                  ? 'border-amber-500/40 text-amber-300 bg-amber-950/40'
                  : entrainmentMode === 'DRONE'
                  ? 'border-purple-500/40 text-purple-300 bg-purple-950/40'
                  : 'border-slate-600 text-slate-400 bg-slate-900/40'
              }`}
            >
              {entrainmentMode}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Menu"
              aria-label="Close Menu"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Entrainment Mode Buttons */}
        <div className="space-y-1.5">
          <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Playback Mode</span>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => onSetEntrainmentMode('SILENT')}
              className={`p-1.5 rounded flex flex-col items-center gap-1 border transition-all text-[8px] font-bold uppercase tracking-wider ${
                entrainmentMode === 'SILENT'
                  ? 'bg-slate-800 text-white border-slate-500 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
              }`}
            >
              <VolumeX size={12} className="text-slate-400" />
              <span>Silent</span>
            </button>
            <button
              onClick={() => onSetEntrainmentMode('SYNCED')}
              className={`p-1.5 rounded flex flex-col items-center gap-1 border transition-all text-[8px] font-bold uppercase tracking-wider ${
                entrainmentMode === 'SYNCED'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
              }`}
            >
              <Wind size={12} className="text-amber-400" />
              <span>Synced</span>
            </button>
            <button
              onClick={() => onSetEntrainmentMode('DRONE')}
              className={`p-1.5 rounded flex flex-col items-center gap-1 border transition-all text-[8px] font-bold uppercase tracking-wider ${
                entrainmentMode === 'DRONE'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
              }`}
            >
              <Layers size={12} className="text-purple-400" />
              <span>Drone</span>
            </button>
          </div>
        </div>

        {/* Harmonic Fifth Section */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={11} className="text-amber-400" />
              <span className="text-[8px] uppercase tracking-wider font-bold text-slate-300">Harmonic Fifth (3:2 Overtone)</span>
            </div>
            <button
              onClick={() => onTogglePerfectFifth(!isPerfectFifth)}
              className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border transition-all ${
                isPerfectFifth
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                  : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
              }`}
            >
              {isPerfectFifth ? 'ON' : 'OFF'}
            </button>
          </div>

          {isPerfectFifth && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-lg border border-white/5">
              <button
                onClick={() => onSetPerfectFifthSync(true)}
                className={`py-1 px-1.5 rounded text-[8px] font-medium transition-all ${
                  isPerfectFifthBreathSync
                    ? 'bg-amber-500/30 text-amber-200 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Breath Glide
              </button>
              <button
                onClick={() => onSetPerfectFifthSync(false)}
                className={`py-1 px-1.5 rounded text-[8px] font-medium transition-all ${
                  !isPerfectFifthBreathSync
                    ? 'bg-amber-500/30 text-amber-200 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Static (3:2)
              </button>
            </div>
          )}
        </div>

        {/* Tone Timbre & Synth Tone Exploration */}
        <div className="pt-2 border-t border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
              <SlidersHorizontal size={10} className="text-purple-400" /> Timbre & Synth Tone
            </span>
            <span className="text-[8px] font-mono text-purple-400 font-bold">
              {toneTimbre || 'SINE'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[
              { id: 'SINE' as const, name: 'Pure Sine', desc: 'Sinusoidal' },
              { id: 'ANALOG' as const, name: 'Warm Analog', desc: 'Harmonic Warmth' },
              { id: 'TRIANGLE' as const, name: 'Soft Triangle', desc: 'Mellow Texture' },
              { id: 'WARM_PAD' as const, name: 'Harmonic Pad', desc: 'Spacious Texture' },
            ].map((timbre) => {
              const isSelected = (toneTimbre || 'SINE') === timbre.id;
              return (
                <button
                  key={timbre.id}
                  onClick={() => onSetToneTimbre(timbre.id)}
                  className={`p-1.5 rounded text-left transition-all border text-[8px] ${
                    isSelected
                      ? 'bg-purple-500/25 text-purple-200 border-purple-400/60 shadow-xs'
                      : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
                  }`}
                >
                  <span className="font-bold block text-[9px] truncate">{timbre.name}</span>
                  <span className="text-[7px] text-slate-500 block truncate">{timbre.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tone Volume Slider */}
        <div className="pt-2 border-t border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
              <Volume2 size={10} className="text-purple-400" /> Tones Master Volume
            </span>
            <span className="text-[9px] font-mono text-purple-400 font-bold">
              {Math.round(harmonicMasterVolume * 100)}%
            </span>
          </div>
          <div className="w-full">
            <Fader
              value={harmonicMasterVolume}
              min={0}
              max={1}
              step={0.02}
              onChange={onHarmonicMasterVolumeChange}
              color="#a855f7"
              uiConfig={uiConfig}
            />
          </div>
        </div>

        {/* Harmonic Color Wheel Selector (Designer Grade) */}
        <div className="pt-2.5 border-t border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-300 flex items-center gap-1.5">
              <Palette size={11} className="text-pink-400" /> Harmonic Color Wheel
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowInspector(!showInspector)}
                className="text-[7px] text-slate-400 hover:text-pink-300 flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                title="Toggle chromatic spectrum inspector"
              >
                <Info size={9} /> {showInspector ? 'Hide Spectrum' : 'Inspect'}
              </button>
              <span className="text-[8px] font-mono text-pink-400 font-bold px-1.5 py-0.5 rounded bg-pink-500/10 border border-pink-500/20">
                {currentPreset.name}
              </span>
            </div>
          </div>

          {/* Active Preset Inspector Card */}
          {showInspector && (
            <div className="p-2 rounded-lg bg-black/40 border border-pink-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold text-white flex items-center gap-1.5">
                    {currentPreset.name}
                    <span className="text-[7px] px-1.5 py-0.2 rounded bg-white/10 text-pink-300 font-mono">
                      {currentPreset.category}
                    </span>
                  </div>
                  <div className="text-[7px] text-slate-400">{currentPreset.subtitle}</div>
                </div>
                <div className="flex items-center gap-1">
                  {currentPreset.tags.map((tag) => (
                    <span key={tag} className="text-[6.5px] px-1 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Continuous Gradient Ribbon */}
              <div 
                className="h-2 w-full rounded shadow-inner border border-white/10"
                style={{
                  background: `linear-gradient(to right, ${currentPreset.colors.join(', ')}, ${currentPreset.colors[0]})`
                }}
              />

              {/* 12 Chromatic Pitch Class Semitone Swatches */}
              <div className="grid grid-cols-12 gap-0.5 pt-0.5">
                {currentPreset.colors.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5 group relative">
                    <div 
                      className="w-full h-3 rounded-xs border border-black/40 shadow-xs transition-transform group-hover:scale-125"
                      style={{ backgroundColor: c }}
                      title={`${CHROMATIC_NOTE_NAMES[i]}: ${c}`}
                    />
                    <span className="text-[6px] font-mono text-slate-400 group-hover:text-white group-hover:font-bold">
                      {CHROMATIC_NOTE_NAMES[i]}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[7.5px] text-slate-400 leading-snug pt-0.5">
                {currentPreset.description}
              </p>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {COLOR_WHEEL_CATEGORIES.map((cat) => {
              const isCatActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-full text-[7.5px] font-medium tracking-wider uppercase shrink-0 transition-all border ${
                    isCatActive
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-xs'
                      : 'bg-white/5 text-slate-500 hover:text-slate-300 border-transparent hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Color Wheel Cards Grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5 max-h-48 overflow-y-auto pr-0.5 scrollbar-thin">
            {filteredWheels.map((wheelId) => {
              const preset = COLOR_WHEEL_PRESETS[wheelId];
              if (!preset) return null;
              const isSelected = currentColorWheelId === wheelId;
              return (
                <button
                  key={wheelId}
                  type="button"
                  onClick={() => handleWheelSelect(wheelId)}
                  className={`p-1.5 rounded-lg text-left transition-all border text-[8px] flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-pink-500/20 text-white border-pink-400/80 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                      : 'bg-white/5 text-slate-400 hover:text-white border-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`font-bold block truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {preset.name}
                    </span>
                    {isSelected ? (
                      <Check size={10} className="text-pink-400 shrink-0" />
                    ) : (
                      <span className="text-[6.5px] font-mono text-slate-500 px-1 py-0.2 rounded bg-white/5">
                        {preset.category.slice(0, 3)}
                      </span>
                    )}
                  </div>
                  <div className="flex h-1.5 w-full rounded overflow-hidden border border-white/10">
                    {preset.colors.map((c, i) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[7px] text-slate-500 block truncate">
                    {preset.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
