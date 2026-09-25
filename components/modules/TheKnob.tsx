import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getFrequencyColor, getMerrickColor } from './visuals/shared';

export interface TheKnobProps {
  frequency: number;
  onChange: (freq: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  volume?: number;
  onVolumeChange?: (vol: number) => void;
  color?: string;
  size?: 'compact' | 'standard' | 'large';
  showPresets?: boolean;
  showStepControls?: boolean;
  onClose?: () => void;
}

const MIN_FREQ = 20.0;
const MAX_FREQ = 2000.0;

/**
 * Converts frequency to 0..1 normalized logarithmic value
 */
function freqToNorm(freq: number): number {
  const clamped = Math.max(MIN_FREQ, Math.min(MAX_FREQ, freq));
  return Math.log2(clamped / MIN_FREQ) / Math.log2(MAX_FREQ / MIN_FREQ);
}

/**
 * Converts 0..1 normalized logarithmic value to whole integer frequency in Hz
 */
function normToFreq(norm: number): number {
  const clamped = Math.max(0, Math.min(1, norm));
  const val = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, clamped);
  return Math.round(val);
}

export const TheKnob: React.FC<TheKnobProps> = ({
  frequency,
  onChange,
  isMuted,
  onToggleMute,
  color,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingHz, setIsEditingHz] = useState(false);
  const [tempHzInput, setTempHzInput] = useState('');
  
  // Drag reference tracking
  const dragStartRef = useRef<{ startY: number; startX: number; startNorm: number } | null>(null);

  const norm = useMemo(() => freqToNorm(frequency), [frequency]);
  
  // Angle: from -135deg (min) to +135deg (max) => 270 deg total range
  const angleDeg = -135 + norm * 270;

  // Derive dynamic color
  const dynamicColor = useMemo(() => {
    return color || getMerrickColor(frequency) || getFrequencyColor(frequency) || '#06b6d4';
  }, [frequency, color]);

  // Smooth, calibrated musical drag physics
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    dragStartRef.current = {
      startY: e.clientY,
      startX: e.clientX,
      startNorm: freqToNorm(frequency)
    };
  }, [frequency]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    e.preventDefault();

    const { startY, startX, startNorm } = dragStartRef.current;
    const deltaY = startY - e.clientY; // Up = positive (increase)
    const deltaX = e.clientX - startX; // Right = positive (increase)
    const totalDelta = deltaY + (deltaX * 0.4);

    // Responsive drag sensitivity
    const sensitivity = e.shiftKey ? 1800.0 : 650.0;
    const normDelta = totalDelta / sensitivity;
    const targetNorm = Math.max(0, Math.min(1, startNorm + normDelta));
    
    const newFreq = normToFreq(targetNorm);
    onChange(newFreq);
  }, [isDragging, onChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Mouse Wheel: 1 Hz steps (or 10 Hz with Shift)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const step = e.shiftKey ? 10 : 1;
    const delta = e.deltaY < 0 ? step : -step;
    const nextFreq = Math.max(MIN_FREQ, Math.min(MAX_FREQ, Math.round(frequency + delta)));
    onChange(nextFreq);
  }, [frequency, onChange]);

  const handleHzSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(tempHzInput);
    if (!isNaN(parsed) && parsed >= MIN_FREQ && parsed <= MAX_FREQ) {
      onChange(Math.round(parsed * 100) / 100);
    }
    setIsEditingHz(false);
  };

  // Ultra-compact dimensions: perfectly fits within dock without overflowing or covering entrainment pill
  const diameter = 44;
  const strokeWidth = 3.5;
  const radius = (diameter - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const dashOffset = arcLength * (1 - norm);

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/10 shadow-lg text-slate-100 font-sans select-none shrink-0">
      
      {/* Rotary Knob Dial */}
      <div 
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        title="Drag up/down to tune frequency"
        className={`relative shrink-0 cursor-ns-resize flex items-center justify-center p-0.5 rounded-full transition-all duration-150 ${
          isDragging ? 'scale-105' : 'hover:scale-[1.03]'
        }`}
        style={{ width: diameter, height: diameter, touchAction: 'none' }}
      >
        {/* SVG Dial Arc */}
        <svg 
          width={diameter} 
          height={diameter} 
          className="absolute inset-0 pointer-events-none transform rotate-[135deg]"
          style={{ filter: `drop-shadow(0 0 5px ${dynamicColor}40)` }}
        >
          {/* Background Track Arc */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active Filled Arc */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={dynamicColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Knurled Core & Mute/Live Button */}
        <div
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: diameter - strokeWidth * 2 - 5,
            height: diameter - strokeWidth * 2 - 5,
            background: 'radial-gradient(circle at 35% 35%, #2a2f3a 0%, #11141b 75%, #080a0e 100%)',
            boxShadow: `inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.5)`,
            border: `1px solid rgba(255,255,255,0.12)`
          }}
        >
          {/* Rotating Marker Dot */}
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-75"
            style={{ transform: `rotate(${angleDeg}deg)` }}
          >
            <div className="absolute top-0.5 left-1/2 -translate-x-1/2">
              <div 
                className="w-1.5 h-1.5 rounded-full"
                style={{ 
                  backgroundColor: dynamicColor,
                  boxShadow: `0 0 5px ${dynamicColor}` 
                }}
              />
            </div>
          </div>

          {/* Sound Mute Toggle Core Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            title={isMuted ? "Unmute" : "Mute"}
            className={`z-10 w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all ${
              isMuted 
                ? 'bg-slate-900/90 text-slate-500 hover:text-slate-300' 
                : 'text-white shadow-sm'
            }`}
            style={{
              backgroundColor: isMuted ? undefined : `${dynamicColor}35`,
            }}
          >
            {isMuted ? (
              <VolumeX className="w-2.5 h-2.5 opacity-60" />
            ) : (
              <Volume2 
                className="w-2.5 h-2.5" 
                style={{ color: dynamicColor }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Frequency Readout */}
      {isEditingHz ? (
        <form onSubmit={handleHzSubmit} className="flex items-center">
          <input
            type="number"
            step="1"
            min={MIN_FREQ}
            max={MAX_FREQ}
            autoFocus
            value={tempHzInput}
            onChange={(e) => setTempHzInput(e.target.value)}
            onBlur={() => setIsEditingHz(false)}
            className="w-16 px-1 py-0.5 text-center font-mono text-sm font-bold bg-slate-950 border border-cyan-500 rounded text-white focus:outline-none shadow-inner"
          />
          <span className="text-[10px] font-mono text-slate-400 ml-1">Hz</span>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setTempHzInput(Number.isInteger(frequency) ? frequency.toString() : frequency.toFixed(2));
            setIsEditingHz(true);
          }}
          title="Click to type exact frequency in Hz"
          className="flex items-baseline gap-1 px-1.5 py-0.5 rounded bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/20 transition-all cursor-text"
        >
          <span 
            className="text-sm font-black font-mono tracking-tight"
            style={{ color: isMuted ? '#94a3b8' : dynamicColor }}
          >
            {Number.isInteger(frequency) ? frequency : frequency.toFixed(1)}
          </span>
          <span className="text-[9px] font-mono text-slate-400 uppercase">Hz</span>
        </button>
      )}

    </div>
  );
};
