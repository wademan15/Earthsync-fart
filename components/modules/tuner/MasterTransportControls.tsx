import React from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

export type MasterTransportStatus = 'IDLE' | 'PLAYING' | 'PAUSED';

export interface MasterTransportControlsProps {
  status: MasterTransportStatus;
  onPlayPause: () => void;
  onStop: () => void;
  onClear: () => void;
  variant?: 'header' | 'modal' | 'compact';
  className?: string;
  labels?: {
    play?: string;
    pause?: string;
    resume?: string;
    stop?: string;
    clear?: string;
  };
}

export const MasterTransportControls: React.FC<MasterTransportControlsProps> = ({
  status,
  onPlayPause,
  onStop,
  onClear,
  variant = 'header',
  className = '',
  labels,
}) => {
  const isPlaying = status === 'PLAYING';
  const isPaused = status === 'PAUSED';
  const isIdle = status === 'IDLE';

  const playLabel = labels?.play || 'Play';
  const pauseLabel = labels?.pause || 'Pause';
  const resumeLabel = labels?.resume || 'Resume';
  const stopLabel = labels?.stop || 'Stop';
  const clearLabel = labels?.clear || 'Clean Slate';

  if (variant === 'modal') {
    return (
      <div className={`flex items-center gap-1 sm:gap-1.5 shrink-0 ${className}`}>
        {/* Play / Pause / Resume Button */}
        <button
          onClick={onPlayPause}
          title={
            isPlaying
              ? 'Pause Playback (Preserves position and state)'
              : isPaused
                ? 'Resume Playback'
                : 'Start Playback'
          }
          className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border min-h-[34px] ${
            isPlaying
              ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] hover:brightness-105 active:scale-95'
              : isPaused
                ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:bg-amber-500/35 active:scale-95'
                : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-black border-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.3)] hover:brightness-110 active:scale-95'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause size={13} className="fill-current" />
              <span>{pauseLabel}</span>
            </>
          ) : (
            <>
              <Play size={13} className="fill-current ml-0.5" />
              <span>{isPaused ? resumeLabel : playLabel}</span>
            </>
          )}
        </button>

        {/* Stop Button */}
        {(!isIdle || variant === 'modal') && (
          <button
            onClick={onStop}
            disabled={isIdle}
            title={`${stopLabel} (Silences audio and rewinds timers to 0)`}
            aria-label={stopLabel}
            className={`p-2 rounded-lg border transition-all min-h-[34px] min-w-[34px] flex items-center justify-center ${
              !isIdle
                ? 'bg-rose-500/20 text-rose-300 hover:text-rose-200 hover:bg-rose-500/30 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.2)] active:scale-95'
                : 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed opacity-40'
            }`}
          >
            <Square size={12} className="fill-current" />
          </button>
        )}

        {/* Clear Button (Clean Slate) */}
        <button
          onClick={onClear}
          title={`${clearLabel} (Silences audio and resets session state while keeping volume, EQ, visualizer & modulation matrix intact)`}
          aria-label={clearLabel}
          className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition-all min-h-[34px] min-w-[34px] flex items-center justify-center active:scale-95 group"
        >
          <RotateCcw size={12} className="transition-transform group-hover:-rotate-45" />
        </button>
      </div>
    );
  }

  // Header / Compact variant
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Play / Pause / Resume Button */}
      <button
        onClick={onPlayPause}
        title={
          isPlaying
            ? 'Pause Master System (Audio, Breath & Progression)'
            : isPaused
              ? 'Resume Master System'
              : 'Play Master System'
        }
        aria-label={isPlaying ? 'Pause Master System' : isPaused ? 'Resume Master System' : 'Play Master System'}
        className={`flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-full font-bold text-xs transition-all duration-200 min-w-[34px] min-h-[34px] ${
          isPlaying
            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)] hover:bg-emerald-500/35 active:scale-95'
            : isPaused
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 active:scale-95'
              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 hover:border-teal-400/50 active:scale-95'
        }`}
      >
        {isPlaying ? (
          <Pause size={13} className="fill-current" />
        ) : (
          <Play size={13} className="fill-current ml-0.5" />
        )}
        <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider">
          {isPlaying ? pauseLabel : isPaused ? resumeLabel : playLabel}
        </span>
      </button>

      {/* Stop Button */}
      {!isIdle && (
        <button
          onClick={onStop}
          title="Stop Master System (Rewinds timers & silences output)"
          aria-label="Stop Master System"
          className="p-1.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all min-w-[30px] min-h-[30px] flex items-center justify-center active:scale-95"
        >
          <Square size={11} className="fill-current" />
        </button>
      )}

      {/* Clear Button (Clean Slate) */}
      <button
        onClick={onClear}
        title="Clean Slate (Silences audio and resets session state while keeping volume, EQ, visualizer & modulation matrix intact)"
        aria-label="Clean Slate"
        className="p-1.5 rounded-full text-slate-400 hover:text-amber-400 hover:bg-amber-500/15 transition-all min-w-[30px] min-h-[30px] flex items-center justify-center active:scale-95 group"
      >
        <RotateCcw size={11} className="transition-transform group-hover:-rotate-45" />
      </button>
    </div>
  );
};
