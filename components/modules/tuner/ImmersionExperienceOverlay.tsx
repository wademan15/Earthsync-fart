import React from 'react';
import { Play, Pause, Square, Sliders, Minimize } from 'lucide-react';
import { ExperiencePreset } from '../../types';

export interface ImmersionExperienceOverlayProps {
  isVisualizerImmersion: boolean;
  isImmersionHudVisible: boolean;
  onExitImmersion: () => void;
  isExperienceActive: boolean;
  isExperiencePaused: boolean;
  activeExperience: ExperiencePreset | null;
  activeBlockIndex: number;
  blockProgress: number;
  currentExpCycle: number;
  onTogglePlayExperience: (preset?: ExperiencePreset) => void;
  onStopExperience: () => void;
  onOpenDesigner: () => void;
}

export const ImmersionExperienceOverlay: React.FC<ImmersionExperienceOverlayProps> = ({
  isVisualizerImmersion,
  isImmersionHudVisible,
  onExitImmersion,
  isExperienceActive,
  isExperiencePaused,
  activeExperience,
  activeBlockIndex,
  blockProgress,
  currentExpCycle,
  onTogglePlayExperience,
  onStopExperience,
  onOpenDesigner
}) => {
  if (!isVisualizerImmersion) return null;

  return (
    <>
      {/* Top-Right Exit Fullscreen Button */}
      <div
        className={`absolute z-50 pointer-events-auto top-4 right-4 transition-opacity duration-300 ${
          isImmersionHudVisible ? 'opacity-90 hover:opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={onExitImmersion}
          title="Exit Visualizer Fullscreen"
          aria-label="Exit Visualizer Fullscreen"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/95 backdrop-blur-md border border-cyan-500/40 text-cyan-300 hover:text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all text-xs font-mono font-bold tracking-wider"
        >
          <Minimize size={13} />
          <span>Exit Fullscreen</span>
        </button>
      </div>

      {/* Floating Immersion Experience HUD (Bottom Center) */}
      {isExperienceActive && (
        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-300 ${
            isImmersionHudVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          <div className="flex flex-col gap-1.5 bg-slate-950/85 backdrop-blur-xl border border-teal-500/30 shadow-[0_0_25px_rgba(20,184,166,0.25)] rounded-2xl px-3.5 py-2.5 min-w-[280px] sm:min-w-[340px] max-w-[92vw]">
            {/* Top Row: Experience Title & Phase info */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping shrink-0" />
                <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                  {activeExperience?.name || 'Experience Active'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-teal-300/80 bg-teal-500/15 border border-teal-500/30 px-1.5 py-0.5 rounded shrink-0">
                {activeExperience?.loopMode === 'CYCLE_COUNT'
                  ? `Cycle ${currentExpCycle}/${activeExperience.targetCycles || 4}`
                  : `Cycle ${currentExpCycle} · ∞`}
              </span>
            </div>

            {/* Progress Bar with Phase Color */}
            {activeExperience?.blocks[activeBlockIndex] && (
              <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-300 transition-all duration-100 ease-linear rounded-full"
                  style={{ width: `${Math.round(blockProgress * 100)}%` }}
                />
              </div>
            )}

            {/* Controls Row */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="text-[11px] font-bold text-teal-200">
                  #{activeBlockIndex + 1}{' '}
                  {activeExperience?.blocks[activeBlockIndex]?.label ||
                    (activeExperience?.blocks[activeBlockIndex]?.breathPhase === 'INHALE'
                      ? 'Inhale'
                      : activeExperience?.blocks[activeBlockIndex]?.breathPhase === 'HOLD_IN'
                      ? 'Apex Hold'
                      : activeExperience?.blocks[activeBlockIndex]?.breathPhase === 'EXHALE'
                      ? 'Exhale'
                      : activeExperience?.blocks[activeBlockIndex]?.breathPhase === 'HOLD_OUT'
                      ? 'Low Rest'
                      : 'Flow')}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ({activeExperience?.blocks[activeBlockIndex]?.durationSeconds || 4}s)
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Play / Pause Toggle */}
                <button
                  onClick={() => onTogglePlayExperience(activeExperience || undefined)}
                  title={isExperiencePaused ? 'Resume Experience' : 'Pause Experience'}
                  className="p-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition-all flex items-center justify-center min-w-[28px] min-h-[28px]"
                >
                  {isExperiencePaused ? (
                    <Play size={12} className="fill-current" />
                  ) : (
                    <Pause size={12} className="fill-current" />
                  )}
                </button>

                {/* Stop Experience */}
                <button
                  onClick={onStopExperience}
                  title="Stop Experience"
                  className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all flex items-center justify-center min-w-[28px] min-h-[28px]"
                >
                  <Square size={11} className="fill-current" />
                </button>

                {/* Open Designer */}
                <button
                  onClick={onOpenDesigner}
                  title="Open Experience Designer"
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/15 transition-all text-[11px] font-semibold flex items-center gap-1"
                >
                  <Sliders size={11} />
                  <span>Designer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default ImmersionExperienceOverlay;
