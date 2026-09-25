import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ErrorBoundary } from '../../system/ErrorBoundary';
import { VisualizerCanvas } from '../VisualizerCanvas';
import { ImmersionExperienceOverlay } from './ImmersionExperienceOverlay';
import { TuningControlsDeck } from './TuningControlsDeck';
import { TunerDock, TunerBottomPill } from './TunerDock';
import { getChannelsForPreset } from './tunerChannels';
import { SystemMonitor } from '../visuals/SystemMonitor';
import { ToastNotification } from './ToastNotification';
import { HarmonicColorWheelId } from '../../../data/colorWheels';
import {
  PRESETS,
  HarmonicChannel,
  TuningTemperament,
  PresetType
} from '../visuals/shared';
import { EntrainmentLayer, resolveActiveLayers } from '../../../services/audio/AudioTypes';
import type { LayoutProfileData } from '../PlanetaryTunerModule';
import type { ExperiencePreset, SensorMode } from '../../../types';
import type { usePlanetaryController } from '../../../hooks/usePlanetaryController';
import type { usePlanetaryExperience } from './hooks/usePlanetaryExperience';
import type { usePlanetaryProgression } from './hooks/usePlanetaryProgression';
import type { usePlanetaryCustomTones } from './hooks/usePlanetaryCustomTones';
import type { usePlanetaryBreathPresets } from './hooks/usePlanetaryBreathPresets';

export interface TunerPhysicsEngine {
  latticeConfig?: Record<string, unknown>;
  setLatticeConfig: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
  activePhysicsMode?: string;
  activePhysicsPresetId?: string;
  physicsLibrary?: Array<{ id: string; mode: string; name: string; modulations?: Record<string, unknown> }>;
  setMode?: (mode: string) => Record<string, unknown>;
  loadPreset?: (id: string) => { modulations?: Record<string, unknown> } | undefined;
  [key: string]: unknown;
}

export interface TunerVisualizerStageProps {
  controller: ReturnType<typeof usePlanetaryController>;
  physicsEngine: TunerPhysicsEngine | null;
  isPowered?: boolean;
  isMasterPaused: boolean;
  sensorMode: SensorMode | null;
  currentLayout: LayoutProfileData;
  uiConfig: {
    appBgColor?: string;
    textColor?: string;
    primaryColor?: string;
    borderRgb?: string;
    borderOpacity?: number;
    [key: string]: unknown;
  };
  bpm?: number;

  // Immersion & Experience HUD
  isVisualizerImmersion: boolean;
  isImmersionHudVisible: boolean;
  toggleVisualizerImmersion: (forced?: boolean) => void;
  isExperienceActive?: boolean;
  isExperiencePaused?: boolean;
  activeExperience?: ExperiencePreset | null;
  activeBlockIndex?: number;
  blockProgress?: number;
  currentExpCycle?: number;
  handleTogglePlayExperience?: (exp?: ExperiencePreset) => void;
  handleMasterStop?: () => void;
  onOpenExperienceModal?: () => void;

  // Lens Swiping & Tap
  onSwipeLens: (dir: 'PREV' | 'NEXT') => void;
  onCenterTap: () => void;

  // Progression & Tuning
  isProgressionActive?: boolean;
  currentProgressionObj?: {
    id?: string;
    name?: string;
    mood?: string;
    chords?: Array<{ name?: string; root?: string; [key: string]: unknown }>;
    [key: string]: unknown;
  } | null;
  currentChordIndex?: number;
  currentChordScaleIds?: Set<string>;
  musicPitchRef?: React.MutableRefObject<number>;
  musicTemperament?: TuningTemperament;
  onMusicPitchChange?: (pitch: number) => void;
  onMusicTemperamentChange?: (temp: TuningTemperament) => void;
  onOpenMusicTuningModal: () => void;
  onOpenProgressionModal: () => void;
  onOpenExperienceModal?: () => void;

  // Tone Array & Entrainment
  activeToneArray: PresetType;
  setActiveToneArray: (pkgId: PresetType) => void;
  knobFreq: number;
  onKnobFreqChange: (freq: number) => void;
  customChannels?: HarmonicChannel[];
  musicScaleChannels?: HarmonicChannel[];
  dockMutes?: Record<string, boolean>;
  totalActiveTones?: number;
  clearAllTones?: () => void;
  customBinauralInput?: string;
  setCustomBinauralInput?: (val: string) => void;
  applyCustomBinauralFreq?: (freq?: number) => void;
  onOpenCustomToneModal: () => void;
  onOpenBreathSheet?: () => void;
  onOpenHarmonicMenu: () => void;
  currentBreathPresetName?: string;
  activeSubPhase?: string;

  // Hook bundles
  experience?: ReturnType<typeof usePlanetaryExperience>;
  progression?: ReturnType<typeof usePlanetaryProgression>;
  customTones?: ReturnType<typeof usePlanetaryCustomTones>;
  breath?: ReturnType<typeof usePlanetaryBreathPresets>;

  // Color Wheel
  activeColorWheelId: HarmonicColorWheelId;
  onSelectColorWheel: (id: HarmonicColorWheelId) => void;

  // Toast & Monitor
  toast: { message: string; visible: boolean };
  onShowToast: (message: string, durationMs?: number) => void;
  showSystemMonitor: boolean;
  setShowSystemMonitor: (show: boolean) => void;
}

export const TunerVisualizerStage: React.FC<TunerVisualizerStageProps> = React.memo((props) => {
  const {
    controller,
    physicsEngine,
    isPowered = false,
    sensorMode,
    currentLayout,
    uiConfig,
    bpm = 60,
    isVisualizerImmersion,
    isImmersionHudVisible,
    toggleVisualizerImmersion,
    onSwipeLens,
    onCenterTap,
    activeToneArray,
    setActiveToneArray,
    knobFreq,
    onKnobFreqChange,
    onOpenMusicTuningModal,
    onOpenProgressionModal,
    onOpenCustomToneModal,
    onOpenHarmonicMenu,
    activeColorWheelId,
    onSelectColorWheel,
    toast,
    onShowToast,
    showSystemMonitor,
    setShowSystemMonitor,
    experience,
    progression,
    customTones,
    breath,
  } = props;

  const isMasterPaused = props.isMasterPaused ?? experience?.isMasterPaused ?? false;
  const isExperienceActive = props.isExperienceActive ?? experience?.isExperienceActive ?? false;
  const isExperiencePaused = props.isExperiencePaused ?? experience?.isExperiencePaused ?? false;
  const activeExperience = props.activeExperience !== undefined ? props.activeExperience : (experience?.activeExperience ?? null);
  const activeBlockIndex = props.activeBlockIndex ?? experience?.activeBlockIndex ?? 0;
  const blockProgress = props.blockProgress ?? experience?.blockProgress ?? 0;
  const currentExpCycle = props.currentExpCycle ?? experience?.currentExpCycle ?? 1;
  const handleTogglePlayExperience = props.handleTogglePlayExperience ?? experience?.handleTogglePlayExperience;
  const handleMasterStop = props.handleMasterStop ?? experience?.handleMasterStop;
  const onOpenExperienceModal = props.onOpenExperienceModal ?? (() => experience?.setIsExperienceModalOpen(true));
  const activeSubPhase = props.activeSubPhase ?? experience?.activeSubPhase;

  const isProgressionActive = props.isProgressionActive ?? progression?.isProgressionActive ?? false;
  const currentProgressionObj = props.currentProgressionObj !== undefined ? props.currentProgressionObj : (progression?.currentProgressionObj ?? null);
  const currentChordIndex = props.currentChordIndex ?? progression?.currentChordIndex ?? 0;
  const currentChordScaleIds = props.currentChordScaleIds ?? progression?.currentChordScaleIds;
  const musicPitchRef = props.musicPitchRef ?? progression?.musicPitchRef;
  const musicTemperament = props.musicTemperament ?? progression?.musicTemperament;
  const onMusicPitchChange = props.onMusicPitchChange ?? progression?.handleMusicPitchChange;
  const onMusicTemperamentChange = props.onMusicTemperamentChange ?? progression?.handleMusicTemperamentChange;
  const musicScaleChannels = props.musicScaleChannels ?? progression?.musicScaleChannels ?? [];

  const customChannels = props.customChannels ?? customTones?.customChannels ?? [];
  const dockMutes = props.dockMutes ?? customTones?.dockMutes ?? {};
  const totalActiveTones = props.totalActiveTones ?? customTones?.totalActiveTones ?? 0;
  const clearAllTones = props.clearAllTones ?? customTones?.clearAllTones;
  const customBinauralInput = props.customBinauralInput ?? customTones?.customBinauralInput ?? '';
  const setCustomBinauralInput = props.setCustomBinauralInput ?? customTones?.setCustomBinauralInput;
  const applyCustomBinauralFreq = props.applyCustomBinauralFreq ?? customTones?.applyCustomBinauralFreq;

  const currentBreathPresetName = props.currentBreathPresetName ?? breath?.getCurrentBreathPresetName?.() ?? 'Resonance';
  const onOpenBreathSheet = props.onOpenBreathSheet ?? (() => {
    toggleVisualizerImmersion(false);
    breath?.setShowBreathSheet(true);
    breath?.setDeckPreviewId(controller?.activePresetId || 'resonance');
  });
  const [isLayersDropdownOpen, setIsLayersDropdownOpen] = useState(false);
  const [isFreqDropdownOpen, setIsFreqDropdownOpen] = useState(false);
  const [isToneArrayDropdownOpen, setIsToneArrayDropdownOpen] = useState(false);

  return (
    <div className="flex-1 relative min-h-0 flex flex-col w-full max-w-full">
      <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
        {/* Visualizer Engine Canvas */}
        {physicsEngine && (
          <ErrorBoundary moduleName="Visualizer Engine">
            <VisualizerCanvas 
              audioEnabled={controller.audioSys.audioEnabled}
              isPowered={isPowered}
              updateAudio={controller.audioSys.updateAudio}
              triggerHeartPulse={controller.audioSys.triggerHeartPulse}
              toggleAudio={controller.toggleAudio}
              loopDataRef={controller.loopDataRef}
              onSwipeLeft={() => onSwipeLens('NEXT')}
              onSwipeRight={() => onSwipeLens('PREV')}
              onDragLeft={(dy) => physicsEngine?.setLatticeConfig((prev: Record<string, unknown>) => ({
                ...prev,
                force: Math.max(0.5, Math.min(3.0, ((prev.force as number) || 1.0) + (dy * 0.01)))
              }))}
              onDragRight={(dy) => controller.audio.setBaseAperture((prev: number) => Math.max(0, Math.min(100, prev + (dy * 0.5))))}
              onCenterTap={onCenterTap} 
              layoutConfig={{ mandala: currentLayout.mandala, pacer: currentLayout.pacer }}
              sensorMode={sensorMode}
              telemetry={controller.audioSys.telemetry} 
              bus={controller.bus}
            />
          </ErrorBoundary>
        )}

        {/* Visualizer Immersion Floating Exit Button & Experience HUD */}
        <ImmersionExperienceOverlay
          isVisualizerImmersion={isVisualizerImmersion}
          isImmersionHudVisible={isImmersionHudVisible}
          onExitImmersion={() => toggleVisualizerImmersion(false)}
          isExperienceActive={isExperienceActive}
          isExperiencePaused={isExperiencePaused}
          activeExperience={activeExperience}
          activeBlockIndex={activeBlockIndex}
          blockProgress={blockProgress}
          currentExpCycle={currentExpCycle}
          onTogglePlayExperience={(exp) => handleTogglePlayExperience(exp)}
          onStopExperience={handleMasterStop}
          onOpenDesigner={() => {
            toggleVisualizerImmersion(false);
            onOpenExperienceModal();
          }}
        />

        {/* Left / Right Lens Carousel Arrows */}
        <button 
          onClick={() => onSwipeLens('PREV')} 
          aria-label="Previous Visualizer Lens"
          title="Previous Lens"
          className={`absolute z-30 flex items-center justify-center transition-opacity group ${
            isVisualizerImmersion ? 'opacity-0 pointer-events-none' : 'opacity-30 hover:opacity-100'
          }`} 
          style={{ 
            left: `${currentLayout.sideNav.x}rem`, 
            top: `calc(50% + ${currentLayout.sideNav.y}rem)`, 
            transform: `translate(0, -50%) scale(${currentLayout.sideNav.scale})`, 
            opacity: isVisualizerImmersion ? 0 : currentLayout.sideNav.opacity * 0.3, 
            pointerEvents: (isVisualizerImmersion || currentLayout.sideNav.opacity === 0) ? 'none' : 'auto' 
          }}
        >
          <ChevronLeft size={32} className="text-white group-hover:text-cyan-400 transition-colors drop-shadow-lg" />
        </button>
        <button 
          onClick={() => onSwipeLens('NEXT')} 
          aria-label="Next Visualizer Lens"
          title="Next Lens"
          className={`absolute z-30 flex items-center justify-center transition-opacity group ${
            isVisualizerImmersion ? 'opacity-0 pointer-events-none' : 'opacity-30 hover:opacity-100'
          }`} 
          style={{ 
            right: `${currentLayout.sideNav.x}rem`, 
            top: `calc(50% + ${currentLayout.sideNav.y}rem)`, 
            transform: `translate(0, -50%) scale(${currentLayout.sideNav.scale})`, 
            opacity: isVisualizerImmersion ? 0 : currentLayout.sideNav.opacity * 0.3, 
            pointerEvents: (isVisualizerImmersion || currentLayout.sideNav.opacity === 0) ? 'none' : 'auto' 
          }}
        >
          <ChevronRight size={32} className="text-white group-hover:text-cyan-400 transition-colors drop-shadow-lg" />
        </button>

        {/* Top Deck Tuning Controls (Pulse, Heartbeat, Composer Matrix, Pacer, Crystal, Tones) */}
        <TuningControlsDeck
          controller={controller}
          uiConfig={uiConfig}
          isVisualizerImmersion={isVisualizerImmersion}
          topButtonsLayout={currentLayout.topButtons}
          uiX={currentLayout.uiX}
          bpm={bpm}
          isProgressionActive={isProgressionActive}
          currentProgressionObj={currentProgressionObj}
          currentChordIndex={currentChordIndex}
          activeColorWheelId={activeColorWheelId}
          onSelectColorWheel={onSelectColorWheel}
          onOpenBreathSheet={() => {
            toggleVisualizerImmersion(false);
            onOpenBreathSheet();
          }}
          onShowToast={onShowToast}
        />

        {/* Floating Entrainment Bottom Pill */}
        <div 
          className={`absolute z-40 pointer-events-auto bg-zinc-950/90 backdrop-blur-md border border-white/10 rounded-full px-1.5 sm:px-2.5 py-1 flex items-center gap-0.5 sm:gap-1 shadow-lg transition-all duration-300 max-w-[96vw] sm:max-w-none ${
            isVisualizerImmersion ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`} 
          style={{ 
            bottom: `${currentLayout.pill.y}rem`, 
            left: '50%', 
            transform: `translate(-50%, 0) translate(${currentLayout.pill.x}rem, 0) translateX(${currentLayout.uiX}rem) scale(${currentLayout.pill.scale})`, 
            opacity: isVisualizerImmersion ? 0 : currentLayout.pill.opacity, 
            pointerEvents: (isVisualizerImmersion || currentLayout.pill.opacity === 0) ? 'none' : 'auto' 
          }}
        >
          <TunerBottomPill
            binauralFreq={controller.temporal.binauralFreqs['UNIVERSAL'] || 8.0}
            isFractalSync={!!controller.atmosphere.immersionConfig?.isFractalSync}
            pulseMode={controller.atmosphere.immersionConfig?.pulseMode || 'BINAURAL'}
            activeLayers={resolveActiveLayers(controller.atmosphere.immersionConfig)}
            isLayersDropdownOpen={isLayersDropdownOpen}
            onToggleLayersDropdown={() => {
              setIsLayersDropdownOpen(!isLayersDropdownOpen);
              setIsFreqDropdownOpen(false);
              setIsToneArrayDropdownOpen(false);
            }}
            onCloseLayersDropdown={() => setIsLayersDropdownOpen(false)}
            onToggleLayer={(layer: EntrainmentLayer) => {
              const current = resolveActiveLayers(controller.atmosphere.immersionConfig);
              const next = current.includes(layer)
                ? current.filter(l => l !== layer)
                : [...current, layer];
              const nextMode = next.length > 1 ? 'HYBRID' : (next.length === 0 ? 'OFF' : (next[0] === 'isochronic' ? 'ISOCHRONIC' : next[0] === 'monaural' ? 'MONAURAL' : 'BINAURAL'));
              controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({
                ...prev,
                activeLayers: next,
                pulseMode: nextMode
              }));
            }}
            isConjugatePhase={!!controller.atmosphere.immersionConfig?.isConjugatePhase}
            onToggleConjugatePhase={(val: boolean) => {
              controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({ ...prev, isConjugatePhase: val }));
            }}
            isochronicHardEdge={!!controller.atmosphere.immersionConfig?.isochronicHardEdge}
            onToggleIsochronicHardEdge={(val: boolean) => {
              controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({ ...prev, isochronicHardEdge: val }));
            }}
            isPACGated={controller.atmosphere.immersionConfig?.isPACGated !== false}
            onTogglePACGated={(val: boolean) => {
              controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({ ...prev, isPACGated: val }));
            }}
            activeToneArray={activeToneArray}
            totalActiveTones={totalActiveTones}
            musicPitchRef={musicPitchRef}
            musicTemperament={musicTemperament}
            isProgressionActive={isProgressionActive}
            isFreqDropdownOpen={isFreqDropdownOpen}
            isToneArrayDropdownOpen={isToneArrayDropdownOpen}
            customBinauralInput={customBinauralInput}
            presets={PRESETS}
            onToggleFreqDropdown={() => {
              setIsFreqDropdownOpen(!isFreqDropdownOpen);
              setIsLayersDropdownOpen(false);
              setIsToneArrayDropdownOpen(false);
            }}
            onCloseFreqDropdown={() => setIsFreqDropdownOpen(false)}
            onToggleToneArrayDropdown={() => {
              setIsToneArrayDropdownOpen(!isToneArrayDropdownOpen);
              setIsLayersDropdownOpen(false);
              setIsFreqDropdownOpen(false);
            }}
            onCloseToneArrayDropdown={() => setIsToneArrayDropdownOpen(false)}
            onCustomBinauralInputChange={setCustomBinauralInput}
            onApplyCustomBinauralFreq={applyCustomBinauralFreq}
            onSelectEntrainmentMode={(freq) => controller.temporal.handleGlobalEntrainmentChange(freq)}
            onTogglePulseMode={() => controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({
              ...prev,
              pulseMode: prev.pulseMode === 'ISOCHRONIC' ? 'BINAURAL' : 'ISOCHRONIC'
            }))}
            onSelectToneArray={(pkgId) => {
              setActiveToneArray(pkgId);
              if (pkgId === 'KNOB' && controller.audio.mutes['UNIVERSAL_799'] !== false) {
                controller.audio.handleMuteToggle('UNIVERSAL_799');
              }
            }}
            onOpenCustomToneModal={onOpenCustomToneModal}
            onOpenMusicTuningModal={onOpenMusicTuningModal}
            onOpenProgressionModal={onOpenProgressionModal}
            onOpenExperienceModal={onOpenExperienceModal}
            isExperienceActive={isExperienceActive}
            activeExperienceName={activeExperience?.name}
            onClearAllTones={clearAllTones}
            onToggleFractalSync={() => controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({
              ...prev,
              isFractalSync: !prev.isFractalSync
            }))}
            getChannelsForPreset={(pkgId) => getChannelsForPreset(pkgId, customChannels, musicScaleChannels)}
            isChannelActive={(chId) => !dockMutes[chId]}
          />
        </div>

        {/* Toast Notification positioned strictly above the entrainment pill */}
        <ToastNotification 
          message={toast.message} 
          visible={toast.visible} 
          style={{ 
            bottom: `calc(${currentLayout.pill.y}rem + 2.8rem)`, 
            left: '50%', 
            transform: `translate(-50%, 0) translate(${currentLayout.pill.x}rem, 0) translateX(${currentLayout.uiX}rem) scale(${currentLayout.pill.scale})` 
          }} 
        />

        {/* Bottom Harmonic Dock & Breath Transport Meter */}
        <TunerDock
          currentLayout={currentLayout}
          isVisualizerImmersion={isVisualizerImmersion}
          activeToneArray={activeToneArray}
          musicPitchRef={musicPitchRef}
          musicTemperament={musicTemperament}
          isProgressionActive={isProgressionActive}
          onMusicPitchChange={onMusicPitchChange}
          onMusicTemperamentChange={onMusicTemperamentChange}
          onOpenArchitect={onOpenMusicTuningModal}
          onOpenMoods={onOpenProgressionModal}
          knobFreq={knobFreq}
          onKnobFreqChange={onKnobFreqChange}
          currentChannels={getChannelsForPreset(activeToneArray, customChannels, musicScaleChannels)}
          mutes={dockMutes}
          chordToneIds={currentChordScaleIds}
          onToggleMute={(id) => controller.audio.handleMuteToggle(id)}
          onSoloTone={(id, allChannels) => {
            controller.audio.setMutes((prev: Record<string, boolean>) => {
              const next = { ...prev };
              allChannels.forEach(ch => { next[ch.id] = true; });
              next[id] = false;
              return next;
            });
          }}
          controller={controller}
          uiConfig={uiConfig}
          isExperienceActive={isExperienceActive}
          activeExperience={activeExperience}
          activeBlockIndex={activeBlockIndex}
          blockProgress={blockProgress}
          activeSubPhase={activeSubPhase}
          isMasterPaused={isMasterPaused}
          currentBreathPresetName={currentBreathPresetName}
          onOpenBreathSheet={onOpenBreathSheet}
          onOpenHarmonicMenu={onOpenHarmonicMenu}
        />
      </div>

      {/* Floating System Monitor Telemetry HUD */}
      {showSystemMonitor && (
        <div className="absolute top-16 left-4 right-4 z-40 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
          <div className="pointer-events-auto">
            <SystemMonitor telemetry={controller.audioSys.telemetry} uiConfig={uiConfig} isAudioEnabled={controller.audioSys.audioEnabled} />
            <div className="flex justify-end mt-2">
              <button 
                onClick={() => setShowSystemMonitor(false)} 
                className="text-[10px] uppercase text-slate-500 hover:text-white underline cursor-pointer"
              >
                Close Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TunerVisualizerStage.displayName = 'TunerVisualizerStage';
