import React from 'react';
import { Sliders, Shield, Maximize, Minimize, Atom, X, Cpu, Info } from 'lucide-react';
import { EarthSyncLogo } from '../../ui/EarthSyncLogo';
import { AudioMixerModal } from '../AudioMixerModal';
import { ExperiencePreset } from '../../types';
import { MasterTransportControls, MasterTransportStatus } from './MasterTransportControls';
import type { usePlanetaryExperience } from './hooks/usePlanetaryExperience';
import type { usePlanetaryController } from '../../../hooks/usePlanetaryController';

export interface TunerTopHeaderProps {
  uiConfig: {
    appBgColor?: string;
    textColor?: string;
    primaryColor?: string;
    borderRgb?: string;
    borderOpacity?: number;
    [key: string]: unknown;
  };
  isAudioMixerOpen: boolean;
  onToggleAudioMixer: () => void;
  onCloseAudioMixer: () => void;
  controller: ReturnType<typeof usePlanetaryController>;
  onOpenBreathArchitect: () => void;
  isPolyvagalModalOpen: boolean;
  onTogglePolyvagalModal: () => void;
  isExperienceActive?: boolean;
  isExperiencePaused?: boolean;
  isMasterPlaying?: boolean;
  isMasterPaused?: boolean;
  onToggleMasterPlay?: () => void;
  masterStatus?: MasterTransportStatus;
  onMasterPlayPause?: () => void;
  onMasterStop?: () => void;
  onMasterClear?: () => void;
  activeExperience?: ExperiencePreset | null;
  activeBlockIndex?: number;
  blockProgress?: number;
  currentExpCycle?: number;
  onTogglePlayExperience?: (preset?: ExperiencePreset) => void;
  onStopExperience?: () => void;
  isExperienceModalOpen?: boolean;
  onToggleExperienceModal?: () => void;
  experience?: ReturnType<typeof usePlanetaryExperience>;
  isVisualizerImmersion: boolean;
  onToggleVisualizerImmersion: () => void;
  viewMode?: string;
  onToggleViewMode?: () => void;
  onOpenStyleEditor?: () => void;
  showStyleEditor?: boolean;
  onOpenInfo?: () => void;
  starterExperiences: ExperiencePreset[];
}

export const TunerTopHeader: React.FC<TunerTopHeaderProps> = (props) => {
  const {
    uiConfig,
    isAudioMixerOpen,
    onToggleAudioMixer,
    onCloseAudioMixer,
    controller,
    onOpenBreathArchitect,
    isPolyvagalModalOpen,
    onTogglePolyvagalModal,
    isVisualizerImmersion,
    onToggleVisualizerImmersion,
    viewMode,
    onToggleViewMode,
    onOpenStyleEditor,
    showStyleEditor,
    onOpenInfo,
    starterExperiences,
    experience
  } = props;

  const isExperienceActive = props.isExperienceActive ?? experience?.isExperienceActive ?? false;
  const isExperiencePaused = props.isExperiencePaused ?? experience?.isExperiencePaused ?? false;
  const isMasterPlaying = props.isMasterPlaying ?? (experience?.isMasterActive && !experience?.isMasterPaused) ?? false;
  const isMasterPaused = props.isMasterPaused ?? experience?.isMasterPaused ?? false;
  const onToggleMasterPlay = props.onToggleMasterPlay ?? experience?.handleToggleMasterPlay;
  const masterStatus = props.masterStatus ?? experience?.masterStatus;
  const onMasterPlayPause = props.onMasterPlayPause ?? experience?.handleToggleMasterPlay;
  const onMasterStop = props.onMasterStop ?? experience?.handleMasterStop;
  const onMasterClear = props.onMasterClear ?? experience?.handleMasterClear;
  const activeExperience = props.activeExperience !== undefined ? props.activeExperience : (experience?.activeExperience ?? null);
  const activeBlockIndex = props.activeBlockIndex ?? experience?.activeBlockIndex ?? 0;
  const blockProgress = props.blockProgress ?? experience?.blockProgress ?? 0;
  const onTogglePlayExperience = props.onTogglePlayExperience ?? experience?.handleTogglePlayExperience;
  const onStopExperience = props.onStopExperience ?? experience?.handleMasterStop;

  if (isVisualizerImmersion) return null;

  return (
    <header
      className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b z-50 shrink-0 transition-colors duration-300 relative"
      style={{
        backgroundColor: uiConfig.appBgColor,
        borderColor: `rgba(${uiConfig.borderRgb || '255,255,255'}, ${uiConfig.borderOpacity ?? 0.1})`
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <EarthSyncLogo
          className="h-7 sm:h-9 w-auto shrink-0"
          mainColor={uiConfig.textColor}
          accentColor={uiConfig.primaryColor}
        />
        <span className="text-[11px] font-semibold tracking-widest uppercase text-cyan-400/80 hidden sm:inline-block border-l border-white/10 pl-3 truncate">
          Breath Pacer
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Audio Mixer Controls Button & Dropdown */}
        <div className="relative">
          <button
            onClick={onToggleAudioMixer}
            title="Audio Mixer & Controls"
            aria-label="Audio Mixer & Controls"
            className={`flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-full border transition-all duration-200 text-xs font-semibold min-w-[34px] min-h-[34px] ${
              isAudioMixerOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-transparent text-slate-400 border-white/10 hover:text-white hover:border-white/25 hover:bg-white/5'
            }`}
          >
            <Sliders size={14} className={isAudioMixerOpen ? 'text-cyan-400' : ''} />
            <span className="hidden md:inline text-[10px] uppercase font-bold tracking-wider">Mixer</span>
          </button>

          {isAudioMixerOpen && (
            <React.Suspense fallback={null}>
              <AudioMixerModal
                isOpen={isAudioMixerOpen}
                onClose={onCloseAudioMixer}
                controller={controller}
                onOpenBreathArchitect={onOpenBreathArchitect}
              />
            </React.Suspense>
          )}
        </div>

        {/* Polyvagal Neuromodulation Button & Pulse Indicator */}
        <div className="relative">
          <button
            onClick={onTogglePolyvagalModal}
            title="Polyvagal Neuromodulation & Middle-Ear Acoustic Conditioning"
            aria-label="Polyvagal Neuromodulation"
            className={`flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-full border transition-all duration-200 text-xs font-semibold min-w-[34px] min-h-[34px] ${
              isPolyvagalModalOpen
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                : controller.audio?.polyvagalConfig?.enabled && !controller.audio?.polyvagalConfig?.isEmergencyGrounded
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'bg-transparent text-slate-400 border-white/10 hover:text-white hover:border-white/25 hover:bg-white/5'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Shield
                size={14}
                className={
                  controller.audio?.polyvagalConfig?.enabled && !controller.audio?.polyvagalConfig?.isEmergencyGrounded
                    ? 'text-emerald-400'
                    : ''
                }
              />
              {controller.audio?.polyvagalConfig?.enabled && !controller.audio?.polyvagalConfig?.isEmergencyGrounded && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <span className="hidden md:inline text-[10px] uppercase font-bold tracking-wider">Polyvagal</span>
          </button>
        </div>

        {/* Master Play / Pause / Stop / Clear Controls */}
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-full border border-white/10 shadow-sm backdrop-blur-sm">
          <MasterTransportControls
            status={
              masterStatus ??
              ((isMasterPlaying !== undefined ? isMasterPlaying : isExperienceActive && !isExperiencePaused)
                ? 'PLAYING'
                : (isMasterPaused !== undefined ? isMasterPaused : isExperiencePaused)
                  ? 'PAUSED'
                  : 'IDLE')
            }
            onPlayPause={
              onMasterPlayPause ||
              onToggleMasterPlay ||
              (() => {
                if (isExperienceActive) {
                  onTogglePlayExperience();
                } else {
                  onTogglePlayExperience(activeExperience || starterExperiences[0]);
                }
              })
            }
            onStop={onMasterStop || onStopExperience}
            onClear={onMasterClear || onStopExperience}
            variant="header"
          />

          {/* Active Block Progress & Phase Indicator */}
          {isExperienceActive && (
            <div className="hidden lg:flex items-center gap-2 px-2 py-0.5 text-[10px] font-medium text-slate-300 bg-white/5 rounded-full border border-white/10">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-semibold truncate max-w-[110px]">
                  {activeExperience?.blocks[activeBlockIndex]?.label || `Phase ${activeBlockIndex + 1}`}
                </span>
              </div>
              <span className="text-slate-400 text-[9px] tabular-nums">
                {Math.max(
                  0,
                  Math.ceil((activeExperience?.blocks[activeBlockIndex]?.durationSeconds || 4) * (1 - blockProgress))
                )}
                s
              </span>
              <div className="w-8 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-75"
                  style={{ width: `${Math.round(blockProgress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Visualizer Fullscreen Button */}
        <button
          onClick={onToggleVisualizerImmersion}
          title={isVisualizerImmersion ? 'Exit Visualizer Fullscreen' : 'Visualizer Fullscreen Immersion'}
          aria-label={isVisualizerImmersion ? 'Exit Visualizer Fullscreen' : 'Visualizer Fullscreen Immersion'}
          className={`flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-full border transition-all duration-200 text-xs font-semibold min-w-[34px] min-h-[34px] ${
            isVisualizerImmersion
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'bg-transparent text-slate-400 border-white/10 hover:text-white hover:border-white/25 hover:bg-white/5'
          }`}
        >
          {isVisualizerImmersion ? <Minimize size={14} /> : <Maximize size={14} />}
          <span className="hidden lg:inline text-[10px] uppercase font-bold tracking-wider">Fullscreen</span>
        </button>

        {/* Designer Studio / Player Mode Toggle */}
        {onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            title={viewMode === 'PLAYER' ? 'Switch to Designer Studio' : 'Return to Player View'}
            className={`p-2 rounded-full border transition-colors min-w-[34px] min-h-[34px] flex items-center justify-center ${
              viewMode === 'STUDIO'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-transparent text-slate-500 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            {viewMode === 'PLAYER' ? <Atom size={15} /> : <X size={15} />}
          </button>
        )}

        {/* Theme / Style Editor (Studio only) */}
        {viewMode === 'STUDIO' && onOpenStyleEditor && (
          <button
            onClick={onOpenStyleEditor}
            title="Theme & Style Editor"
            className={`p-2 rounded-full border transition-colors min-w-[34px] min-h-[34px] flex items-center justify-center ${
              showStyleEditor
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-transparent text-slate-500 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu size={15} />
          </button>
        )}

        {/* Info Button */}
        {onOpenInfo && (
          <button
            onClick={onOpenInfo}
            title="Info & Telemetry"
            className="p-2 rounded-full border transition-colors bg-transparent text-slate-500 border-transparent hover:text-white hover:bg-white/5 min-w-[34px] min-h-[34px] flex items-center justify-center"
          >
            <Info size={15} />
          </button>
        )}
      </div>
    </header>
  );
};
export default TunerTopHeader;
