import React, { lazy, Suspense } from 'react';
import { Check } from 'lucide-react';
import { TuningTemperament, HarmonicChannel, PresetType } from '../visuals/shared';
import { HarmonicPackage } from '../designers/HarmonicPackageMenu';
import { BreathPreset } from '../designers/BreathDesigner';
import { MusicalMood, ProgressionDef, ChordDef } from '../../../services/audio/chordProgressions';
import { ExperienceDef } from '../../../services/audio/experienceDesigner';
import { resolveActiveLayers } from '../../../services/audio/AudioTypes';
import { MasterTransportStatus } from './MasterTransportControls';
import { BreathArchitectSheet } from './BreathArchitectSheet';
import { CustomToneArrayModal } from './CustomToneArrayModal';
import type { usePlanetaryProgression } from './hooks/usePlanetaryProgression';
import type { usePlanetaryCustomTones } from './hooks/usePlanetaryCustomTones';
import type { usePlanetaryBreathPresets } from './hooks/usePlanetaryBreathPresets';
import type { usePlanetaryExperience } from './hooks/usePlanetaryExperience';
import type { usePlanetaryController } from '../../../hooks/usePlanetaryController';

const AudioMixerModal = lazy(() => import('../AudioMixerModal').then(m => ({ default: m.AudioMixerModal })));
const MusicalTuningModal = lazy(() => import('../MusicalTuningModal').then(m => ({ default: m.MusicalTuningModal })));
const MusicalProgressionModal = lazy(() => import('../MusicalProgressionModal').then(m => ({ default: m.MusicalProgressionModal })));
const PolyvagalModal = lazy(() => import('../PolyvagalModal').then(m => ({ default: m.PolyvagalModal })));
const ExperienceDesignerModal = lazy(() => import('../ExperienceDesignerModal').then(m => ({ default: m.ExperienceDesignerModal })));
const HarmonicPackageMenu = lazy(() => import('../designers/HarmonicPackageMenu').then(m => ({ default: m.HarmonicPackageMenu })));

export interface TunerModalsProps {
  controller: ReturnType<typeof usePlanetaryController>;
  uiConfig: {
    appBgColor?: string;
    textColor?: string;
    primaryColor?: string;
    borderRgb?: string;
    borderOpacity?: number;
    [key: string]: unknown;
  };

  // Optional Hook bundles
  breath?: ReturnType<typeof usePlanetaryBreathPresets>;
  customTones?: ReturnType<typeof usePlanetaryCustomTones>;
  progression?: ReturnType<typeof usePlanetaryProgression>;
  experience?: ReturnType<typeof usePlanetaryExperience>;
  showToast?: (message: string, durationMs?: number) => void;
  toggleVisualizerImmersion?: (forced?: boolean) => void;

  // Audio Mixer Modal
  isAudioMixerOpen?: boolean;
  onCloseAudioMixer?: () => void;
  onOpenBreathArchitectFromMixer?: () => void;

  // Breath Architect Sheet
  showBreathSheet?: boolean;
  onCloseBreathSheet?: () => void;
  breathSheetTab?: 'PRESETS' | 'CUSTOM' | 'DESIGNER';
  onBreathSheetTabChange?: (tab: 'PRESETS' | 'CUSTOM' | 'DESIGNER') => void;
  previewPreset?: BreathPreset;
  deckPreviewId?: string;
  onSelectPreviewPreset?: (id: string) => void;
  groupedPresets?: {
    RELAX: BreathPreset[];
    BALANCE: BreathPreset[];
    ENERGY: BreathPreset[];
    PERFORMANCE: BreathPreset[];
  };
  onActivateBreathPreset?: (preset: BreathPreset) => void;
  onDeleteCustomBreathPreset?: (id: string, e: React.MouseEvent) => void;
  customInhale?: number;
  setCustomInhale?: (val: ((prev: number) => number) | number) => void;
  customHoldIn?: number;
  setCustomHoldIn?: (val: ((prev: number) => number) | number) => void;
  customExhale?: number;
  setCustomExhale?: (val: ((prev: number) => number) | number) => void;
  customHoldOut?: number;
  setCustomHoldOut?: (val: ((prev: number) => number) | number) => void;
  customPresetTitle?: string;
  setCustomPresetTitle?: (val: string) => void;
  onSaveCustomBreathPreset?: () => void;
  onApplyCustomBreathPattern?: () => void;

  // Custom Tone Array Modal
  isCustomToneModalOpen: boolean;
  onCloseCustomToneModal: () => void;
  customChannels?: HarmonicChannel[];
  onUpdateCustomChannel?: (index: number, key: 'freq' | 'name' | 'noteLabel', value: string | number) => void;
  onToggleCustomMute?: (channelId: string) => void;
  onRemoveCustomChannel?: (index: number) => void;
  onAddCustomChannel?: () => void;
  onResetCustomChannels?: () => void;
  onActivateCustomArray?: () => void;

  // Harmonic Packages Menu
  showHarmonicMenu: boolean;
  onCloseHarmonicMenu: () => void;
  onSelectHarmonicPackage?: (pkg: HarmonicPackage) => void;
  activeToneArray: PresetType;
  setActiveToneArray?: (pkgId: PresetType) => void;

  // Musical Tuning Modal (Pitch Architect)
  isMusicTuningModalOpen: boolean;
  onCloseMusicTuningModal: () => void;
  musicPitchRef?: React.MutableRefObject<number> | number;
  onMusicPitchChange?: (pitch: number) => void;
  musicTemperament?: TuningTemperament;
  onMusicTemperamentChange?: (temp: TuningTemperament) => void;
  musicOctaveShift?: number;
  onMusicOctaveShiftChange?: (shift: number) => void;

  // Musical Progression Modal
  isProgressionModalOpen: boolean;
  onCloseProgressionModal: () => void;
  onOpenArchitectFromProgression?: () => void;
  isProgressionActive?: boolean;
  onToggleProgression?: () => void;
  masterStatus?: MasterTransportStatus;
  onMasterPlayPause?: () => void;
  onMasterStop?: () => void;
  onMasterClear?: () => void;
  activeMood?: MusicalMood;
  onSelectMood?: (mood: MusicalMood) => void;
  activeProgressionId?: string;
  onSelectProgression?: (id: string) => void;
  currentChordIndex?: number;
  progressionAdvanceMode?: 'BREATH_CYCLE' | 'BREATH_PHASE' | 'BREATH_EXHALE' | 'MANUAL';
  onProgressionAdvanceModeChange?: (mode: 'BREATH_CYCLE' | 'BREATH_PHASE' | 'BREATH_EXHALE' | 'MANUAL') => void;
  onAdvanceChord?: (dir: 1 | -1) => void;
  onPlaySingleChord?: (chord: ChordDef) => void;
  onSelectChordIndex?: (index: number) => void;
  customProgressions?: ProgressionDef[];
  onSaveAndActivateProgression?: (prog: ProgressionDef) => void;
  onCustomProgressionsChange?: () => void;

  // Polyvagal Modal
  isPolyvagalModalOpen: boolean;
  onClosePolyvagalModal: () => void;

  // Experience Designer Modal
  isExperienceModalOpen?: boolean;
  onCloseExperienceModal?: () => void;
  isExperienceActive?: boolean;
  isExperiencePaused?: boolean;
  activeExperience?: ExperienceDef | null;
  activeBlockIndex?: number;
  blockProgress?: number;
  currentExpCycle?: number;
  onTogglePlayExperience?: (preset?: ExperienceDef, options?: { autoImmerse?: boolean }) => void;
  onToggleVisualizerImmersion?: (forced?: boolean) => void;
  onAuditionBlock?: (block: unknown) => void;
  onJumpToBlock?: (index: number) => void;

  // Save Preset Modal
  showSaveModal: boolean;
  onCloseSaveModal: () => void;
  newPresetName: string;
  setNewPresetName: (name: string) => void;
  isSaveDefault: boolean;
  setIsSaveDefault: (val: boolean) => void;
  onSavePresetConfirm?: () => void;
}

export const TunerModals: React.FC<TunerModalsProps> = (props) => {
  const {
    controller,
    uiConfig,
    breath,
    customTones,
    progression,
    experience,
    showToast = () => {},

    isAudioMixerOpen,
    onCloseAudioMixer,
    onOpenBreathArchitectFromMixer,

    isCustomToneModalOpen,
    onCloseCustomToneModal,

    showHarmonicMenu,
    onCloseHarmonicMenu,
    activeToneArray,
    setActiveToneArray,

    isMusicTuningModalOpen,
    onCloseMusicTuningModal,

    isProgressionModalOpen,
    onCloseProgressionModal,
    onOpenArchitectFromProgression = () => {},

    isPolyvagalModalOpen,
    onClosePolyvagalModal,

    showSaveModal,
    onCloseSaveModal,
    newPresetName,
    setNewPresetName,
    isSaveDefault,
    setIsSaveDefault,
  } = props;

  // Breath Architect resolution
  const showBreathSheet = props.showBreathSheet ?? breath?.showBreathSheet ?? false;
  const onCloseBreathSheet = props.onCloseBreathSheet ?? (() => breath?.setShowBreathSheet(false));
  const breathSheetTab = props.breathSheetTab ?? breath?.breathSheetTab ?? 'PRESETS';
  const onBreathSheetTabChange = props.onBreathSheetTabChange ?? breath?.setBreathSheetTab;
  const previewPreset = props.previewPreset ?? breath?.previewPreset;
  const deckPreviewId = props.deckPreviewId ?? breath?.deckPreviewId ?? 'resonance';
  const onSelectPreviewPreset = props.onSelectPreviewPreset ?? breath?.setDeckPreviewId;
  const groupedPresets = props.groupedPresets ?? breath?.groupedPresets;
  const onActivateBreathPreset = props.onActivateBreathPreset ?? ((preset: BreathPreset) => {
    controller.temporal.setBreathConfig({ ...controller.temporal.breathConfig, ...preset.config });
    if (breath?.setShowBreathSheet) breath.setShowBreathSheet(false);
  });
  const onDeleteCustomBreathPreset = props.onDeleteCustomBreathPreset ?? breath?.deleteCustomBreathPreset;
  const customInhale = props.customInhale ?? breath?.customInhale ?? 4;
  const setCustomInhale = props.setCustomInhale ?? breath?.setCustomInhale;
  const customHoldIn = props.customHoldIn ?? breath?.customHoldIn ?? 4;
  const setCustomHoldIn = props.setCustomHoldIn ?? breath?.setCustomHoldIn;
  const customExhale = props.customExhale ?? breath?.customExhale ?? 4;
  const setCustomExhale = props.setCustomExhale ?? breath?.setCustomExhale;
  const customHoldOut = props.customHoldOut ?? breath?.customHoldOut ?? 4;
  const setCustomHoldOut = props.setCustomHoldOut ?? breath?.setCustomHoldOut;
  const customPresetTitle = props.customPresetTitle ?? breath?.customPresetTitle ?? '';
  const setCustomPresetTitle = props.setCustomPresetTitle ?? breath?.setCustomPresetTitle;
  const onSaveCustomBreathPreset = props.onSaveCustomBreathPreset ?? breath?.saveCustomBreathPreset;
  const onApplyCustomBreathPattern = props.onApplyCustomBreathPattern ?? (() => {
    controller.temporal.setBreathConfig({
      ...controller.temporal.breathConfig,
      inhale: customInhale,
      holdIn: customHoldIn,
      exhale: customExhale,
      holdOut: customHoldOut
    });
    if (breath?.setShowBreathSheet) breath.setShowBreathSheet(false);
    showToast(`Custom Breath: ${customInhale}-${customHoldIn}-${customExhale}-${customHoldOut}`, 1500);
  });

  // Custom tones resolution
  const customChannels = props.customChannels ?? customTones?.customChannels ?? [];
  const onUpdateCustomChannel = props.onUpdateCustomChannel ?? customTones?.updateCustomChannel;
  const onToggleCustomMute = props.onToggleCustomMute ?? ((channelId: string) => {
    controller.audio.setMutes((prev: Record<string, boolean>) => ({ ...prev, [channelId]: !prev[channelId] }));
  });
  const onRemoveCustomChannel = props.onRemoveCustomChannel ?? customTones?.removeCustomChannel;
  const onAddCustomChannel = props.onAddCustomChannel ?? customTones?.addCustomChannel;
  const onResetCustomChannels = props.onResetCustomChannels ?? customTones?.resetCustomChannelsToDefault;
  const onActivateCustomArray = props.onActivateCustomArray ?? (() => {
    if (setActiveToneArray) setActiveToneArray('CUSTOM');
    onCloseCustomToneModal();
    showToast('Custom Tone Array Active', 1400);
  });
  const onSelectHarmonicPackage = props.onSelectHarmonicPackage ?? customTones?.handlePackageSelect;

  // Progression resolution
  const musicPitchRef = props.musicPitchRef ?? progression?.musicPitchRef;
  const onMusicPitchChange = props.onMusicPitchChange ?? progression?.handleMusicPitchChange;
  const musicTemperament = props.musicTemperament ?? progression?.musicTemperament;
  const onMusicTemperamentChange = props.onMusicTemperamentChange ?? progression?.handleMusicTemperamentChange;
  const musicOctaveShift = props.musicOctaveShift ?? progression?.musicOctaveShift ?? 0;
  const onMusicOctaveShiftChange = props.onMusicOctaveShiftChange ?? progression?.handleMusicOctaveShiftChange;
  const isProgressionActive = props.isProgressionActive ?? progression?.isProgressionActive ?? false;
  const onToggleProgression = props.onToggleProgression ?? progression?.handleToggleProgression;
  const masterStatus = props.masterStatus ?? experience?.masterStatus;
  const onMasterPlayPause = props.onMasterPlayPause ?? experience?.handleToggleMasterPlay;
  const onMasterStop = props.onMasterStop ?? experience?.handleMasterStop;
  const onMasterClear = props.onMasterClear ?? experience?.handleMasterClear;
  const activeMood = props.activeMood ?? progression?.activeMood;
  const onSelectMood = props.onSelectMood ?? progression?.handleSelectMood;
  const activeProgressionId = props.activeProgressionId ?? progression?.activeProgressionId;
  const onSelectProgression = props.onSelectProgression ?? progression?.handleSelectProgression;
  const currentChordIndex = props.currentChordIndex ?? progression?.currentChordIndex ?? 0;
  const progressionAdvanceMode = props.progressionAdvanceMode ?? progression?.progressionAdvanceMode ?? 'MANUAL';
  const onProgressionAdvanceModeChange = props.onProgressionAdvanceModeChange ?? progression?.setProgressionAdvanceMode;
  const onAdvanceChord = props.onAdvanceChord ?? progression?.handleAdvanceChord;
  const onPlaySingleChord = props.onPlaySingleChord ?? progression?.handlePlaySingleChord;
  const onSelectChordIndex = props.onSelectChordIndex ?? progression?.handleSelectChordIndex;
  const customProgressions = props.customProgressions ?? progression?.customProgressions;
  const onSaveAndActivateProgression = props.onSaveAndActivateProgression ?? progression?.handleSaveAndActivateProgression;
  const onCustomProgressionsChange = props.onCustomProgressionsChange ?? progression?.reloadCustomProgressions;

  // Experience resolution
  const isExperienceModalOpen = props.isExperienceModalOpen ?? experience?.isExperienceModalOpen ?? false;
  const onCloseExperienceModal = props.onCloseExperienceModal ?? (() => experience?.setIsExperienceModalOpen(false));
  const isExperienceActive = props.isExperienceActive ?? experience?.isExperienceActive ?? false;
  const isExperiencePaused = props.isExperiencePaused ?? experience?.isExperiencePaused ?? false;
  const activeExperience = props.activeExperience !== undefined ? props.activeExperience : (experience?.activeExperience ?? null);
  const activeBlockIndex = props.activeBlockIndex ?? experience?.activeBlockIndex ?? 0;
  const blockProgress = props.blockProgress ?? experience?.blockProgress ?? 0;
  const currentExpCycle = props.currentExpCycle ?? experience?.currentExpCycle ?? 1;
  const onTogglePlayExperience = props.onTogglePlayExperience ?? experience?.handleTogglePlayExperience;
  const onToggleVisualizerImmersion = props.onToggleVisualizerImmersion ?? props.toggleVisualizerImmersion ?? (() => {});
  const onAuditionBlock = props.onAuditionBlock ?? experience?.handleAuditionBlock;
  const onJumpToBlock = props.onJumpToBlock ?? experience?.handleJumpToExperienceBlock;

  const onSavePresetConfirm = props.onSavePresetConfirm ?? (() => {
    controller.savePreset(newPresetName, isSaveDefault);
    onCloseSaveModal();
    setNewPresetName('');
  });
  return (
    <>
      {/* Audio Mixer Modal (when opened from header or dock) */}
      {isAudioMixerOpen && onCloseAudioMixer && (
        <Suspense fallback={null}>
          <AudioMixerModal
            isOpen={isAudioMixerOpen}
            onClose={onCloseAudioMixer}
            controller={controller}
            onOpenBreathArchitect={onOpenBreathArchitectFromMixer || (() => {})}
          />
        </Suspense>
      )}

      {/* Breath Architect Sheet */}
      <BreathArchitectSheet
        isOpen={showBreathSheet}
        onClose={onCloseBreathSheet}
        breathSheetTab={breathSheetTab}
        onTabChange={onBreathSheetTabChange}
        previewPreset={previewPreset}
        deckPreviewId={deckPreviewId}
        onSelectPreviewPreset={onSelectPreviewPreset}
        groupedPresets={groupedPresets}
        onActivatePreset={onActivateBreathPreset}
        onDeleteCustomPreset={onDeleteCustomBreathPreset}
        customInhale={customInhale}
        setCustomInhale={setCustomInhale}
        customHoldIn={customHoldIn}
        setCustomHoldIn={setCustomHoldIn}
        customExhale={customExhale}
        setCustomExhale={setCustomExhale}
        customHoldOut={customHoldOut}
        setCustomHoldOut={setCustomHoldOut}
        customPresetTitle={customPresetTitle}
        setCustomPresetTitle={setCustomPresetTitle}
        onSaveCustomPreset={onSaveCustomBreathPreset}
        onApplyCustomPattern={onApplyCustomBreathPattern}
        controller={controller}
        uiConfig={uiConfig}
      />

      {/* Custom Tone Array Modal */}
      <CustomToneArrayModal
        isOpen={isCustomToneModalOpen}
        onClose={onCloseCustomToneModal}
        customChannels={customChannels}
        onUpdateChannel={onUpdateCustomChannel}
        onToggleMute={onToggleCustomMute}
        onRemoveChannel={onRemoveCustomChannel}
        onAddChannel={onAddCustomChannel}
        onResetToDefault={onResetCustomChannels}
        onActivateCustomArray={onActivateCustomArray}
        mutes={controller.audio.mutes}
      />

      {/* Harmonic Package Menu */}
      {showHarmonicMenu && (
        <Suspense fallback={null}>
          <HarmonicPackageMenu
            isOpen={showHarmonicMenu}
            onClose={onCloseHarmonicMenu}
            onSelect={onSelectHarmonicPackage}
            uiConfig={uiConfig}
            activeBank={activeToneArray}
            controller={controller}
          />
        </Suspense>
      )}

      {/* Musical Tuning Modal */}
      {isMusicTuningModalOpen && (
        <Suspense fallback={null}>
          <MusicalTuningModal
            isOpen={isMusicTuningModalOpen}
            onClose={onCloseMusicTuningModal}
            pitch={musicPitchRef}
            onPitchChange={onMusicPitchChange}
            temperament={musicTemperament}
            onTemperamentChange={onMusicTemperamentChange}
            octaveShift={musicOctaveShift}
            onOctaveShiftChange={onMusicOctaveShiftChange}
            uiConfig={uiConfig}
          />
        </Suspense>
      )}

      {/* Musical Progression Modal */}
      {isProgressionModalOpen && (
        <Suspense fallback={null}>
          <MusicalProgressionModal
            isOpen={isProgressionModalOpen}
            onClose={onCloseProgressionModal}
            pitch={musicPitchRef}
            temperament={musicTemperament}
            octaveShift={musicOctaveShift}
            onPitchChange={onMusicPitchChange}
            onTemperamentChange={onMusicTemperamentChange}
            onOpenArchitect={onOpenArchitectFromProgression}
            isProgressionActive={isProgressionActive}
            onToggleProgression={onToggleProgression}
            masterStatus={masterStatus}
            onMasterPlayPause={onMasterPlayPause}
            onMasterStop={onMasterStop}
            onMasterClear={onMasterClear}
            activeMood={activeMood}
            onSelectMood={onSelectMood}
            activeProgressionId={activeProgressionId}
            onSelectProgression={onSelectProgression}
            currentChordIndex={currentChordIndex}
            advanceMode={progressionAdvanceMode}
            onAdvanceModeChange={onProgressionAdvanceModeChange}
            onAdvanceChord={onAdvanceChord}
            onPlaySingleChord={onPlaySingleChord}
            onSelectChordIndex={onSelectChordIndex}
            chordGlideConfig={controller.audio.chordGlideConfig}
            onChordGlideConfigChange={controller.audio.updateChordGlideConfig}
            customProgressions={customProgressions}
            onSaveAndActivateProgression={onSaveAndActivateProgression}
            onCustomProgressionsChange={onCustomProgressionsChange}
            breathConfig={controller.temporal.breathConfig}
            isBreathActive={controller.temporal.isBreathActive}
            onToggleBreathPacer={() => controller.temporal.setIsBreathActive((prev: boolean) => !prev)}
          />
        </Suspense>
      )}

      {/* Polyvagal Neuromodulation Modal */}
      {isPolyvagalModalOpen && (
        <Suspense fallback={null}>
          <PolyvagalModal
            isOpen={isPolyvagalModalOpen}
            onClose={onClosePolyvagalModal}
            config={controller.audio.polyvagalConfig}
            onUpdateConfig={controller.audio.updatePolyvagalConfig}
            onResetSession={(dur?: number) => {
              if (controller.audioSys?.resetPolyvagalSession) {
                controller.audioSys.resetPolyvagalSession(dur);
              }
            }}
            isAudioEnabled={controller.audioSys.audioEnabled}
            onEnableAudio={() => {
              if (!controller.audioSys.audioEnabled) {
                controller.toggleAudio();
              }
            }}
            uiConfig={uiConfig}
          />
        </Suspense>
      )}

      {/* Experience Designer Modal */}
      {isExperienceModalOpen && (
        <Suspense fallback={null}>
          <ExperienceDesignerModal
            isOpen={isExperienceModalOpen}
            onClose={onCloseExperienceModal}
            currentPitch={musicPitchRef}
            currentTemperament={musicTemperament}
            isPlaying={isExperienceActive}
            isPaused={isExperiencePaused}
            masterStatus={masterStatus}
            onMasterPlayPause={onMasterPlayPause}
            onMasterStop={onMasterStop}
            onMasterClear={onMasterClear}
            activeExperienceId={activeExperience?.id}
            activeBlockIndex={activeBlockIndex}
            blockProgress={blockProgress}
            currentCycle={currentExpCycle}
            totalCycles={activeExperience?.targetCycles || 4}
            onTogglePlayExperience={onTogglePlayExperience}
            onPlayAndImmerse={(exp) => onTogglePlayExperience(exp, { autoImmerse: true })}
            onToggleVisualizerImmersion={onToggleVisualizerImmersion}
            onStopExperience={onMasterStop}
            onAuditionBlock={onAuditionBlock}
            onJumpToBlock={onJumpToBlock}
            onPitchChange={onMusicPitchChange}
            onTemperamentChange={onMusicTemperamentChange}
            globalEntrainmentFreq={controller.temporal.binauralFreqs['UNIVERSAL'] || 8.0}
            globalEntrainmentLayers={resolveActiveLayers(controller.atmosphere.immersionConfig)}
            globalSenticEmotion={controller.temporal.breathConfig?.senticState || 'NO_EMOTION'}
            globalHeartSyncMode={controller.temporal.kickConfig?.syncMode || 'BREATH'}
            globalBpm={controller.temporal.kickConfig?.bpm || 60}
            globalComposerWarp={controller.atmosphere.immersionConfig?.composerWarp || 'LINEAR'}
            globalTimeCrystalTopology={controller.atmosphere.immersionConfig?.timeCrystalTopology || 'FIBONACCI'}
            globalTimeCrystalEnabled={!!controller.atmosphere.immersionConfig?.isTimeCrystal}
            globalPulseStyle={controller.audio.feedbackConfig?.pulseStyle || 'BLACK_SHUTTER'}
          />
        </Suspense>
      )}

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex justify-center items-start pt-20 z-50">
          <div className="bg-[#1a1a1e] p-6 rounded-2xl border border-white/10 w-72 shadow-2xl">
            <h3 className="text-white text-xs font-bold mb-4 uppercase tracking-wider text-center">Save Profile</h3>
            <input
              type="text"
              placeholder="e.g. Deep Meditation"
              className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white text-xs mb-4 focus:outline-none focus:border-cyan-400 transition-colors"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              autoFocus
            />
            <div
              className="flex items-center gap-3 mb-6 cursor-pointer group p-2 rounded-lg hover:bg-white/5"
              onClick={() => setIsSaveDefault(!isSaveDefault)}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isSaveDefault ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600 group-hover:border-slate-400'
                }`}
              >
                {isSaveDefault && <Check size={10} className="text-black stroke-[3]" />}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isSaveDefault ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              >
                Set as startup default
              </span>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={onCloseSaveModal}
                className="px-4 py-2 text-slate-400 hover:text-white text-[10px] uppercase font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSavePresetConfirm}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] uppercase font-bold transition-colors shadow-lg shadow-cyan-900/20"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
