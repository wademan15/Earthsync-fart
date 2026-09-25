import React, { useState } from 'react';
import { ChevronDown, Globe, VolumeX, GitBranch, Layers, Anchor, Droplet, Activity, Zap, Dna, Heart } from 'lucide-react';
import { TheKnob } from '../TheKnob';
import { TideMeter, type BreathConfig } from '../designers/BreathDesigner';
import { EntrainmentLayerSelector } from '../designers/EntrainmentLayerSelector';
import { FrequencyPresetGrid } from './FrequencyPresetGrid';
import { CategoryFilterBar } from './CategoryFilterBar';
import { useDropdownClamp } from '../../../hooks/useDropdownClamp';
import {
  TuningTemperament,
  PresetType,
  HarmonicChannel,
  getMerrickColor,
} from '../visuals/shared';
import { EntrainmentLayer } from '../../../services/audio/AudioTypes';
import { getPacerColors } from '../../../services/audio/pacerStyles';
import type { LayoutProfileData } from '../PlanetaryTunerModule';
import type { ExperiencePreset } from '../../../types';

// ============================================================================
// 1. HARMONIC DOCK ITEM
// ============================================================================

export interface HarmonicDockItemProps { 
  label: string; 
  icon: React.ElementType; 
  isActive: boolean; 
  onClick: () => void; 
  onContextMenu?: (e: React.MouseEvent) => void; 
  color?: string; 
}

export const HarmonicDockItem: React.FC<HarmonicDockItemProps> = ({
  label,
  icon: Icon,
  isActive,
  onClick,
  onContextMenu,
  color,
}) => (
  <button 
    onClick={onClick} 
    onContextMenu={onContextMenu} 
    className={`flex flex-col items-center gap-1 shrink-0 p-1 transition-all duration-300 ${isActive ? 'scale-110' : 'hover:scale-105'}`} 
    style={{ minWidth: '0' }}
  >
    <div 
      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${isActive ? 'bg-zinc-950 border-opacity-100 shadow-[0_0_12px_currentColor]' : 'bg-zinc-950 border-white/20 text-slate-500'}`} 
      style={{ color: isActive ? color : undefined, borderColor: isActive ? color : undefined }}
    >
      <Icon size={14} className={isActive ? "animate-pulse" : ""} />
    </div>
    <span 
      className={`text-[7px] font-bold uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px] drop-shadow-md ${isActive ? 'text-white' : 'text-slate-400'}`} 
      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
    >
      {label}
    </span>
  </button>
);

// ============================================================================
// 2. PIANO KEY ITEM
// ============================================================================

export interface PianoKeyItemProps { 
  label: string; 
  isActive: boolean; 
  onClick: () => void; 
  onContextMenu?: (e: React.MouseEvent) => void; 
  color?: string; 
  note?: string; 
  isChordTone?: boolean;
  isUserActive?: boolean;
}

export const PianoKeyItem: React.FC<PianoKeyItemProps> = ({
  label,
  isActive,
  onClick,
  onContextMenu,
  color,
  note,
  isChordTone,
  isUserActive,
}) => { 
  const isBlackKey = note?.includes('#'); 
  const cleanId = `piano-key-${label.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const keyActive = isActive || isUserActive || isChordTone;
  
  return ( 
    <button 
      id={cleanId}
      onClick={onClick} 
      onContextMenu={onContextMenu} 
      title={`${label} (${isUserActive ? 'User Active - Click to mute' : isChordTone ? 'Chord Tone - Click to play manual tone' : 'Muted - Click to play'})`}
      className={`relative flex flex-col items-center justify-end shrink-0 transition-all duration-150 border overflow-hidden ${
        isBlackKey 
          ? 'w-[4.8vw] sm:w-[22px] h-6 z-10 -mx-[2.4vw] sm:-mx-[11px] self-start rounded-b-sm shadow-md' 
          : 'w-[7.5vw] sm:w-[34px] h-10 z-0 rounded-b-md shadow-sm'
      } ${
        keyActive 
          ? 'scale-[1.03] z-20' 
          : isBlackKey 
            ? 'bg-zinc-900 border-white/10 hover:bg-zinc-800' 
            : 'bg-zinc-100 border-zinc-300 hover:bg-white'
      }`} 
      style={{ 
        color: keyActive ? (color || '#38bdf8') : undefined, 
        borderColor: keyActive ? (color || '#38bdf8') : (isBlackKey ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)'), 
        backgroundColor: isUserActive 
          ? (color || '#38bdf8') 
          : isChordTone 
            ? (isBlackKey ? '#27272a' : '#e4e4e7') 
            : (isBlackKey ? '#18181b' : '#f4f4f5'),
        boxShadow: isUserActive 
          ? `0 0 14px ${color || '#38bdf8'}, inset 0 0 8px rgba(255,255,255,0.4)` 
          : isChordTone 
            ? `0 0 10px ${color || '#38bdf8'}` 
            : undefined
      }}
    > 
      {isUserActive && (
        <span 
          className="absolute top-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_6px_#fff]" 
        />
      )}
      {isChordTone && !isUserActive && (
        <span 
          className="absolute top-1 w-1.5 h-1.5 rounded-full border border-white animate-ping"
          style={{ backgroundColor: color || '#38bdf8' }}
        />
      )}
      <span className={`font-bold mb-0.5 tracking-tighter ${
        isUserActive 
          ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-[8px]' 
          : isChordTone 
            ? (isBlackKey ? 'text-white text-[7px]' : 'text-zinc-900 text-[8px]') 
            : isBlackKey 
              ? 'text-[7px] text-zinc-300' 
              : 'text-[8px] text-zinc-800'
      }`}>
        {label}
      </span> 
    </button> 
  ); 
};

// Default dock icons for harmonic overtone channels
const DEFAULT_DOCK_ICONS = [Anchor, Layers, Droplet, Activity, Zap, Dna, Heart];

// ============================================================================
// 3. HARMONIC DOCK (ISOLATED DOCK FOR CHANNELS, PIANO KEYS & KNOB)
// ============================================================================

export interface HarmonicDockProps {
  activeToneArray: PresetType;
  knobFreq: number;
  onKnobFreqChange: (freq: number) => void;
  currentChannels: HarmonicChannel[];
  mutes: Record<string, boolean>;
  chordToneIds?: Set<string>;
  onToggleMute: (id: string) => void;
  onSoloTone: (id: string, allChannels: HarmonicChannel[]) => void;
  musicPitchRef?: React.MutableRefObject<number> | number;
  musicTemperament?: TuningTemperament;
  isProgressionActive?: boolean;
  onMusicPitchChange?: (pitch: number) => void;
  onMusicTemperamentChange?: (temp: TuningTemperament) => void;
  onOpenArchitect?: () => void;
  onOpenMoods?: () => void;
  PianoKeyItem?: React.ComponentType<PianoKeyItemProps>;
  HarmonicDockItem?: React.ComponentType<HarmonicDockItemProps>;
}

export const HarmonicDock: React.FC<HarmonicDockProps> = ({
  activeToneArray,
  knobFreq,
  onKnobFreqChange,
  currentChannels,
  mutes,
  chordToneIds,
  onToggleMute,
  onSoloTone,
  PianoKeyItem: KeyItemComponent = PianoKeyItem,
  HarmonicDockItem: DockItemComponent = HarmonicDockItem,
}) => {
  const isPianoArray = activeToneArray === 'GM_SCALE' || activeToneArray === 'MUSIC_SCALE';

  return (
    <div className="flex items-center justify-center w-full max-w-[100vw] sm:max-w-lg px-2">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      {activeToneArray === 'KNOB' ? (
        <TheKnob
          frequency={knobFreq}
          onChange={onKnobFreqChange}
          isMuted={!!mutes['UNIVERSAL_799']}
          onToggleMute={() => onToggleMute('UNIVERSAL_799')}
        />
      ) : (
        <div
          id="harmonic-dock-scroll"
          className={`flex ${isPianoArray ? 'items-start gap-0' : 'items-center gap-1 sm:gap-3'} overflow-x-auto overflow-y-hidden no-scrollbar px-2 ${isPianoArray ? 'max-w-[92vw] sm:max-w-xl' : 'snap-x snap-mandatory max-w-[90vw] sm:max-w-md'} cursor-grab active:cursor-grabbing`}
          onMouseDown={(e) => {
            const slider = e.currentTarget;
            let isDown = true;
            const startX = e.pageX - slider.offsetLeft;
            const scrollLeft = slider.scrollLeft;
            const onMouseUp = () => {
              isDown = false;
              slider.classList.remove('active');
              window.removeEventListener('mouseup', onMouseUp);
              window.removeEventListener('mousemove', onMouseMove);
            };
            const onMouseMove = (ev: MouseEvent) => {
              if (!isDown) return;
              ev.preventDefault();
              const x = ev.pageX - slider.offsetLeft;
              const walk = (x - startX) * 2;
              slider.scrollLeft = scrollLeft - walk;
            };
            window.addEventListener('mouseup', onMouseUp);
            window.addEventListener('mousemove', onMouseMove);
          }}
        >
          {currentChannels.map((channel, i) => {
            const ChannelIcon = DEFAULT_DOCK_ICONS[i % DEFAULT_DOCK_ICONS.length];
            return (
              <div key={channel.id} className={isPianoArray ? 'shrink-0 flex items-start' : 'snap-center shrink-0'}>
                {isPianoArray ? (
                  <KeyItemComponent
                    label={channel.noteLabel || channel.name}
                    note={channel.noteLabel || 'C'}
                    isActive={!mutes[channel.id] || (chordToneIds ? chordToneIds.has(channel.id) : false)}
                    isChordTone={chordToneIds ? chordToneIds.has(channel.id) : false}
                    isUserActive={!mutes[channel.id]}
                    color={getMerrickColor(channel.freq)}
                    onClick={() => onToggleMute(channel.id)}
                    onContextMenu={(e: React.MouseEvent) => {
                      e.preventDefault();
                      onSoloTone(channel.id, currentChannels);
                    }}
                  />
                ) : (
                  <DockItemComponent
                    label={channel.noteLabel || channel.name.split(' ')[1] || channel.name}
                    icon={ChannelIcon}
                    isActive={!mutes[channel.id]}
                    color={getMerrickColor(channel.freq)}
                    onClick={() => onToggleMute(channel.id)}
                    onContextMenu={(e: React.MouseEvent) => {
                      e.preventDefault();
                      onSoloTone(channel.id, currentChannels);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. TUNER BOTTOM PILL (FLOATING ENTRAINMENT & TONE CONTROLS BAR)
// ============================================================================

export interface TunerBottomPillProps {
  binauralFreq: number;
  isFractalSync: boolean;
  pulseMode: string;
  activeLayers?: EntrainmentLayer[];
  isLayersDropdownOpen?: boolean;
  onToggleLayersDropdown?: () => void;
  onCloseLayersDropdown?: () => void;
  onToggleLayer?: (layer: EntrainmentLayer) => void;
  isConjugatePhase?: boolean;
  onToggleConjugatePhase?: (val: boolean) => void;
  isochronicHardEdge?: boolean;
  onToggleIsochronicHardEdge?: (val: boolean) => void;
  isPACGated?: boolean;
  onTogglePACGated?: (val: boolean) => void;
  activeToneArray: PresetType;
  totalActiveTones: number;
  musicPitchRef?: React.MutableRefObject<number> | number;
  musicTemperament?: TuningTemperament;
  isProgressionActive: boolean;
  isFreqDropdownOpen: boolean;
  isToneArrayDropdownOpen: boolean;
  customBinauralInput: string;
  presets: readonly { id: string; name: string; channels: HarmonicChannel[] }[];
  onToggleFreqDropdown: () => void;
  onCloseFreqDropdown: () => void;
  onToggleToneArrayDropdown: () => void;
  onCloseToneArrayDropdown: () => void;
  onCustomBinauralInputChange: (val: string) => void;
  onApplyCustomBinauralFreq: () => void;
  onSelectEntrainmentMode: (freq: number) => void;
  onTogglePulseMode: () => void;
  onSelectToneArray: (pkgId: PresetType) => void;
  onOpenCustomToneModal: () => void;
  onOpenMusicTuningModal?: () => void;
  onOpenProgressionModal: () => void;
  onOpenExperienceModal?: () => void;
  isExperienceActive?: boolean;
  activeExperienceName?: string;
  onClearAllTones: () => void;
  onToggleFractalSync: () => void;
  getChannelsForPreset: (pkgId: string) => HarmonicChannel[];
  isChannelActive: (channelId: string) => boolean;
}

export const TunerBottomPill: React.FC<TunerBottomPillProps> = ({
  binauralFreq,
  isFractalSync,
  pulseMode,
  activeLayers,
  isLayersDropdownOpen,
  onToggleLayersDropdown,
  onCloseLayersDropdown,
  onToggleLayer,
  isConjugatePhase,
  onToggleConjugatePhase,
  isochronicHardEdge,
  onToggleIsochronicHardEdge,
  isPACGated,
  onTogglePACGated,
  activeToneArray,
  totalActiveTones,
  isProgressionActive,
  isExperienceActive,
  activeExperienceName,
  isFreqDropdownOpen,
  isToneArrayDropdownOpen,
  customBinauralInput,
  presets,
  onToggleFreqDropdown,
  onCloseFreqDropdown,
  onToggleToneArrayDropdown,
  onCloseToneArrayDropdown,
  onCustomBinauralInputChange,
  onApplyCustomBinauralFreq,
  onSelectEntrainmentMode,
  onTogglePulseMode,
  onSelectToneArray,
  onOpenCustomToneModal,
  onOpenProgressionModal,
  onOpenExperienceModal,
  onClearAllTones,
  onToggleFractalSync,
  getChannelsForPreset,
  isChannelActive,
}) => {
  const [internalLayersOpen, setInternalLayersOpen] = useState(false);
  const isLayersOpen = isLayersDropdownOpen !== undefined ? isLayersDropdownOpen : internalLayersOpen;
  const toggleLayersOpen = onToggleLayersDropdown || (() => setInternalLayersOpen(prev => !prev));
  const closeLayersOpen = onCloseLayersDropdown || (() => setInternalLayersOpen(false));
  const layersMenuRef = useDropdownClamp(isLayersOpen);

  const rawLayers = activeLayers !== undefined ? activeLayers : (
    pulseMode === 'ISOCHRONIC' ? ['isochronic'] :
    pulseMode === 'MONAURAL' ? ['monaural'] :
    pulseMode === 'OFF' ? [] :
    ['binaural']
  );
  const resolvedLayers: EntrainmentLayer[] = rawLayers.map(l => (l ? l.toLowerCase() : 'binaural') as EntrainmentLayer);

  const getLayerLabel = () => {
    if (resolvedLayers.length === 0) return 'PURE';
    if (resolvedLayers.length === 1) {
      if (resolvedLayers[0] === 'binaural') return 'BIN';
      if (resolvedLayers[0] === 'isochronic') return 'ISO';
      if (resolvedLayers[0] === 'monaural') return 'MON';
    }
    return `${resolvedLayers.length} LAYERS`;
  };

  const getPillColor = () => {
    if (resolvedLayers.length === 0) return 'text-slate-400 border-white/10 bg-white/5 hover:bg-white/10';
    if (resolvedLayers.length > 1) return 'bg-purple-500/25 text-purple-200 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
    if (resolvedLayers.includes('binaural')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    if (resolvedLayers.includes('isochronic')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (resolvedLayers.includes('monaural')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  };

  return (
    <>
      {/* Brainwave Entrainment Frequency Selector */}
      <FrequencyPresetGrid
        binauralFreq={binauralFreq}
        isFractalSync={isFractalSync}
        isOpen={isFreqDropdownOpen}
        customBinauralInput={customBinauralInput}
        onToggleDropdown={onToggleFreqDropdown}
        onCloseDropdown={onCloseFreqDropdown}
        onCustomInputChange={onCustomBinauralInputChange}
        onApplyCustomFreq={onApplyCustomBinauralFreq}
        onSelectEntrainmentMode={onSelectEntrainmentMode}
      />

      {/* Entrainment Architecture Layer Selector Popover Dropdown */}
      <div className="relative shrink-0 flex items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLayersOpen();
          }}
          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-all border shrink-0 ${getPillColor()}`}
          title="Entrainment Architecture: Layer Binaural, Isochronic & Monaural Beats"
        >
          <Layers size={9} className="shrink-0 opacity-80" />
          <span>{getLayerLabel()}</span>
          <ChevronDown size={8} className="opacity-70 shrink-0" />
        </button>

        {isLayersOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); closeLayersOpen(); }} />
            <div
              ref={layersMenuRef}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col"
            >
              <EntrainmentLayerSelector
                activeLayers={resolvedLayers}
                onToggleLayer={(layer) => {
                  if (onToggleLayer) {
                    onToggleLayer(layer);
                  } else {
                    onTogglePulseMode();
                  }
                }}
                isConjugatePhase={isConjugatePhase}
                onToggleConjugatePhase={onToggleConjugatePhase}
                isochronicHardEdge={isochronicHardEdge}
                onToggleIsochronicHardEdge={onToggleIsochronicHardEdge}
                isPACGated={isPACGated}
                onTogglePACGated={onTogglePACGated}
                variant="popover"
              />
            </div>
          </>
        )}
      </div>

      {/* Tone Array Package Selector Dropdown */}
      <CategoryFilterBar
        activeToneArray={activeToneArray}
        totalActiveTones={totalActiveTones}
        presets={presets}
        isToneArrayDropdownOpen={isToneArrayDropdownOpen}
        isProgressionActive={isProgressionActive}
        isExperienceActive={isExperienceActive}
        activeExperienceName={activeExperienceName}
        onToggleDropdown={onToggleToneArrayDropdown}
        onCloseDropdown={onCloseToneArrayDropdown}
        onSelectToneArray={onSelectToneArray}
        onOpenCustomToneModal={onOpenCustomToneModal}
        onOpenProgressionModal={onOpenProgressionModal}
        onOpenExperienceModal={onOpenExperienceModal}
        onClearAllTones={onClearAllTones}
        getChannelsForPreset={getChannelsForPreset}
        isChannelActive={isChannelActive}
      />

      {totalActiveTones > 0 && (
        <button
          onClick={onClearAllTones}
          className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 border border-rose-500/40 transition-all shrink-0 active:scale-95"
          title="Clear all active tones across all arrays"
        >
          <VolumeX size={10} className="sm:w-[11px] sm:h-[11px]" />
          <span className="hidden sm:inline">Clear</span>
          <span>({totalActiveTones})</span>
        </button>
      )}

      {/* Fractal Sync Toggle */}
      <button
        onClick={onToggleFractalSync}
        className={`p-1 sm:p-1.5 rounded-full transition-colors shrink-0 ${isFractalSync ? 'text-emerald-400 bg-emerald-500/10 animate-pulse' : 'text-slate-600 hover:text-slate-400'}`}
        title={isFractalSync ? 'Fractal Sync: ON' : 'Fractal Sync: OFF'}
      >
        <GitBranch size={12} className="sm:w-[14px] sm:h-[14px]" />
      </button>
    </>
  );
};

// ============================================================================
// 5. TUNER DOCK (COMPOSITE HARMONIC DOCK + FOOTER BREATH TRANSPORT BAR)
// ============================================================================

export interface TunerDockController {
  temporal?: {
    breathConfig?: BreathConfig;
    isBreathActive?: boolean;
    breathStartTime?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface TunerDockProps {
  currentLayout: LayoutProfileData;
  isVisualizerImmersion: boolean;
  activeToneArray: PresetType;
  musicPitchRef: React.MutableRefObject<number> | number;
  musicTemperament: TuningTemperament;
  isProgressionActive: boolean;
  onMusicPitchChange: (pitch: number) => void;
  onMusicTemperamentChange: (temp: TuningTemperament) => void;
  onOpenArchitect: () => void;
  onOpenMoods: () => void;
  knobFreq: number;
  onKnobFreqChange: (freq: number) => void;
  currentChannels: HarmonicChannel[];
  mutes: Record<string, boolean>;
  chordToneIds?: Set<string>;
  onToggleMute: (id: string) => void;
  onSoloTone: (id: string, allChannels: HarmonicChannel[]) => void;
  // Footer / TideMeter props
  controller: TunerDockController;
  uiConfig?: Record<string, unknown>;
  isExperienceActive: boolean;
  activeExperience?: ExperiencePreset | null;
  activeBlockIndex: number;
  blockProgress: number;
  activeSubPhase?: string;
  isMasterPaused: boolean;
  currentBreathPresetName: string;
  onOpenBreathSheet: () => void;
  onOpenHarmonicMenu: () => void;
}

export const TunerDock: React.FC<TunerDockProps> = React.memo(({
  currentLayout,
  isVisualizerImmersion,
  activeToneArray,
  musicPitchRef,
  musicTemperament,
  isProgressionActive,
  onMusicPitchChange,
  onMusicTemperamentChange,
  onOpenArchitect,
  onOpenMoods,
  knobFreq,
  onKnobFreqChange,
  currentChannels,
  mutes,
  chordToneIds,
  onToggleMute,
  onSoloTone,
  controller,
  uiConfig,
  isExperienceActive,
  activeExperience,
  activeBlockIndex,
  blockProgress,
  activeSubPhase,
  isMasterPaused,
  currentBreathPresetName,
  onOpenBreathSheet,
  onOpenHarmonicMenu,
}) => {
  return (
    <>
      {/* Harmonic Channel Strip / Piano Dock */}
      <div 
        className={`absolute left-0 right-0 z-40 pointer-events-auto flex flex-col justify-center items-center pb-2 sm:pb-4 transition-opacity duration-300 ${isVisualizerImmersion ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
        style={{ 
          bottom: `${currentLayout.dock.y}rem`, 
          transform: `translate(${currentLayout.dock.x}rem, 0) translateX(${currentLayout.uiX}rem) scale(${currentLayout.dock.scale})`, 
          opacity: isVisualizerImmersion ? 0 : currentLayout.dock.opacity, 
          pointerEvents: (isVisualizerImmersion || currentLayout.dock.opacity === 0) ? 'none' : 'auto' 
        }}
      >
        <HarmonicDock
          activeToneArray={activeToneArray}
          musicPitchRef={musicPitchRef}
          musicTemperament={musicTemperament}
          isProgressionActive={isProgressionActive}
          onMusicPitchChange={onMusicPitchChange}
          onMusicTemperamentChange={onMusicTemperamentChange}
          onOpenArchitect={onOpenArchitect}
          onOpenMoods={onOpenMoods}
          knobFreq={knobFreq}
          onKnobFreqChange={onKnobFreqChange}
          currentChannels={currentChannels}
          mutes={mutes}
          chordToneIds={chordToneIds}
          onToggleMute={onToggleMute}
          onSoloTone={onSoloTone}
          PianoKeyItem={PianoKeyItem}
          HarmonicDockItem={HarmonicDockItem}
        />
      </div>

      {/* Bottom Meter & Breath Pattern Transport Bar */}
      {!isVisualizerImmersion && (
        <div 
          className="shrink-0 z-50 bg-black border-t border-white/10 flex flex-col pb-safe transition-transform duration-200 w-full" 
          style={{ 
            transform: `translateY(${currentLayout.footerY}px)`, 
            opacity: currentLayout.meter.opacity, 
            pointerEvents: currentLayout.meter.opacity === 0 ? 'none' : 'auto' 
          }}
        >
          <div className="flex justify-between items-center px-4 py-2 border-b border-white/10">
            <div 
              className="flex items-center gap-2 group cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-colors shrink-0" 
              onClick={onOpenBreathSheet}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {isExperienceActive ? "Sequence:" : "Pattern:"}
              </span>
              <span 
                className="text-xs font-bold transition-colors truncate max-w-[120px] sm:max-w-[240px]" 
                style={{ color: getPacerColors(controller?.temporal?.breathConfig?.colorScheme, controller?.temporal?.breathConfig?.customColor).accent }}
              >
                {isExperienceActive 
                  ? `${activeExperience?.name || 'Experience'}: ${activeExperience?.blocks?.[activeBlockIndex]?.label || 'Phase ' + (activeBlockIndex + 1)} (${activeExperience?.blocks?.[activeBlockIndex]?.breathPhase || 'INHALE'})` 
                  : currentBreathPresetName
                }
              </span>
              <ChevronDown 
                size={12} 
                className="group-hover:text-white shrink-0" 
                style={{ color: getPacerColors(controller?.temporal?.breathConfig?.colorScheme, controller?.temporal?.breathConfig?.customColor).accent }} 
              />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-slate-600">
                {isExperienceActive ? `${Math.round(blockProgress * 100)}% PHASE` : "UNIVERSAL MODE"}
              </span>
              <div className="relative">
                <button 
                  onClick={onOpenHarmonicMenu} 
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors group"
                >
                  <Globe size={12} className="text-slate-500 group-hover:text-white" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-cyan-400 text-right min-w-[60px]">
                    PACKAGES
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div className="w-full h-8 relative bg-slate-900 flex justify-center overflow-hidden">
            <div 
              style={{ 
                width: `${currentLayout.meterScale * 100}%`, 
                transform: `translate(${currentLayout.meter.x}rem, ${currentLayout.meter.y}rem) scale(${currentLayout.meter.scale})` 
              }} 
              className="h-full relative origin-bottom"
            >
              <TideMeter 
                config={controller?.temporal?.breathConfig} 
                uiConfig={uiConfig} 
                isActive={controller?.temporal?.isBreathActive || isExperienceActive} 
                isPaused={isMasterPaused}
                startTime={controller?.temporal?.breathStartTime}
                overrideProgress={isExperienceActive ? blockProgress : undefined}
                overridePhase={isExperienceActive ? activeSubPhase : undefined}
                experienceBlocks={isExperienceActive ? activeExperience?.blocks : undefined}
                activeBlockIndex={isExperienceActive ? activeBlockIndex : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

TunerDock.displayName = 'TunerDock';
