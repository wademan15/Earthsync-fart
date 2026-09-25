/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { ViewMode, SensorMode, TunerDisplayMetrics } from '../../types';
import type { BreathConfig } from '../../services/audio/AudioTypes';
import { StyleContext, DEFAULT_UI_CONFIG } from '../system/StyleEditor';
import { VISUALIZER_MODES, VISUALIZER_PLUGINS } from './visuals/VisualizerRegistry'; 
import { TunerVisualizerStage } from './tuner/TunerVisualizerStage';
import { TunerTopHeader } from './tuner/TunerTopHeader';
import { StudioPanelsDrawer } from './tuner/StudioPanelsDrawer';
import { TunerModals } from './tuner/TunerModals';
import { usePlanetaryProgression } from './tuner/hooks/usePlanetaryProgression';
import { usePlanetaryCustomTones } from './tuner/hooks/usePlanetaryCustomTones';
import { usePlanetaryBreathPresets } from './tuner/hooks/usePlanetaryBreathPresets';
import { usePlanetaryExperience } from './tuner/hooks/usePlanetaryExperience';
import { usePlanetaryLayout, LAYOUT_DEFAULTS } from './tuner/hooks/usePlanetaryLayout';
import { STARTER_EXPERIENCES } from '../../services/audio/experienceDesigner';
import { usePlanetaryController } from '../../hooks/usePlanetaryController';
import { HarmonicColorWheelId } from '../../data/colorWheels';
import { getActiveColorWheelId, setActiveColorWheelId, subscribeColorWheel } from '../../services/kinematics/color';
import { PresetType } from './visuals/shared';
import { getCachedStorage, setCachedStorage } from './tuner/tunerStorage';

export type { LayoutProfile, LayoutProfileData, LayoutElement } from './tuner/hooks/usePlanetaryLayout';
export { LAYOUT_DEFAULTS };
export {
  SENTIC_EMOTION_META,
  generateSenticSvgPath,
  COMPOSER_WARP_PRESETS,
  PULSE_PRESETS,
  PACER_BELL_TONES,
  PACER_BELL_KEYS,
  PACER_TIDE_TEXTURES,
  getBellPitchHz
} from './tuner/TuningControlsDeck';

interface ModeTokens {
  card: string;
  text: string;
  heading: string;
  subtext: string;
  muted: string;
  iconBg: string;
  modalBg: string;
  modalBorder: string;
  dockBar: string;
  bg: string;
}

interface ThemeTokens {
  primary: string;
  bg: string;
  border: string;
  hex: string;
}

interface Props {
  /** Prefer TunerDisplayMetrics or DiagnosticsPartial over a free-form bag */
  metrics: TunerDisplayMetrics | Record<string, unknown>;
  bpm: number;
  coherence: number;
  lastBeatTime: number;
  mode: ModeTokens | string;
  theme: ThemeTokens | Record<string, unknown>;
  isDarkMode: boolean;
  id: string;
  index: number;
  isMinimized?: boolean;
  onToggleMinimize?: (id: string) => void;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onOpenInfo?: () => void;
  onTogglePower?: (id: string) => void;
  isPowered?: boolean;
  standalone?: boolean;
  isSimulating?: boolean;
  onSimBpmChange?: (bpm: number) => void;
  onSimCoherenceChange?: (enabled: boolean) => void;
  isCoherenceSimulated?: boolean;
  viewMode: ViewMode;
  sensorMode: SensorMode | null;
  onBreathConfigChange?: (config: BreathConfig) => void;
  isVisualizerImmersion?: boolean;
  onToggleVisualizerImmersion?: (forced?: boolean) => void;
  onToggleViewMode?: () => void;
  onOpenStyleEditor?: () => void;
  showStyleEditor?: boolean;
}

export const PlanetaryTunerModule = React.memo<Props>((props) => {
  const { onToggleVisualizerImmersion, onBreathConfigChange, viewMode } = props;
  const uiConfig = useContext(StyleContext) || DEFAULT_UI_CONFIG;
  const controller = usePlanetaryController(props);
  const physicsEngine = controller.lattice || (controller as Record<string, unknown>).physics;
  const hasSensors = props.sensorMode !== 'AETHER' && props.sensorMode !== null && props.sensorMode !== undefined;

  // Feedback Notifications & System Telemetry Monitor
  const [showSystemMonitor, setShowSystemMonitor] = useState(false); 
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const showToast = useCallback((message: string, durationMs: number = 1500) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), durationMs);
  }, []);

  // Preset Array & Knob Frequency
  const [activeToneArray, setActiveToneArray] = useState<PresetType>('UNIVERSAL');
  const [knobFreq, setKnobFreq] = useState<number>(() => {
    const saved = getCachedStorage('ppl_knob_freq');
    const parsed = saved ? parseFloat(saved) : NaN;
    return (!isNaN(parsed) && parsed >= 20 && parsed <= 2000) ? parsed : 432.0;
  });

  const handleKnobFreqChange = useCallback((newFreq: number) => {
    setKnobFreq(newFreq);
    setCachedStorage('ppl_knob_freq', newFreq.toString());
    if (controller.loopDataRef?.current) {
      if (!controller.loopDataRef.current.customFrequencies) {
        controller.loopDataRef.current.customFrequencies = {};
      }
      controller.loopDataRef.current.customFrequencies['UNIVERSAL_799'] = newFreq;
    }
  }, [controller.loopDataRef]);

  const isMasterPausedRef = useRef<boolean>(false);

  // Modal Visibility States
  const [isMusicTuningModalOpen, setIsMusicTuningModalOpen] = useState(false);
  const [isProgressionModalOpen, setIsProgressionModalOpen] = useState(false);
  const [isCustomToneModalOpen, setIsCustomToneModalOpen] = useState(false);
  const [showHarmonicMenu, setShowHarmonicMenu] = useState(false);
  const [isAudioMixerOpen, setIsAudioMixerOpen] = useState(false);
  const [isPolyvagalModalOpen, setIsPolyvagalModalOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isSaveDefault, setIsSaveDefault] = useState(false);

  // Color Wheel State
  const [activeColorWheelId, setActiveColorWheelIdState] = useState<HarmonicColorWheelId>(() => getActiveColorWheelId());
  useEffect(() => subscribeColorWheel(setActiveColorWheelIdState), []);

  // Visualizer Fullscreen Immersion Mode
  const [localVisualizerImmersion, setLocalVisualizerImmersion] = useState(false);
  const isVisualizerImmersion = props.isVisualizerImmersion !== undefined ? props.isVisualizerImmersion : localVisualizerImmersion;
  const toggleVisualizerImmersion = useCallback((forced?: boolean) => {
    if (onToggleVisualizerImmersion) {
      onToggleVisualizerImmersion(forced);
    } else {
      setLocalVisualizerImmersion(prev => typeof forced === 'boolean' ? forced : !prev);
    }
  }, [onToggleVisualizerImmersion]);

  const [isImmersionHudVisible, setIsImmersionHudVisible] = useState(true);
  const immersionHudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isVisualizerImmersion) {
      setIsImmersionHudVisible(true);
      return;
    }
    const wakeHud = () => {
      setIsImmersionHudVisible(true);
      if (immersionHudTimerRef.current) clearTimeout(immersionHudTimerRef.current);
      immersionHudTimerRef.current = setTimeout(() => setIsImmersionHudVisible(false), 3500);
    };
    wakeHud();
    window.addEventListener('mousemove', wakeHud, { passive: true });
    window.addEventListener('touchstart', wakeHud, { passive: true });
    return () => {
      if (immersionHudTimerRef.current) clearTimeout(immersionHudTimerRef.current);
      window.removeEventListener('mousemove', wakeHud);
      window.removeEventListener('touchstart', wakeHud);
    };
  }, [isVisualizerImmersion]);

  // Integrated Tuner Hooks
  const { layoutDebug, setLayoutDebug, currentLayout, handleLayoutChange } = usePlanetaryLayout();
  const progression = usePlanetaryProgression({ controller, isMasterPausedRef, onShowToast: showToast, setActiveToneArray });
  const customTones = usePlanetaryCustomTones({
    controller,
    physicsEngine,
    activeToneArray,
    setActiveToneArray,
    knobFreq,
    musicScaleChannels: progression.musicScaleChannels,
    isProgressionActive: progression.isProgressionActive,
    currentProgressionObj: progression.currentProgressionObj,
    currentChordScaleIds: progression.currentChordScaleIds,
    onShowToast: showToast
  });
  const breath = usePlanetaryBreathPresets({ controller, onBreathConfigChange, onShowToast: showToast });
  const experience = usePlanetaryExperience({
    controller,
    musicPitchRef: progression.musicPitchRef,
    musicTemperament: progression.musicTemperament,
    isProgressionActive: progression.isProgressionActive,
    setIsProgressionActive: progression.setIsProgressionActive,
    totalActiveTones: customTones.totalActiveTones,
    isMasterPausedRef,
    toggleVisualizerImmersion,
    setActiveToneArray,
    setActiveHarmonicIndex: (idx: number) => controller.audio?.setActiveHarmonicIndex?.(idx),
    setCurrentChordIndex: progression.setCurrentChordIndex,
    setIsPolyvagalModalOpen
  });

  // Lens Swiping & Center Tap
  const handleSwipeLens = useCallback((direction: 'PREV' | 'NEXT') => { 
    if (!physicsEngine) return;
    const modes = VISUALIZER_MODES; 
    const currentIndex = modes.indexOf(physicsEngine.activePhysicsMode); 
    const nextIndex = direction === 'NEXT' ? (currentIndex + 1) % modes.length : (currentIndex - 1 + modes.length) % modes.length;
    const nextMode = modes[nextIndex];
    controller.modulation.setModulations(physicsEngine.setMode(nextMode));
    showToast(VISUALIZER_PLUGINS[nextMode]?.name || nextMode.replace(/_/g, ' '), 1500); 
  }, [physicsEngine, controller.modulation, showToast]);

  const handleCenterTap = useCallback(() => {
    if (!physicsEngine) return;
    const presets = physicsEngine.physicsLibrary?.filter((p: Record<string, unknown>) => p.mode === physicsEngine.activePhysicsMode) || [];
    if (presets.length === 0) return;
    const idx = (presets.findIndex((p: Record<string, unknown>) => p.id === physicsEngine.activePhysicsPresetId) + 1) % presets.length;
    const next = presets[idx];
    const mods = physicsEngine.loadPreset(next.id as string);
    if (mods) controller.modulation.setModulations(mods.modulations || {});
    showToast(next.name as string, 1500);
  }, [physicsEngine, controller.modulation, showToast]);

  return (
    <div 
      className="absolute inset-0 flex flex-col bg-[#050505] text-white font-sans overflow-hidden border border-white/10 max-w-full" 
      style={{ fontFamily: uiConfig.fontTheme === 'SPIRITUAL' ? 'Cinzel, serif' : uiConfig.fontTheme === 'CYBER' ? 'Share Tech Mono, monospace' : 'Space Grotesk, sans-serif' }}
    >
      <TunerTopHeader
        uiConfig={uiConfig}
        isAudioMixerOpen={isAudioMixerOpen}
        onToggleAudioMixer={() => setIsAudioMixerOpen(v => !v)}
        onCloseAudioMixer={() => setIsAudioMixerOpen(false)}
        controller={controller}
        onOpenBreathArchitect={() => breath.setShowBreathSheet(true)}
        isPolyvagalModalOpen={isPolyvagalModalOpen}
        onTogglePolyvagalModal={() => setIsPolyvagalModalOpen(v => !v)}
        experience={experience}
        isVisualizerImmersion={isVisualizerImmersion}
        onToggleVisualizerImmersion={toggleVisualizerImmersion}
        viewMode={props.viewMode}
        onToggleViewMode={props.onToggleViewMode}
        onOpenStyleEditor={props.onOpenStyleEditor}
        showStyleEditor={props.showStyleEditor}
        onOpenInfo={props.onOpenInfo}
        starterExperiences={STARTER_EXPERIENCES}
      />
      
      <TunerVisualizerStage
        controller={controller}
        physicsEngine={physicsEngine}
        isPowered={props.isPowered}
        sensorMode={props.sensorMode}
        currentLayout={currentLayout}
        uiConfig={uiConfig}
        bpm={props.bpm}
        isVisualizerImmersion={isVisualizerImmersion}
        isImmersionHudVisible={isImmersionHudVisible}
        toggleVisualizerImmersion={toggleVisualizerImmersion}
        experience={experience}
        progression={progression}
        customTones={customTones}
        breath={breath}
        activeToneArray={activeToneArray}
        setActiveToneArray={(pkgId) => {
          setActiveToneArray(pkgId);
          if (pkgId === 'KNOB' && controller.audio.mutes['UNIVERSAL_799'] !== false) {
            controller.audio.handleMuteToggle('UNIVERSAL_799');
          }
        }}
        knobFreq={knobFreq}
        onKnobFreqChange={handleKnobFreqChange}
        onOpenMusicTuningModal={() => setIsMusicTuningModalOpen(true)}
        onOpenProgressionModal={() => setIsProgressionModalOpen(true)}
        onOpenCustomToneModal={() => setIsCustomToneModalOpen(true)}
        onOpenExperienceModal={() => experience.setIsExperienceModalOpen(true)}
        onOpenHarmonicMenu={() => setShowHarmonicMenu(true)}
        onSwipeLens={handleSwipeLens}
        onCenterTap={handleCenterTap}
        activeColorWheelId={activeColorWheelId}
        onSelectColorWheel={(id) => {
          setActiveColorWheelId(id);
          setActiveColorWheelIdState(id);
        }}
        toast={toast}
        onShowToast={showToast}
        showSystemMonitor={showSystemMonitor}
        setShowSystemMonitor={setShowSystemMonitor}
      />

      <TunerModals
        controller={controller}
        uiConfig={uiConfig}
        breath={breath}
        customTones={customTones}
        progression={progression}
        experience={experience}
        activeToneArray={activeToneArray}
        setActiveToneArray={setActiveToneArray}
        isCustomToneModalOpen={isCustomToneModalOpen}
        onCloseCustomToneModal={() => setIsCustomToneModalOpen(false)}
        showHarmonicMenu={showHarmonicMenu}
        onCloseHarmonicMenu={() => setShowHarmonicMenu(false)}
        isMusicTuningModalOpen={isMusicTuningModalOpen}
        onCloseMusicTuningModal={() => setIsMusicTuningModalOpen(false)}
        isProgressionModalOpen={isProgressionModalOpen}
        onCloseProgressionModal={() => setIsProgressionModalOpen(false)}
        isPolyvagalModalOpen={isPolyvagalModalOpen}
        onClosePolyvagalModal={() => setIsPolyvagalModalOpen(false)}
        toggleVisualizerImmersion={toggleVisualizerImmersion}
        showToast={showToast}
        showSaveModal={showSaveModal}
        onCloseSaveModal={() => setShowSaveModal(false)}
        newPresetName={newPresetName}
        setNewPresetName={setNewPresetName}
        isSaveDefault={isSaveDefault}
        setIsSaveDefault={setIsSaveDefault}
      />

      {viewMode === 'STUDIO' && (
        <StudioPanelsDrawer
          dockPosition="BOTTOM"
          uiConfig={uiConfig}
          physicsEngine={physicsEngine}
          controller={controller}
          hasSensors={hasSensors}
          layoutDebug={layoutDebug}
          currentLayout={currentLayout}
          onLayoutChange={handleLayoutChange}
          onResetLayout={() => {
            setLayoutDebug(prev => ({ ...prev, profiles: LAYOUT_DEFAULTS }));
            showToast('Grid Reset to Defaults', 1500);
          }}
          onShowToast={(msg) => showToast(msg, 1500)}
        />
      )}
    </div>
  );
});

PlanetaryTunerModule.displayName = 'PlanetaryTunerModule';
