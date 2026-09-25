import React, { useState } from 'react';
import { 
  Activity, ChevronDown, X, Heart, Wind, Timer, Music2, SlidersHorizontal, 
  Volume2, Play, Spline, EyeOff, Circle, Sparkles, CircleDot, ChevronsUp, 
  Waves, Square, Bell, Music, Radio, Eye, Smartphone, Network, VolumeX, Sliders,
  Link2, Unlink, Gauge
} from 'lucide-react';
import { Fader } from '../../ui/Faders';
import { SoundDesignMenu } from '../SoundDesignMenu';
import { TideMeter } from '../designers/BreathDesigner';
import { getPacerColors, PACER_STYLES, PACER_COLOR_SCHEMES } from '../../../services/audio/pacerStyles';
import { getHeartColor, HEARTBEAT_PRESET_OPTIONS } from '../../../services/audio/heartStyles';
import { SENTIC_STATES, SenticEmotion } from '../../../services/kinematics/senticForms';
import { triggerHeartPulse } from '../../../services/audio/HeartSynth';
import { previewCueTone } from '../../../services/audio/BreathSynth';
import { HarmonicColorWheelId } from '../../../data/colorWheels';
import { usePlanetaryController } from '../../../hooks/usePlanetaryController';

export interface LayoutElement {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

export const SENTIC_EMOTION_META: { id: SenticEmotion; name: string; tag: string; color: string }[] = [
  { id: 'NO_EMOTION', name: 'Natural', tag: 'Linear', color: '#94a3b8' },
  { id: 'LOVE', name: 'Love', tag: 'Anahata', color: '#f472b6' },
  { id: 'JOY', name: 'Joy', tag: 'Burst & Rebound', color: '#fbbf24' },
  { id: 'REVERENCE', name: 'Reverence', tag: 'Vast Expansion', color: '#c084fc' },
  { id: 'GRIEF', name: 'Grief', tag: 'Passive Release', color: '#60a5fa' },
  { id: 'ANGER', name: 'Anger', tag: 'Forceful Spike', color: '#ef4444' },
  { id: 'HATE', name: 'Hate', tag: 'Tension Hold', color: '#b91c1c' },
  { id: 'SEX', name: 'Eros', tag: 'Swell & Surge', color: '#e11d48' },
];

export const generateSenticSvgPath = (lut?: Float32Array, width = 120, height = 30): string => {
  if (!lut || lut.length === 0) return `M 0 ${height} L ${width} ${height}`;
  const steps = 30;
  const stepSize = Math.floor(lut.length / steps);
  let path = `M 0 ${(height - lut[0] * (height - 6) - 3).toFixed(1)}`;
  for (let i = 1; i <= steps; i++) {
    const idx = Math.min(lut.length - 1, i * stepSize);
    const x = ((i / steps) * width).toFixed(1);
    const y = (height - (lut[idx] * (height - 6)) - 3).toFixed(1);
    path += ` L ${x} ${y}`;
  }
  return path;
};

export const COMPOSER_WARP_PRESETS = [
  { id: 'LINEAR', name: 'Linear', tag: 'Natural Flow' },
  { id: 'BEETHOVEN', name: 'Beethoven', tag: 'Will & Drive' },
  { id: 'MOZART', name: 'Mozart', tag: 'Light & Joy' },
  { id: 'CHOPIN', name: 'Chopin', tag: 'Rubato Emotion' },
  { id: 'BACH', name: 'Bach', tag: 'Precise Logic' },
  { id: 'SCHUBERT', name: 'Schubert', tag: 'Longing & Depth' },
  { id: 'HAYDN', name: 'Haydn', tag: 'Awe & Balance' },
  { id: 'BRAHMS', name: 'Brahms', tag: 'Symphonic Sweep' }
];

export const PULSE_PRESETS = [
  { id: 'BLACK_SHUTTER', name: 'Black Dim', tag: 'Dark Shutter', color: '#000000', iconColor: '#94a3b8' },
  { id: 'WHITE_BLOOM', name: 'White Bloom', tag: 'Alabaster Flash', color: '#ffffff', iconColor: '#f8fafc' },
  { id: 'INVERT_NEGATIVE', name: 'Invert Color', tag: 'Negative Flash', color: '#818cf8', iconColor: '#c084fc' },
  { id: 'CYAN_AURA', name: 'Cyan Aura', tag: 'Aether Cyan', color: '#06b6d4', iconColor: '#22d3ee' },
  { id: 'SOLAR_GOLD', name: 'Solar Gold', tag: 'Solar Frequency', color: '#eab308', iconColor: '#facc15' },
  { id: 'VIOLET_CROWN', name: 'Violet Crown', tag: 'Cosmic Amethyst', color: '#a855f7', iconColor: '#c084fc' },
  { id: 'ROSE_HEART', name: 'Rose Heart', tag: '528Hz Love', color: '#f43f5e', iconColor: '#fb7185' },
  { id: 'EMERALD_LIFE', name: 'Emerald Earth', tag: 'Life Harmony', color: '#10b981', iconColor: '#34d399' },
  { id: 'RAINBOW_CHROMA', name: 'Prism Chroma', tag: 'Spectral Flow', color: '#ec4899', iconColor: '#f472b6' },
  { id: 'RADIAL_IRIS', name: 'Radial Iris', tag: 'Tunnel Focus', color: '#38bdf8', iconColor: '#38bdf8' },
  { id: 'STROBE_FLASH', name: 'Strobe Flash', tag: 'Brainwave Driving', color: '#fbbf24', iconColor: '#fde047' },
];

export const PACER_BELL_TONES = [
  { id: 'SINE_BELL', name: 'Pure Sine Tone', tag: 'Serene & Peaceful' },
  { id: 'BOWL', name: 'Singing Bowl', tag: 'Harmonic' },
  { id: 'TIBETAN', name: 'Tingsha / Tibetan Bowl', tag: 'Metallic' },
  { id: 'WOOD', name: 'Bronze / Wood Bell', tag: 'Percussive' },
  { id: 'TRIANGLE', name: 'Crystal Chime / Triangle', tag: 'Crystalline' },
  { id: 'HARP', name: 'Binaural Ping / Harp', tag: 'Plucked' },
  { id: 'PIANO', name: 'Piano Chime', tag: 'Acoustic' },
  { id: 'GONG', name: 'Temple Gong', tag: 'Deep Ring' },
  { id: 'OM', name: 'Om Resonance', tag: 'Vocal Drone' },
  { id: 'CELLO', name: 'Cello Drone', tag: 'Bowed' },
  { id: 'SYNTH', name: 'Analog Synth', tag: 'Warm Sub' },
  { id: 'WATER', name: 'Water Droplet', tag: 'Liquid' },
  { id: 'SHAKER', name: 'Shaker', tag: 'Transient' },
  { id: 'NONE', name: 'Muted / Off', tag: 'Silent' },
];

export const PACER_BELL_KEYS = [
  { id: 'C', name: 'C', type: 'musical', freq: 261.63 },
  { id: 'C#', name: 'C# / Db', type: 'musical', freq: 277.18 },
  { id: 'D', name: 'D', type: 'musical', freq: 293.66 },
  { id: 'D#', name: 'D# / Eb', type: 'musical', freq: 311.13 },
  { id: 'E', name: 'E', type: 'musical', freq: 329.63 },
  { id: 'F', name: 'F', type: 'musical', freq: 349.23 },
  { id: 'F#', name: 'F# / Gb', type: 'musical', freq: 369.99 },
  { id: 'G', name: 'G', type: 'musical', freq: 392.00 },
  { id: 'G#', name: 'G# / Ab', type: 'musical', freq: 415.30 },
  { id: 'A', name: 'A (Concert 440)', type: 'musical', freq: 440.00 },
  { id: 'A#', name: 'A# / Bb', type: 'musical', freq: 466.16 },
  { id: 'B', name: 'B', type: 'musical', freq: 493.88 },
  // Solfeggio Frequencies
  { id: 'SOL_528', name: '528 Hz (Love / DNA Repair)', type: 'solfeggio', freq: 528.00 },
  { id: 'SOL_432', name: '432 Hz (Verdi / Nature)', type: 'solfeggio', freq: 432.00 },
  { id: 'SOL_396', name: '396 Hz (Liberation / Root)', type: 'solfeggio', freq: 396.00 },
  { id: 'SOL_417', name: '417 Hz (Change / Sacral)', type: 'solfeggio', freq: 417.00 },
  { id: 'SOL_639', name: '639 Hz (Harmonious Heart)', type: 'solfeggio', freq: 639.00 },
  { id: 'SOL_741', name: '741 Hz (Intuition / Throat)', type: 'solfeggio', freq: 741.00 },
  { id: 'SOL_852', name: '852 Hz (Spiritual Order)', type: 'solfeggio', freq: 852.00 },
  { id: 'SOL_963', name: '963 Hz (Crown / Pineal)', type: 'solfeggio', freq: 963.00 },
  { id: 'SOL_174', name: '174 Hz (Pain Relief / Earth)', type: 'solfeggio', freq: 174.00 },
  { id: 'SOL_285', name: '285 Hz (Cellular Healing)', type: 'solfeggio', freq: 285.00 },
  // Scientific & Planetary
  { id: 'SCHUMANN', name: 'Schumann Resonance (250.6Hz)', type: 'scientific', freq: 250.56 },
  { id: 'EARTH_OM', name: 'Earth Om (136.1Hz)', type: 'scientific', freq: 136.10 },
  { id: 'FIFTHS', name: 'Pythagorean Fifths (384Hz)', type: 'scientific', freq: 384.00 },
  { id: 'PHI', name: 'Golden Ratio Phi (414.2Hz)', type: 'scientific', freq: 414.21 },
  { id: 'HARMONIC', name: 'Harmonic 512 (512Hz)', type: 'scientific', freq: 512.00 },
  { id: 'PLANCK', name: 'Planck Scale (256Hz)', type: 'scientific', freq: 256.00 },
  { id: 'TRITONE', name: 'Sacred Tritone (362Hz)', type: 'scientific', freq: 361.98 },
  { id: 'HEART', name: 'Heart Sync (Dynamic BPM)', type: 'scientific', freq: 128.00 },
];

export const PACER_TIDE_TEXTURES = [
  { id: 'OCEAN', name: 'Ocean Tide', tag: 'Waves' },
  { id: 'WIND', name: 'Wind Breeze', tag: 'Aerodynamic' },
  { id: 'PINK', name: 'Pink Noise', tag: 'Balanced 1/f' },
  { id: 'BROWN', name: 'Brown Noise', tag: 'Deep Rumble' },
  { id: 'RAIN', name: 'Rain Cascade', tag: 'Precipitation' },
  { id: 'STREAM', name: 'Forest Stream', tag: 'Liquid Flux' },
  { id: 'WHITE', name: 'White Noise', tag: 'Full Spectrum' },
  { id: 'FOREST', name: 'Night Forest', tag: 'Atmospheric' },
  { id: 'CAVE', name: 'Deep Cave', tag: 'Sub Reverb' },
  { id: 'FIRE', name: 'Hearth Fire', tag: 'Warm Ember' },
  { id: 'VINYL', name: 'Analog Vinyl', tag: 'Warm Dust' },
  { id: 'DRONE', name: 'Meditative Drone', tag: 'Harmonic' },
];

export const getBellPitchHz = (cueBase: string = 'C', cueOctave: number = 4, cueHarmonic: number = 16, cuePitchShift: number = 0, bpm: number = 60) => {
  let base = 261.63;
  const item = PACER_BELL_KEYS.find(k => k.id === cueBase);
  if (item) {
    if (item.type === 'musical') {
      base = item.freq * Math.pow(2, (cueOctave ?? 4) - 4);
    } else if (item.id === 'HEART') {
      base = (bpm / 60) * 128;
    } else {
      base = item.freq;
    }
  }
  const mult = (cueHarmonic || 16) / 16.0;
  let target = base * mult;
  if (cuePitchShift) {
    target = target * Math.pow(2, cuePitchShift / 12);
  }
  return Math.round(target * 10) / 10;
};

export interface HarmonicDockItemProps { 
  label: string; 
  icon: React.ElementType; 
  isActive: boolean; 
  onClick: () => void; 
  onContextMenu?: (e: React.MouseEvent) => void; 
  color?: string; 
}

export const HarmonicDockItem = ({ label, icon: Icon, isActive, onClick, onContextMenu, color }: HarmonicDockItemProps) => (
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

export interface TuningControlsDeckProps {
  controller: ReturnType<typeof usePlanetaryController>;
  uiConfig: Record<string, unknown>;
  isVisualizerImmersion?: boolean;
  topButtonsLayout: LayoutElement;
  uiX: number;
  bpm?: number;
  isProgressionActive?: boolean;
  currentProgressionObj?: {
    chords?: Array<{ root?: string; [key: string]: unknown }>;
    [key: string]: unknown;
  } | null;
  currentChordIndex?: number;
  activeColorWheelId: HarmonicColorWheelId;
  onSelectColorWheel: (id: HarmonicColorWheelId) => void;
  onOpenBreathSheet: () => void;
  onShowToast: (message: string, durationMs?: number) => void;
}

export const TuningControlsDeck: React.FC<TuningControlsDeckProps> = ({
  controller,
  uiConfig,
  isVisualizerImmersion = false,
  topButtonsLayout,
  uiX,
  bpm = 60,
  isProgressionActive = false,
  currentProgressionObj = null,
  currentChordIndex = 0,
  activeColorWheelId,
  onSelectColorWheel,
  onOpenBreathSheet,
  onShowToast,
}) => {
  const [isPulseMenuOpen, setIsPulseMenuOpen] = useState(false);
  const [isHeartMenuOpen, setIsHeartMenuOpen] = useState(false);
  const [isComposerMatrixOpen, setIsComposerMatrixOpen] = useState(false);
  const [isPacerMenuOpen, setIsPacerMenuOpen] = useState(false);
  const [isTonesMenuOpen, setIsTonesMenuOpen] = useState(false);

  const currentStyle = (controller.audio.feedbackConfig?.pulseStyle as string) || 'BLACK_SHUTTER';
  const currentPulsePreset = PULSE_PRESETS.find(p => p.id === currentStyle) || PULSE_PRESETS[0];
  const pulseActiveColor = currentPulsePreset.iconColor || '#facc15';

  const isPulseUncoupled = Boolean(controller.audio.feedbackConfig?.isUncoupled);
  const pulseCustomRate = typeof controller.audio.feedbackConfig?.customRateHz === 'number'
    ? controller.audio.feedbackConfig.customRateHz
    : 7.83;

  const isPulseTcSync = Boolean(
    controller.audio.feedbackConfig?.pulseSync === 'TIME_CRYSTAL' || 
    controller.audio.feedbackConfig?.syncWithTimeCrystal
  );
  const activeTcTopology = (
    controller.audio.feedbackConfig?.timeCrystalTopology || 
    (!isPulseUncoupled ? controller.atmosphere.immersionConfig?.timeCrystalTopology : 'FIBONACCI') || 
    'FIBONACCI'
  ) as string;

  const pulseActiveLabel = controller.audio.isFeedbackActive 
    ? (isPulseTcSync 
        ? `${currentPulsePreset.name.split(' ')[0]}·${isPulseUncoupled ? 'uTC' : 'TC'}`
        : (isPulseUncoupled ? `${currentPulsePreset.name.split(' ')[0]}·${pulseCustomRate.toFixed(1)}Hz` : currentPulsePreset.name.split(' ')[0])) 
    : 'Pulse';

  const isHeartMuted = controller.audio.mutes['HEART_KICK'] ?? false;
  const curSyncMode = controller.temporal.kickConfig?.syncMode || 'BREATH';
  const curHeartColorScheme = (controller.temporal.kickConfig?.colorScheme as string) || 'ROSE_LOVE';
  const curHeartCustomColor = controller.temporal.kickConfig?.customColor as string;
  const heartColor = getHeartColor(curHeartColorScheme, curHeartCustomColor);

  const curVisualMode = (controller.temporal.breathConfig?.visualMode as string) || 'RING';
  const curColorScheme = (controller.temporal.breathConfig?.colorScheme as string) || 'CYAN_OCEAN';
  const curCustomColor = (controller.temporal.breathConfig?.customColor as string) || '#22d3ee';
  const pacerColors = getPacerColors(curColorScheme, curCustomColor);
  const isPacerHidden = curVisualMode === 'NONE';

  const activeSenticKey = (controller.temporal.breathConfig?.senticState as SenticEmotion) || 'NO_EMOTION';
  const senticData = SENTIC_STATES[activeSenticKey] || SENTIC_STATES['NO_EMOTION'];
  const activeSenticMeta = SENTIC_EMOTION_META.find(m => m.id === activeSenticKey) || SENTIC_EMOTION_META[0];
  const senticSvgPath = generateSenticSvgPath(senticData?.curveLUT, 120, 24);

  return (
    <div 
      className={`absolute ${isPulseMenuOpen || isComposerMatrixOpen || isPacerMenuOpen || isHeartMenuOpen || isTonesMenuOpen ? 'z-[90]' : 'z-40'} flex items-center gap-1.5 sm:gap-3 pointer-events-auto transition-opacity duration-300 ${isVisualizerImmersion ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
      style={{ 
        top: `${topButtonsLayout.y}rem`, 
        left: '50%', 
        transform: `translate(-50%, 0) translate(${topButtonsLayout.x}rem, 0) translateX(${uiX}rem) scale(${topButtonsLayout.scale})`, 
        opacity: isVisualizerImmersion ? 0 : topButtonsLayout.opacity, 
        pointerEvents: (isVisualizerImmersion || topButtonsLayout.opacity === 0) ? 'none' : 'auto' 
      }}
    >
      {/* 1. Pulse Button & Mode Dropdown Popover */}
      <div className="relative">
        <HarmonicDockItem 
          label={pulseActiveLabel} 
          icon={Activity} 
          isActive={controller.audio.isFeedbackActive} 
          color={controller.audio.isFeedbackActive ? pulseActiveColor : '#facc15'} 
          onClick={() => {
            if (!controller.audio.isFeedbackActive) {
              controller.audio.setIsFeedbackActive(true);
              const firstPreset = PULSE_PRESETS[0];
              controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({ ...prev, pulseStyle: firstPreset.id }));
              onShowToast(`Pulse ON: ${firstPreset.name}`, 1400);
            } else {
              const curIdx = PULSE_PRESETS.findIndex(p => p.id === currentStyle);
              if (curIdx >= PULSE_PRESETS.length - 1) {
                controller.audio.setIsFeedbackActive(false);
                onShowToast('Pulse: OFF', 1400);
              } else {
                const nextIdx = curIdx < 0 ? 0 : curIdx + 1;
                const nextPreset = PULSE_PRESETS[nextIdx];
                controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({ ...prev, pulseStyle: nextPreset.id }));
                onShowToast(`Pulse: ${nextPreset.name}`, 1400);
              }
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsPulseMenuOpen(prev => !prev);
          }}
        />

        <button
          onClick={(e) => { e.stopPropagation(); setIsPulseMenuOpen(prev => !prev); }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900/90 border border-yellow-500/40 text-yellow-300 hover:text-white flex items-center justify-center text-[8px] transition-colors shadow-md cursor-pointer"
          title="Toggle Pulse Options Menu"
          aria-label="Toggle Pulse Options Menu"
        >
          <ChevronDown size={9} className={`transition-transform duration-200 ${isPulseMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isPulseMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs" 
              onClick={() => setIsPulseMenuOpen(false)} 
            />
            <div className="fixed sm:absolute top-14 sm:top-full left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 sm:mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-80 max-h-[calc(100dvh-16rem)] sm:max-h-[min(560px,calc(100dvh-18rem))] overflow-y-auto bg-slate-950/95 backdrop-blur-2xl border border-yellow-500/40 rounded-2xl sm:rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-[80] p-3 sm:p-3.5 pb-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 flex items-center gap-1.5">
                  <Activity size={12} /> Pulse Mode
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const nextState = !controller.audio.isFeedbackActive;
                      controller.audio.setIsFeedbackActive(nextState);
                      onShowToast(nextState ? 'Pulse Enabled' : 'Pulse Disabled', 1200);
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      controller.audio.isFeedbackActive
                        ? 'bg-yellow-500 text-black shadow-sm'
                        : 'bg-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {controller.audio.isFeedbackActive ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => setIsPulseMenuOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Close Menu"
                    aria-label="Close Menu"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Presets List */}
              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                {PULSE_PRESETS.map((p) => {
                  const isSelected = ((controller.audio.feedbackConfig?.pulseStyle || 'BLACK_SHUTTER') === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (!controller.audio.isFeedbackActive) {
                          controller.audio.setIsFeedbackActive(true);
                        }
                        controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({ ...prev, pulseStyle: p.id }));
                        onShowToast(`Pulse: ${p.name}`, 1200);
                      }}
                      className={`p-1.5 rounded text-left transition-all border text-[9px] font-medium flex items-center gap-2 ${
                        isSelected
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-sm'
                          : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div 
                        className="w-3 h-3 rounded-full border border-white/30 shrink-0 shadow-xs" 
                        style={{ backgroundColor: p.color }} 
                      />
                      <div className="truncate min-w-0">
                        <span className="font-bold block truncate">{p.name}</span>
                        <span className="text-[7px] text-slate-500 block truncate">{p.tag}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Tint Color */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400">
                  <span>Custom Tint Color</span>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="color" 
                      value={(controller.audio.feedbackConfig?.pulseCustomColor as string) || '#06b6d4'}
                      onChange={(e) => {
                        if (!controller.audio.isFeedbackActive) {
                          controller.audio.setIsFeedbackActive(true);
                        }
                        controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({
                          ...prev,
                          pulseStyle: 'CUSTOM_COLOR',
                          pulseCustomColor: e.target.value
                        }));
                      }}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                      title="Pick Custom Color"
                    />
                    <span className="font-mono text-[9px] text-yellow-400">
                      {(controller.audio.feedbackConfig?.pulseCustomColor as string) || '#06b6d4'}
                    </span>
                  </div>
                </div>

                {/* Pulse Coupling: Coupled to Audio vs Uncoupled Independent Visual Pulse */}
                <div className="space-y-1.5 pt-1 border-t border-white/10">
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold">
                      {isPulseUncoupled ? (
                        <Unlink size={11} className="text-amber-400" />
                      ) : (
                        <Link2 size={11} className="text-cyan-400" />
                      )}
                      <span>Audio Coupling</span>
                    </span>
                    <span className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      isPulseUncoupled 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {isPulseUncoupled ? 'Uncoupled (Visual Only)' : 'Coupled to Audio'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({
                          ...prev,
                          isUncoupled: false,
                        }));
                        onShowToast('Visual Pulse: Coupled to Audio Entrainment', 1200);
                      }}
                      className={`py-1.5 px-2 text-[8.5px] font-bold rounded flex items-center justify-center gap-1.5 transition-all border ${
                        !isPulseUncoupled
                          ? 'bg-cyan-500/25 text-cyan-200 border-cyan-500/60 shadow-xs'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Link2 size={11} className={!isPulseUncoupled ? "text-cyan-300" : "text-slate-400"} />
                      <span>Coupled</span>
                    </button>
                    <button
                      onClick={() => {
                        const currentEntrainmentRate = controller.temporal.binauralFreqs?.['UNIVERSAL'] || 7.83;
                        const defaultRate = typeof controller.audio.feedbackConfig?.customRateHz === 'number'
                          ? controller.audio.feedbackConfig.customRateHz
                          : currentEntrainmentRate;
                        controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({
                          ...prev,
                          isUncoupled: true,
                          customRateHz: defaultRate,
                          timeCrystalTopology: prev.timeCrystalTopology || 'FIBONACCI'
                        }));
                        onShowToast('Visual Pulse: Uncoupled from Audio', 1300);
                      }}
                      className={`py-1.5 px-2 text-[8.5px] font-bold rounded flex items-center justify-center gap-1.5 transition-all border ${
                        isPulseUncoupled
                          ? 'bg-amber-500/25 text-amber-200 border-amber-500/60 shadow-xs'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Unlink size={11} className={isPulseUncoupled ? "text-amber-300" : "text-slate-400"} />
                      <span>Uncouple</span>
                    </button>
                  </div>

                  {/* If uncoupled, offer independent frequency rate adjustment */}
                  {isPulseUncoupled && (
                    <div className="bg-amber-950/20 p-2 rounded-lg border border-amber-500/20 space-y-1.5 mt-1">
                      <div className="flex justify-between items-center text-[7.5px] uppercase tracking-wider text-amber-400/90">
                        <span className="flex items-center gap-1 font-semibold">
                          <Gauge size={10} className="text-amber-400" />
                          <span>Visual Frequency</span>
                        </span>
                        <span className="text-amber-300 font-mono font-bold text-[8.5px]">
                          {pulseCustomRate.toFixed(2)} Hz
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="30"
                        step="0.1"
                        value={pulseCustomRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({
                            ...prev,
                            isUncoupled: true,
                            customRateHz: val,
                          }));
                        }}
                        className="w-full accent-amber-400 h-1 bg-white/10 rounded cursor-pointer"
                      />
                      <div className="flex justify-between text-[7px] text-slate-400 font-mono">
                        <button 
                          onClick={() => controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({ ...prev, customRateHz: 4.0 }))}
                          className="hover:text-amber-300 transition-colors"
                        >
                          4Hz (Theta)
                        </button>
                        <button 
                          onClick={() => controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({ ...prev, customRateHz: 7.83 }))}
                          className="hover:text-amber-300 transition-colors"
                        >
                          7.83Hz (Schumann)
                        </button>
                        <button 
                          onClick={() => controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({ ...prev, customRateHz: 10.0 }))}
                          className="hover:text-amber-300 transition-colors"
                        >
                          10Hz (Alpha)
                        </button>
                        <button 
                          onClick={() => controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({ ...prev, customRateHz: 14.0 }))}
                          className="hover:text-amber-300 transition-colors"
                        >
                          14Hz (Beta)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pulse Rhythm Synchronization: Periodic Wave vs Time Crystal */}
                <div className="space-y-1.5 pt-1 border-t border-white/10">
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Network size={11} className={isPulseTcSync ? "text-emerald-400" : "text-slate-400"} />
                      <span>Rhythm Pattern</span>
                    </span>
                    <span className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      isPulseTcSync 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {isPulseTcSync ? `Crystal (${activeTcTopology.substring(0, 4)})` : (isPulseUncoupled ? 'Continuous Wave' : 'Binaural Beat')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({
                          ...prev,
                          pulseSync: 'BINAURAL',
                          syncWithTimeCrystal: false
                        }));
                        onShowToast(isPulseUncoupled ? 'Visual Rhythm: Continuous Wave' : 'Visual Pulse Sync: Binaural Beat', 1200);
                      }}
                      className={`py-1.5 px-2 text-[8.5px] font-bold rounded flex items-center justify-center gap-1.5 transition-all border ${
                        !isPulseTcSync
                          ? 'bg-cyan-500/25 text-cyan-200 border-cyan-500/60 shadow-xs'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Waves size={11} className={!isPulseTcSync ? "text-cyan-300" : "text-slate-400"} />
                      <span>{isPulseUncoupled ? 'Continuous Wave' : 'Binaural Beat'}</span>
                    </button>
                    <button
                      onClick={() => {
                        controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({
                          ...prev,
                          pulseSync: 'TIME_CRYSTAL',
                          syncWithTimeCrystal: true,
                          timeCrystalTopology: prev.timeCrystalTopology || 'FIBONACCI'
                        }));
                        // If coupled, also turn on audio time crystal; if uncoupled, strictly keep visual distinct!
                        if (!isPulseUncoupled && !controller.atmosphere.immersionConfig?.isTimeCrystal) {
                          controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({
                            ...prev,
                            isTimeCrystal: true,
                            timeCrystalTopology: prev?.timeCrystalTopology || 'FIBONACCI'
                          }));
                        }
                        onShowToast(`Visual Pulse: Time Crystal (${activeTcTopology})${isPulseUncoupled ? ' [Visual Only]' : ''}`, 1400);
                      }}
                      className={`py-1.5 px-2 text-[8.5px] font-bold rounded flex items-center justify-center gap-1.5 transition-all border ${
                        isPulseTcSync
                          ? 'bg-emerald-500/25 text-emerald-200 border-emerald-500/60 shadow-xs'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Network size={11} className={isPulseTcSync ? "text-emerald-300" : "text-slate-400"} />
                      <span>Time Crystal</span>
                    </button>
                  </div>

                  {/* If Time Crystal Sync is active, show quick topology selector */}
                  {isPulseTcSync && (
                    <div className="pt-1 space-y-1 bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20">
                      <div className="flex justify-between items-center text-[7.5px] uppercase tracking-wider text-emerald-400/80">
                        <span className="font-semibold">
                          {isPulseUncoupled ? 'Visual Crystal Topology' : 'Global Crystal Topology'}
                        </span>
                        <span className="text-emerald-300 font-mono text-[7.5px]">
                          {activeTcTopology === 'FIBONACCI' ? 'Golden Ratio (1.618)' : activeTcTopology === 'PRIME' ? 'Prime Step Metric' : activeTcTopology === 'THUE_MORSE' ? 'Parity Quasi-DTC' : 'Period Doubled (2T)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {(['FIBONACCI', 'PRIME', 'THUE_MORSE', 'PERIOD_DOUBLE'] as const).map((top) => {
                          const isTopActive = activeTcTopology === top;
                          const shortLabel = top === 'FIBONACCI' ? 'Fibo' : top === 'PRIME' ? 'Prime' : top === 'THUE_MORSE' ? 'Thue' : '2T';
                          return (
                            <button
                              key={top}
                              onClick={() => {
                                // Update distinct visual topology in feedbackConfig
                                controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({
                                  ...prev,
                                  pulseSync: 'TIME_CRYSTAL',
                                  syncWithTimeCrystal: true,
                                  timeCrystalTopology: top
                                }));
                                // If coupled, also update immersionConfig for audio; if uncoupled, leave audio untouched!
                                if (!isPulseUncoupled) {
                                  controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({
                                    ...prev,
                                    isTimeCrystal: true,
                                    timeCrystalTopology: top
                                  }));
                                }
                                onShowToast(
                                  isPulseUncoupled 
                                    ? `Visual Crystal: ${top} (Audio untouched)` 
                                    : `Time Crystal: ${top}`, 
                                  1200
                                );
                              }}
                              className={`py-1 text-[8px] font-mono font-bold rounded transition-colors border ${
                                isTopActive
                                  ? 'bg-emerald-500/35 text-emerald-200 border-emerald-500/70 shadow-xs'
                                  : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
                              }`}
                            >
                              {shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Waveform Selector */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] uppercase tracking-wider text-slate-400">
                    <span>Waveform Rhythm</span>
                    <span className="text-yellow-400 font-mono">
                      {(controller.audio.feedbackConfig?.pulseWaveform as string) || 'SINE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {['SINE', 'STROBE', 'TRIANGLE', 'HEARTBEAT'].map((w) => {
                      const isWActive = ((controller.audio.feedbackConfig?.pulseWaveform || 'SINE') === w);
                      return (
                        <button
                          key={w}
                          onClick={() => {
                            controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({ ...prev, pulseWaveform: w }));
                          }}
                          className={`py-1 text-[8px] font-bold rounded transition-colors ${
                            isWActive
                              ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {w.substring(0, 4)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pulse Intensity / Depth Fader */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] uppercase tracking-wider text-slate-400">
                    <span>Pulse Depth</span>
                    <span className="text-yellow-400 font-mono">
                      {Math.round(((controller.audio.feedbackConfig?.depth ?? 0.85) as number) * 100)}%
                    </span>
                  </div>
                  <Fader
                    value={controller.audio.feedbackConfig?.depth ?? 0.85}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    onChange={(v: number) => controller.audio.setFeedbackConfig((prev: Record<string, unknown>) => ({ ...prev, depth: v }))}
                    color="#facc15"
                    uiConfig={uiConfig}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. Heartbeat Button & Mode / Preset / Color Scheme Dropdown Popover */}
      <div className="relative">
        <HarmonicDockItem 
          label={curSyncMode === 'BREATH' ? "Heart (RSA)" : curSyncMode === 'BINAURAL' ? "Heart (Bin)" : "Heart (Steady)"} 
          icon={Heart} 
          isActive={!isHeartMuted} 
          color={heartColor} 
          onClick={() => {
            const currentlyMuted = controller.audio.mutes['HEART_KICK'] ?? false;
            const nextMuted = !currentlyMuted;
            controller.audio.setMutes((prev: Record<string, boolean>) => ({
              ...prev,
              HEART_KICK: nextMuted
            }));
            if (!nextMuted && !controller.audioSys.audioEnabled) {
              controller.audioSys.setAudioEnabled(true);
              controller.audioSys.initAudio(controller.atmosphere.reverbConfig, controller.temporal.breathConfig, controller.temporal.binauralFreqs, controller.atmosphere.delayConfig);
            }
            onShowToast(nextMuted ? 'Heartbeat: MUTED' : 'Heartbeat: ACTIVE', 1400);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsHeartMenuOpen(prev => !prev);
          }}
        />

        <button
          onClick={(e) => { e.stopPropagation(); setIsHeartMenuOpen(prev => !prev); }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900/90 border border-rose-500/40 text-rose-300 hover:text-white flex items-center justify-center text-[8px] transition-colors shadow-md cursor-pointer"
          title="Toggle Heartbeat Options Menu"
          aria-label="Toggle Heartbeat Options Menu"
        >
          <ChevronDown size={9} className={`transition-transform duration-200 ${isHeartMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isHeartMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs" 
              onClick={() => setIsHeartMenuOpen(false)} 
            />
            <div className="fixed sm:absolute top-14 sm:top-full left-1/2 sm:left-1/2 -translate-x-1/2 sm:mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-80 max-h-[calc(100dvh-16rem)] sm:max-h-[min(560px,calc(100dvh-18rem))] overflow-y-auto bg-slate-950/95 backdrop-blur-2xl border border-rose-500/40 rounded-2xl sm:rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-[80] p-3 sm:p-3.5 pb-4 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                  <Heart size={12} fill="currentColor" /> Heartbeat & RSA
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const currentlyMuted = controller.audio.mutes['HEART_KICK'] ?? false;
                      const nextMuted = !currentlyMuted;
                      controller.audio.setMutes((prev: Record<string, boolean>) => ({
                        ...prev,
                        HEART_KICK: nextMuted
                      }));
                      if (!nextMuted && !controller.audioSys.audioEnabled) {
                        controller.audioSys.setAudioEnabled(true);
                        controller.audioSys.initAudio(controller.atmosphere.reverbConfig, controller.temporal.breathConfig, controller.temporal.binauralFreqs, controller.atmosphere.delayConfig);
                      }
                      onShowToast(!currentlyMuted ? 'Heartbeat Muted' : 'Heartbeat Active', 1200);
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      !controller.audio.mutes['HEART_KICK']
                        ? 'bg-rose-500 text-black shadow-sm font-bold'
                        : 'bg-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {!controller.audio.mutes['HEART_KICK'] ? 'Active' : 'Muted'}
                  </button>
                  <button
                    onClick={() => setIsHeartMenuOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Close Menu"
                    aria-label="Close Menu"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Mode Presets */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] uppercase tracking-wider text-slate-400">
                  <span>Cardiorespiratory Sync</span>
                  <span className="text-rose-400 font-mono text-[8px]">
                    {HEARTBEAT_PRESET_OPTIONS.find(p => p.syncMode === (controller.temporal.kickConfig?.syncMode || 'BREATH') && p.doubleBeat === (controller.temporal.kickConfig?.doubleBeat !== false) && (p.syncMode !== 'STEADY' || ((p.bpm || 60) === (controller.temporal.kickConfig?.bpm || 60))))?.name || 'Custom Pulse'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {HEARTBEAT_PRESET_OPTIONS.map((preset) => {
                    const isSelected = (controller.temporal.kickConfig?.syncMode || 'BREATH') === preset.syncMode &&
                      (controller.temporal.kickConfig?.doubleBeat !== false) === preset.doubleBeat &&
                      (preset.syncMode !== 'STEADY' || ((preset.bpm || 60) === (controller.temporal.kickConfig?.bpm || 60)));
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          controller.temporal.setKickConfig((prev: Record<string, unknown>) => ({
                            ...prev,
                            syncMode: preset.syncMode,
                            doubleBeat: preset.doubleBeat,
                            ...(preset.syncMode === 'STEADY' && preset.bpm ? { bpm: preset.bpm } : {})
                          }));
                          if (controller.audio.mutes['HEART_KICK']) {
                            controller.audio.setMutes((prev: Record<string, boolean>) => ({
                              ...prev,
                              HEART_KICK: false
                            }));
                          }
                          if (!controller.audioSys.audioEnabled) {
                            controller.audioSys.setAudioEnabled(true);
                            controller.audioSys.initAudio(controller.atmosphere.reverbConfig, controller.temporal.breathConfig, controller.temporal.binauralFreqs, controller.atmosphere.delayConfig);
                          }
                          if (controller.audioSys.graphRef.current) {
                            triggerHeartPulse(controller.audioSys.graphRef.current, controller.audioSys.audioCtx?.currentTime || 0, {
                              kickConfig: {
                                ...controller.temporal.kickConfig,
                                syncMode: preset.syncMode,
                                doubleBeat: preset.doubleBeat,
                                ...(preset.syncMode === 'STEADY' && preset.bpm ? { bpm: preset.bpm } : {})
                              },
                              volumes: controller.audio.volumes,
                              mutes: { ...controller.audio.mutes, HEART_KICK: false },
                              stackMutes: controller.audio.stackMutes
                            });
                          }
                          onShowToast(`Heart: ${preset.name}`, 1200);
                        }}
                        className={`p-1.5 rounded text-left transition-all border text-[9px] font-medium flex items-center justify-between ${
                          isSelected
                            ? 'bg-rose-500/20 text-rose-200 border-rose-500/50 shadow-sm'
                            : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
                        }`}
                      >
                        <div className="truncate min-w-0 mr-1">
                          <span className="font-bold block truncate">{preset.name}</span>
                          <span className="text-[7px] text-slate-500 block truncate">{preset.tag}</span>
                        </div>
                        <span className="text-rose-400 shrink-0">
                          {preset.syncMode === 'BREATH' ? <Wind size={11} /> : preset.syncMode === 'BINAURAL' ? <Music2 size={11} /> : <Heart size={11} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Rate / Sync Mode Segment Selector */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-slate-400">
                  <span>Sync Driver Mode</span>
                  <span className="text-rose-400 font-mono text-[8px] font-bold">
                    {controller.temporal.kickConfig?.syncMode || "BREATH"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                  {[
                    { id: "BREATH", label: "Breath RSA", icon: Wind },
                    { id: "BREATH_COUNT", label: "1s Count", icon: Timer },
                    { id: "STEADY", label: "Steady", icon: Heart },
                    { id: "BINAURAL", label: "Brainwave", icon: Music2 },
                  ].map((m) => {
                    const isCurrent = (controller.temporal.kickConfig?.syncMode || "BREATH") === m.id;
                    const MIcon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          controller.temporal.setKickConfig((prev: Record<string, unknown>) => ({ ...prev, syncMode: m.id }));
                        }}
                        className={`py-1 px-1 rounded text-[8px] font-bold transition-colors flex items-center justify-center gap-1 ${
                          isCurrent
                            ? "bg-rose-500/30 text-rose-200 border border-rose-500/50"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <MIcon size={9} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Dedicated Turnaround 1s Sync Quick Switch Button */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      const isAlready1s = (controller.temporal.kickConfig?.syncMode === "BREATH_COUNT");
                      controller.temporal.setKickConfig((prev: Record<string, unknown>) => ({
                        ...prev,
                        syncMode: isAlready1s ? "BREATH" : "BREATH_COUNT",
                        syncToSeconds: !isAlready1s
                      }));
                      onShowToast(
                        !isAlready1s ? "1s Cadence: 5 beats In / 5 beats Out (Hits on Turnaround)" : "Returned to Dynamic Breath RSA",
                        1400
                      );
                    }}
                    className={`w-full py-1 px-2 rounded-md text-[8.5px] font-semibold transition-all flex items-center justify-between border cursor-pointer ${
                      controller.temporal.kickConfig?.syncMode === "BREATH_COUNT"
                        ? "bg-rose-500/20 text-rose-200 border-rose-500/50 shadow-xs"
                        : "bg-white/[0.04] text-slate-300 hover:text-white border-white/10 hover:bg-white/[0.08]"
                    }`}
                    title="Synchronize each beat to 1-second ticks hitting turnaround boundaries precisely"
                  >
                    <span className="flex items-center gap-1.5">
                      <Timer size={11} className={controller.temporal.kickConfig?.syncMode === "BREATH_COUNT" ? "text-rose-400" : "text-slate-400"} />
                      <span>5s In / 5s Out Turnaround 1s Sync</span>
                    </span>
                    <span className={`text-[7.5px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                      controller.temporal.kickConfig?.syncMode === "BREATH_COUNT"
                        ? "bg-rose-500/40 text-rose-100"
                        : "bg-white/10 text-slate-400"
                    }`}>
                      {controller.temporal.kickConfig?.syncMode === "BREATH_COUNT" ? "LOCKED" : "OFF"}
                    </span>
                  </button>
                </div>

                {/* Mode Explainer Info Box */}
                <div className="mt-1.5 p-2 rounded-md bg-white/[0.03] border border-white/5 text-[8.5px] leading-relaxed text-slate-300">
                  {(controller.temporal.kickConfig?.syncMode === "BREATH_COUNT") && (
                    <div className="flex items-start gap-1.5">
                      <span className="text-rose-400 shrink-0 mt-0.5"><Timer size={11} /></span>
                      <div>
                        <strong className="text-rose-300 font-medium">Turnaround 1s Count (Cadence Lock): </strong>
                        Syncs 1 beat with every single second of your breath cycle and strikes right on the turnaround (5 beats on 5s inhale, 5 beats on 5s exhale) so you can count along seamlessly.
                      </div>
                    </div>
                  )}
                  {(!controller.temporal.kickConfig?.syncMode || controller.temporal.kickConfig?.syncMode === "BREATH") && (
                    <div className="flex items-start gap-1.5">
                      <span className="text-rose-400 shrink-0 mt-0.5"><Wind size={11} /></span>
                      <div>
                        <strong className="text-rose-300 font-medium">Breath RSA (Cardiorespiratory): </strong>
                        Heart rate naturally accelerates on your inhale and decelerates on your exhale (Respiratory Sinus Arrhythmia) to train vagal tone and HRV.
                      </div>
                    </div>
                  )}
                  {(controller.temporal.kickConfig?.syncMode || "BREATH") === "STEADY" && (
                    <div className="flex items-start gap-1.5">
                      <span className="text-rose-400 shrink-0 mt-0.5"><Heart size={11} /></span>
                      <div>
                        <strong className="text-rose-300 font-medium">Steady (Fixed Tempo): </strong>
                        Locks the pulse to an unwavering metronomic tempo at {controller.temporal.kickConfig?.bpm || 60} BPM, completely independent of breathing speed.
                      </div>
                    </div>
                  )}
                  {(controller.temporal.kickConfig?.syncMode || "BREATH") === "BINAURAL" && (
                    <div className="flex items-start gap-1.5">
                      <span className="text-rose-400 shrink-0 mt-0.5"><Music2 size={11} /></span>
                      <div>
                        <strong className="text-rose-300 font-medium">Brainwave (Binaural Lock): </strong>
                        Clocks each heartbeat interval to exact subharmonics of the active binaural beat frequency for deep entrainment.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Double Beat Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px]">
                <span className="text-slate-400 text-[8px] uppercase tracking-wider">Lub-Dub Valve Physics</span>
                <button
                  onClick={() => {
                    const nextDouble = controller.temporal.kickConfig?.doubleBeat === false;
                    controller.temporal.setKickConfig((prev: Record<string, unknown>) => ({
                      ...prev,
                      doubleBeat: nextDouble
                    }));
                  }}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-colors ${
                    controller.temporal.kickConfig?.doubleBeat !== false
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {controller.temporal.kickConfig?.doubleBeat !== false ? 'Lub-Dub (Dual)' : 'Single Stroke'}
                </button>
              </div>

              {/* Kick EQ & Tone Tuning Sliders */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1"><SlidersHorizontal size={10} className="text-rose-400" /> Acoustic Kick EQ & Pitch</span>
                  <span className="text-[7.5px] text-rose-300/80 font-mono">
                    {Math.round(controller.temporal.kickConfig?.baseFreq || 48)}Hz · {Math.round(controller.temporal.kickConfig?.lpfCutoff || 180)}Hz
                  </span>
                </div>
                
                <div className="space-y-1.5 p-2 rounded-lg bg-black/40 border border-white/5">
                  {/* Pulse Rate / Tempo (BPM) */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Heart size={9} className="text-rose-400" /> Pulse Rate / Tempo (BPM)</span>
                      <span className="text-rose-300 font-mono font-bold">
                        {controller.temporal.kickConfig?.syncMode === 'BREATH_COUNT'
                          ? '1 Beat / Sec (Turnaround Synced)'
                          : (controller.temporal.kickConfig?.syncMode || 'BREATH') === 'BREATH'
                            ? 'Breath-Locked (RSA Inhale/Exhale)'
                            : `${Math.round(controller.temporal.kickConfig?.bpm || 60)} BPM`}
                      </span>
                    </div>
                    <div className={`transition-opacity ${(controller.temporal.kickConfig?.syncMode === 'BREATH_COUNT' || (controller.temporal.kickConfig?.syncMode || 'BREATH') === 'BREATH') ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Fader
                        value={controller.temporal.kickConfig?.bpm || 60}
                        min={40}
                        max={140}
                        step={1}
                        disabled={controller.temporal.kickConfig?.syncMode === 'BREATH_COUNT' || (controller.temporal.kickConfig?.syncMode || 'BREATH') === 'BREATH'}
                        onChange={(v: number) => {
                          if (controller.temporal.kickConfig?.syncMode === 'BREATH_COUNT' || (controller.temporal.kickConfig?.syncMode || 'BREATH') === 'BREATH') return;
                          controller.temporal.setKickConfig((prev: Record<string, unknown>) => ({
                            ...prev,
                            bpm: v
                          }));
                          if (controller.temporal.setLocalBpm) {
                            controller.temporal.setLocalBpm(v);
                          }
                        }}
                        color="#f43f5e"
                        uiConfig={uiConfig}
                      />
                    </div>
                    {(controller.temporal.kickConfig?.syncMode || 'BREATH') === 'BREATH' && (
                      <div className="text-[7.5px] text-rose-300/80 italic flex items-center gap-1 pt-0.5">
                        <Wind size={8} /> Auto-modulates with respiration cycle (accelerates on inhale, slows on exhale)
                      </div>
                    )}
                  </div>

                  {/* Pitch / Sub Fundamental */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                      <span>Pitch / Sub Fundamental</span>
                      <span className="text-rose-300 font-mono">{Math.round(controller.temporal.kickConfig?.baseFreq || 48)} Hz</span>
                    </div>
                    <Fader
                      value={controller.temporal.kickConfig?.baseFreq || 48}
                      min={35}
                      max={85}
                      step={1}
                      onChange={(v: number) => {
                        controller.temporal.setKickConfig((prev: Record<string, unknown>) => ({
                          ...prev,
                          baseFreq: v,
                          freq: v
                        }));
                      }}
                      color="#fb7185"
                      uiConfig={uiConfig}
                    />
                  </div>

                  {/* Tone Filter / Cutoff */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                      <span>Tone Filter (Warmth / Cutoff)</span>
                      <span className="text-rose-300 font-mono">{Math.round(controller.temporal.kickConfig?.lpfCutoff || 180)} Hz</span>
                    </div>
                    <Fader
                      value={controller.temporal.kickConfig?.lpfCutoff || 180}
                      min={80}
                      max={450}
                      step={5}
                      onChange={(v: number) => {
                        controller.temporal.setKickConfig((prev: Record<string, unknown>) => ({
                          ...prev,
                          lpfCutoff: v
                        }));
                      }}
                      color="#f43f5e"
                      uiConfig={uiConfig}
                    />
                  </div>

                  {/* Decay / Sustain Length */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                      <span>Decay / Body Length</span>
                      <span className="text-rose-300 font-mono">{Math.round((controller.temporal.kickConfig?.decay || 0.35) * 1000)} ms</span>
                    </div>
                    <Fader
                      value={controller.temporal.kickConfig?.decay || 0.35}
                      min={0.15}
                      max={0.75}
                      step={0.01}
                      onChange={(v: number) => {
                        controller.temporal.setKickConfig((prev: Record<string, unknown>) => ({
                          ...prev,
                          decay: v,
                          ampDecay: v
                        }));
                      }}
                      color="#e11d48"
                      uiConfig={uiConfig}
                    />
                  </div>
                </div>
              </div>

              {/* Live Volume Fader & Test Trigger */}
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1"><Volume2 size={10} /> Heartbeat Volume</span>
                  <span className="text-rose-400 font-mono font-bold">
                    {((controller.audio.volumes['HEART_KICK'] ?? 0.6) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Fader 
                      value={controller.audio.volumes['HEART_KICK'] ?? 0.6} 
                      onChange={(v) => controller.audio.handleVolumeChange('HEART_KICK', v)} 
                      color="#f43f5e" 
                      uiConfig={uiConfig} 
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!controller.audioSys.audioEnabled) {
                        controller.audioSys.setAudioEnabled(true);
                        controller.audioSys.initAudio(controller.atmosphere.reverbConfig, controller.temporal.breathConfig, controller.temporal.binauralFreqs, controller.atmosphere.delayConfig);
                      }
                      if (controller.audio.mutes['HEART_KICK']) {
                        controller.audio.setMutes((prev: Record<string, boolean>) => ({ ...prev, HEART_KICK: false }));
                      }
                      if (controller.audioSys.graphRef.current) {
                        triggerHeartPulse(controller.audioSys.graphRef.current, controller.audioSys.audioCtx?.currentTime || 0, {
                          kickConfig: controller.temporal.kickConfig,
                          volumes: controller.audio.volumes,
                          mutes: { ...controller.audio.mutes, HEART_KICK: false },
                          stackMutes: controller.audio.stackMutes
                        });
                      }
                    }}
                    className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded text-[8px] font-bold uppercase transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    title="Test Trigger Heart Pulse"
                  >
                    <Play size={8} fill="currentColor" /> Test
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Composer Pulse Matrix Button & Popover */}
      <div className="relative">
        <HarmonicDockItem 
          label={controller.atmosphere.immersionConfig?.composerWarp && controller.atmosphere.immersionConfig.composerWarp !== 'LINEAR' ? String(controller.atmosphere.immersionConfig.composerWarp).substring(0, 4) : "Matrix"} 
          icon={Spline} 
          isActive={Boolean(controller.atmosphere.immersionConfig?.composerWarp && controller.atmosphere.immersionConfig.composerWarp !== 'LINEAR')} 
          color="#d946ef" 
          onClick={() => {
            const currentWarp = (controller.atmosphere.immersionConfig?.composerWarp as string) || 'LINEAR';
            const curIdx = COMPOSER_WARP_PRESETS.findIndex(m => m.id === currentWarp);
            const nextIdx = (curIdx + 1) % COMPOSER_WARP_PRESETS.length;
            const nextPreset = COMPOSER_WARP_PRESETS[nextIdx];
            controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({ ...prev, composerWarp: nextPreset.id }));
            onShowToast(`Matrix: ${nextPreset.name}`, 1400);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsComposerMatrixOpen(prev => !prev);
          }}
        />

        <button
          onClick={(e) => { e.stopPropagation(); setIsComposerMatrixOpen(prev => !prev); }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900/90 border border-fuchsia-500/40 text-fuchsia-300 hover:text-white flex items-center justify-center text-[8px] transition-colors shadow-md cursor-pointer"
          title="Toggle Composer Pulse Matrix Menu"
          aria-label="Toggle Composer Pulse Matrix Menu"
        >
          <ChevronDown size={9} className={`transition-transform duration-200 ${isComposerMatrixOpen ? 'rotate-180' : ''}`} />
        </button>

        {isComposerMatrixOpen && (
          <>
            <div 
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs" 
              onClick={() => setIsComposerMatrixOpen(false)} 
            />
            <div className="fixed sm:absolute top-14 sm:top-full left-1/2 sm:left-1/2 -translate-x-1/2 sm:mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-72 max-h-[calc(100dvh-16rem)] sm:max-h-[min(560px,calc(100dvh-18rem))] overflow-y-auto bg-slate-950/95 backdrop-blur-2xl border border-fuchsia-500/40 rounded-2xl sm:rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-[80] p-3 pb-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400 flex items-center gap-1.5">
                  <Activity size={12} /> Pulse Matrix
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-400 font-bold">
                    {controller.atmosphere.immersionConfig?.composerWarp || 'LINEAR'}
                  </span>
                  <button
                    onClick={() => setIsComposerMatrixOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Close Menu"
                    aria-label="Close Menu"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                {COMPOSER_WARP_PRESETS.map((m) => {
                  const isSelected = (controller.atmosphere.immersionConfig?.composerWarp || 'LINEAR') === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({ ...prev, composerWarp: m.id }));
                        onShowToast(`Matrix: ${m.name}`, 1200);
                      }}
                      className={`p-1.5 rounded text-left transition-all border text-[9px] font-medium truncate ${isSelected ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 shadow-sm' : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'}`}
                    >
                      <span className="font-bold block truncate">{m.name}</span>
                      <span className="text-[7px] text-slate-500 block truncate">{m.tag}</span>
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-white/10 space-y-1">
                <div className="flex justify-between text-[8px] uppercase tracking-wider text-slate-400">
                  <span>Sentic Fluidity</span>
                  <span className="text-fuchsia-400 font-mono">{Math.round(((controller.atmosphere.immersionConfig?.composerIntensity as number) ?? 1.0) * 100)}%</span>
                </div>
                <Fader
                  value={controller.atmosphere.immersionConfig?.composerIntensity ?? 1.0}
                  min={0}
                  max={1.0}
                  step={0.05}
                  onChange={(v: number) => controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({ ...prev, composerIntensity: v }))}
                  color="#d946ef"
                  uiConfig={uiConfig}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. Breath Pacer Button & Mode / Color Scheme Dropdown Popover */}
      <div className="relative">
        <HarmonicDockItem 
          label={isPacerHidden ? "Pacer (Off)" : "Pacer"} 
          icon={isPacerHidden ? EyeOff : Wind} 
          isActive={controller.temporal.isBreathActive} 
          color={pacerColors.accent} 
          onClick={() => {
            controller.toggleBreathPacer();
            const nextActive = !controller.temporal.isBreathActive;
            onShowToast(nextActive ? 'Pacer: ACTIVE' : 'Pacer: MUTED', 1200);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsPacerMenuOpen(prev => !prev);
          }}
        />

        <button
          onClick={(e) => { e.stopPropagation(); setIsPacerMenuOpen(prev => !prev); }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 hover:text-white flex items-center justify-center text-[8px] transition-colors shadow-md cursor-pointer"
          title="Toggle Pacer Options Menu"
          aria-label="Toggle Pacer Options Menu"
        >
          <ChevronDown size={9} className={`transition-transform duration-200 ${isPacerMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isPacerMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs" 
              onClick={() => setIsPacerMenuOpen(false)} 
            />
            <div className="fixed sm:absolute top-14 sm:top-full left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 sm:mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-80 max-h-[calc(100dvh-16rem)] sm:max-h-[min(560px,calc(100dvh-18rem))] overflow-y-auto bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl sm:rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-[80] p-3 sm:p-3.5 pb-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                  <Wind size={12} /> Breath Pacer
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      controller.toggleBreathPacer();
                      const nextState = !controller.temporal.isBreathActive;
                      onShowToast(nextState ? 'Pacer Enabled' : 'Pacer Disabled', 1200);
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      controller.temporal.isBreathActive
                        ? 'bg-cyan-500 text-black shadow-sm font-bold'
                        : 'bg-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {controller.temporal.isBreathActive ? 'Active' : 'Muted'}
                  </button>
                  <button
                    onClick={() => setIsPacerMenuOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Close Menu"
                    aria-label="Close Menu"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Visual Styles / Modes */}
              <div className="space-y-1.5 mb-2.5">
                <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400">
                  <span>Visual Style</span>
                  <span className="text-cyan-400 font-mono text-[9px]">
                    {PACER_STYLES.find(s => s.id === (controller.temporal.breathConfig?.visualMode || 'RING'))?.name || 'Expanding Ring'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PACER_STYLES.map((style) => {
                    const isSelected = (controller.temporal.breathConfig?.visualMode || 'RING') === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => {
                          if (!controller.temporal.isBreathActive && style.id !== 'NONE') {
                            controller.temporal.setIsBreathActive(true);
                            if (!controller.temporal.breathStartTime) {
                              controller.temporal.setBreathStartTime(performance.now() / 1000);
                            }
                          }
                          controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, visualMode: style.id }));
                          onShowToast(`Pacer: ${style.name}`, 1200);
                        }}
                        className={`p-1.5 rounded text-left transition-all border text-[9px] font-medium flex items-center gap-2 ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                            : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
                        }`}
                      >
                        <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 text-cyan-400 bg-black/40 border border-white/10">
                          {style.id === 'NONE' ? <EyeOff size={10} className="text-slate-400" /> :
                            style.id === 'RING' ? <Circle size={10} /> :
                            style.id === 'GLOW' ? <Sparkles size={10} /> :
                            style.id === 'DOT' ? <CircleDot size={10} /> :
                            style.id === 'CHEVRON' ? <ChevronsUp size={10} /> :
                            style.id === 'HORIZON' ? <Waves size={10} /> :
                            <Square size={10} />}
                        </div>
                        <div className="truncate min-w-0">
                          <span className="font-bold block truncate">{style.name}</span>
                          <span className="text-[7px] text-slate-500 block truncate">{style.tag}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Schemes */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400">
                  <span>Color Scheme</span>
                  <span className="text-cyan-400 font-mono text-[9px]">
                    {PACER_COLOR_SCHEMES.find(s => s.id === (controller.temporal.breathConfig?.colorScheme || 'CYAN_OCEAN'))?.name || 'Cosmic Tide'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PACER_COLOR_SCHEMES.map((scheme) => {
                    const isSelected = ((controller.temporal.breathConfig?.colorScheme || 'CYAN_OCEAN') === scheme.id);
                    return (
                      <button
                        key={scheme.id}
                        onClick={() => {
                          controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, colorScheme: scheme.id }));
                          onShowToast(`Palette: ${scheme.name}`, 1200);
                        }}
                        className={`p-1.5 rounded text-left transition-all border text-[9px] font-medium flex items-center justify-between ${
                          isSelected
                            ? 'bg-white/10 text-white border-cyan-400/60 shadow-sm'
                            : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
                        }`}
                      >
                        <div className="truncate min-w-0 mr-1.5">
                          <span className="font-bold block truncate">{scheme.name}</span>
                          <span className="text-[7px] text-slate-500 block truncate">{scheme.tag}</span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <span className="w-1.5 h-3 rounded-xs" style={{ backgroundColor: scheme.colors.inhale }} title="Inhale" />
                          <span className="w-1.5 h-3 rounded-xs" style={{ backgroundColor: scheme.colors.holdIn }} title="Hold" />
                          <span className="w-1.5 h-3 rounded-xs" style={{ backgroundColor: scheme.colors.exhale }} title="Exhale" />
                          <span className="w-1.5 h-3 rounded-xs" style={{ backgroundColor: scheme.colors.holdOut }} title="Wait" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Selector */}
                <div className="flex items-center justify-between pt-1 text-[8px] uppercase tracking-wider text-slate-400">
                  <span>Custom Accent Tint</span>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="color" 
                      value={(controller.temporal.breathConfig?.customColor as string) || '#22d3ee'}
                      onChange={(e) => {
                        controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
                          ...prev,
                          colorScheme: 'CUSTOM_COLOR',
                          customColor: e.target.value
                        }));
                      }}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                      title="Pick Custom Color"
                    />
                    <span className="font-mono text-[9px] text-cyan-400">
                      {(controller.temporal.breathConfig?.customColor as string) || '#22d3ee'}
                    </span>
                  </div>
                </div>

                {/* Turnaround Bell Sound Tone Controls */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Bell size={11} className="text-amber-400" />
                      <span>Turnaround Bell & Cue Tones</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const currentTone = controller.temporal.breathConfig?.cueTone || 'SINE_BELL';
                          const nextTone = currentTone === 'NONE' ? 'SINE_BELL' : 'NONE';
                          controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
                            ...prev,
                            cueTone: nextTone
                          }));
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-colors ${
                          (controller.temporal.breathConfig?.cueTone || 'SINE_BELL') !== 'NONE'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                            : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                        }`}
                      >
                        {(controller.temporal.breathConfig?.cueTone || 'SINE_BELL') !== 'NONE' ? 'Active' : 'Muted'}
                      </button>
                      <button
                        onClick={() => {
                          if (!controller.audioSys.audioEnabled) {
                            controller.audioSys.setAudioEnabled(true);
                            controller.audioSys.initAudio(
                              controller.atmosphere.reverbConfig,
                              controller.temporal.breathConfig,
                              controller.temporal.binauralFreqs,
                              controller.atmosphere.delayConfig
                            );
                          }
                          if (controller.audioSys.graphRef.current) {
                            previewCueTone(
                              controller.audioSys.graphRef.current,
                              controller.temporal.breathConfig,
                              'TEST',
                              controller.audio.bpm || bpm || 60
                            );
                          }
                        }}
                        className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Audition Bell Sound"
                      >
                        <Play size={8} fill="currentColor" /> Test
                      </button>
                    </div>
                  </div>

                  {/* Bell Sound Type Selector */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] uppercase tracking-wider text-slate-400">
                      <span>Sound Type</span>
                      <span className="text-amber-400 font-mono text-[8px]">
                        {PACER_BELL_TONES.find(t => t.id === (controller.temporal.breathConfig?.cueTone || 'SINE_BELL'))?.name || 'Singing Bowl'}
                      </span>
                    </div>
                    <div className="relative">
                      <select
                        value={controller.temporal.breathConfig?.cueTone || 'SINE_BELL'}
                        onChange={(e) => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, cueTone: e.target.value }))}
                        className="w-full bg-black/60 border border-amber-500/30 rounded px-2 py-1.5 text-[9.5px] appearance-none focus:outline-none focus:border-amber-400 font-bold uppercase tracking-wider text-amber-300 cursor-pointer"
                      >
                        {PACER_BELL_TONES.map(t => (
                          <option key={t.id} value={t.id} className="bg-slate-950 text-slate-200">
                            {t.name} ({t.tag})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500/50" />
                    </div>
                  </div>

                  {/* Key Root & Harmonic Tuning Controls (when not NONE) */}
                  {(controller.temporal.breathConfig?.cueTone || 'SINE_BELL') !== 'NONE' && (
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-2 animate-in fade-in duration-150">
                      {/* Music Mode Chord Root Auto-Sync */}
                      <div className="flex items-center justify-between p-1.5 rounded bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-1.5">
                          <Music size={11} className={controller.temporal.breathConfig?.syncTurnaroundToChordRoot ? "text-amber-400" : "text-slate-400"} />
                          <div>
                            <div className="text-[8px] font-bold text-slate-200">Sync to Chord Root</div>
                            <div className="text-[7px] text-slate-400">
                              {isProgressionActive 
                                ? `Auto-tunes bell to ${currentProgressionObj?.chords?.[currentChordIndex % (currentProgressionObj?.chords?.length || 1)]?.root || 'C'} in Music Mode`
                                : 'Auto-syncs bell pitch to chord root in Music Mode'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
                            ...prev,
                            syncTurnaroundToChordRoot: !prev?.syncTurnaroundToChordRoot
                          }))}
                          className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-colors border ${
                            controller.temporal.breathConfig?.syncTurnaroundToChordRoot
                              ? 'bg-amber-500/30 text-amber-300 border-amber-500/60 shadow-xs'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {controller.temporal.breathConfig?.syncTurnaroundToChordRoot ? 'AUTO-SYNC' : 'MANUAL'}
                        </button>
                      </div>

                      {/* Musical Pitch / Scale Selector */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[7.5px] uppercase tracking-wider text-slate-400">
                          <span>Musical Pitch / Scale</span>
                          <span className="text-amber-300 font-mono font-bold">
                            {getBellPitchHz(
                              controller.temporal.breathConfig?.cueBase || 'C',
                              controller.temporal.breathConfig?.cueOctave ?? 4,
                              controller.temporal.breathConfig?.cueHarmonic || 16,
                              controller.temporal.breathConfig?.cuePitchShift || 0,
                              bpm
                            )} Hz
                          </span>
                        </div>
                        <div className="relative">
                          <select
                            value={controller.temporal.breathConfig?.cueBase || 'C'}
                            onChange={(e) => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, cueBase: e.target.value }))}
                            className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-[9px] appearance-none focus:outline-none focus:border-amber-400 font-bold text-slate-200 cursor-pointer"
                          >
                            <optgroup label="🎵 Musical Scale Roots" className="bg-slate-950 text-cyan-400 font-bold">
                              {PACER_BELL_KEYS.filter(k => k.type === 'musical').map(k => (
                                <option key={k.id} value={k.id} className="bg-slate-950 text-slate-200">
                                  Note {k.name} ({k.freq} Hz)
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="✨ Sacred Solfeggio Frequencies" className="bg-slate-950 text-amber-400 font-bold">
                              {PACER_BELL_KEYS.filter(k => k.type === 'solfeggio').map(k => (
                                <option key={k.id} value={k.id} className="bg-slate-950 text-slate-200">{k.name}</option>
                              ))}
                            </optgroup>
                            <optgroup label="🌍 Planetary & Natural Resonances" className="bg-slate-950 text-emerald-400 font-bold">
                              {PACER_BELL_KEYS.filter(k => k.type === 'scientific').map(k => (
                                <option key={k.id} value={k.id} className="bg-slate-950 text-slate-200">{k.name}</option>
                              ))}
                            </optgroup>
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                        </div>
                      </div>

                      {/* Musical Octave Selector (when musical note is active) */}
                      {PACER_BELL_KEYS.find(k => k.id === (controller.temporal.breathConfig?.cueBase || 'C'))?.type === 'musical' && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                            <span>Musical Octave</span>
                            <span className="text-cyan-300 font-mono">
                              Octave {controller.temporal.breathConfig?.cueOctave ?? 4}
                            </span>
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {[1, 2, 3, 4, 5, 6, 7].map((oct) => {
                              const isSelected = (controller.temporal.breathConfig?.cueOctave ?? 4) === oct;
                              return (
                                <button
                                  key={oct}
                                  onClick={() => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, cueOctave: oct }))}
                                  className={`py-0.5 rounded text-[8px] font-bold font-mono transition-colors text-center border cursor-pointer ${isSelected ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs" : "bg-white/5 text-slate-400 border-white/5 hover:text-white"}`}
                                  title={`Octave ${oct}`}
                                >
                                  {oct}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Semitone Transpose / Scale Interval Offset */}
                      <div className="space-y-1 pt-0.5">
                        <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                          <span>Semitone Transpose</span>
                          <span className="text-amber-300 font-mono font-bold">
                            {(() => {
                              const st = Math.round(Number(controller.temporal.breathConfig?.cuePitchShift || 0));
                              return st > 0 ? `+${st} st` : `${st} st`;
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, cuePitchShift: Math.max(-12, Math.round(Number(prev.cuePitchShift || 0)) - 1) }))}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[9px] font-mono font-bold border border-white/10 cursor-pointer"
                          >
                            -1
                          </button>
                          <div className="flex-1">
                            <Fader
                              value={Math.round(Number(controller.temporal.breathConfig?.cuePitchShift || 0))}
                              min={-12}
                              max={12}
                              step={1}
                              onChange={(v: number) => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, cuePitchShift: Math.round(v) }))}
                              color="#f59e0b"
                              uiConfig={uiConfig}
                            />
                          </div>
                          <button
                            onClick={() => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, cuePitchShift: Math.min(12, Math.round(Number(prev.cuePitchShift || 0)) + 1) }))}
                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[9px] font-mono font-bold border border-white/10 cursor-pointer"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, cuePitchShift: 0 }))}
                            className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[8px] uppercase font-bold border border-white/5 cursor-pointer"
                            title="Reset Transpose"
                          >
                            0
                          </button>
                        </div>
                      </div>

                      {/* Ring / Decay Duration */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                          <span>Ring / Decay Duration</span>
                          <span className="text-amber-300 font-mono">
                            {(controller.temporal.breathConfig?.cueDecay ?? 2.5).toFixed(1)}s
                          </span>
                        </div>
                        <Fader
                          value={controller.temporal.breathConfig?.cueDecay ?? 2.5}
                          min={0.4}
                          max={8.0}
                          step={0.1}
                          onChange={(v: number) => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, cueDecay: v }))}
                          color="#fbbf24"
                          uiConfig={uiConfig}
                        />
                      </div>

                      {/* Phase Gating Toggles */}
                      <div className="space-y-1 pt-1 border-t border-white/5">
                        <span className="text-[7.5px] uppercase tracking-wider text-slate-400 block">Phase Gating (Trigger On)</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { key: 'inhale', label: 'Inhale Start' },
                            { key: 'holdIn', label: 'Apex' },
                            { key: 'exhale', label: 'Exhale Start' },
                            { key: 'holdOut', label: 'Nadir' },
                          ].map((phase) => {
                            const defaultMask = { inhale: true, exhale: true, holdIn: false, holdOut: false };
                            const mask = ((controller.temporal.breathConfig as Record<string, unknown>)?.cuePhaseMask as Record<string, boolean>) || defaultMask;
                            const isPhaseOn = Boolean(mask[phase.key] ?? (phase.key === 'inhale' || phase.key === 'exhale'));
                            return (
                              <button
                                key={phase.key}
                                onClick={() => {
                                  const nextMask = { ...defaultMask, ...mask, [phase.key]: !isPhaseOn };
                                  controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
                                    ...prev,
                                    cuePhaseMask: nextMask
                                  }));
                                }}
                                className={`py-1 rounded text-[7.5px] font-bold uppercase transition-colors text-center border cursor-pointer ${
                                  isPhaseOn
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                                    : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'
                                }`}
                              >
                                {phase.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bell Volume Level */}
                      <div className="space-y-0.5 pt-1 border-t border-white/5">
                        <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                          <span className="flex items-center gap-1"><Volume2 size={9} /> Bell Level / Volume</span>
                          <span className="text-amber-300 font-mono">
                            {Math.round(((controller.temporal.breathConfig?.cueVolume as number) ?? 0.5) * 100)}%
                          </span>
                        </div>
                        <Fader
                          value={controller.temporal.breathConfig?.cueVolume ?? 0.5}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(v: number) => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, cueVolume: v }))}
                          color="#f59e0b"
                          uiConfig={uiConfig}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Breath & Tide Sound Selector & Volume */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Wind size={11} className="text-cyan-400" />
                      <span>Breath & Tide Sound</span>
                    </span>
                    <span className="text-cyan-400 font-mono text-[8px] font-bold">
                      {Math.round(((controller.temporal.breathConfig?.oceanVol as number) ?? 0.6) * 100)}% Level
                    </span>
                  </div>

                  {/* Acoustic Profile Texture Selector */}
                  <div className="grid grid-cols-3 gap-1">
                    {PACER_TIDE_TEXTURES.map((tex) => {
                      const isSelected = (controller.temporal.breathConfig?.noiseType || 'OCEAN') === tex.id;
                      return (
                        <button
                          key={tex.id}
                          onClick={() => {
                            controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
                              ...prev,
                              noiseType: tex.id
                            }));
                            onShowToast(`Tide: ${tex.name}`, 1200);
                          }}
                          className={`p-1 rounded text-left transition-all border text-[8.5px] truncate cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs'
                              : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
                          }`}
                        >
                          <span className="font-bold block truncate">{tex.name}</span>
                          <span className="text-[7px] text-slate-500 block truncate">{tex.tag}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tide Level / Volume Fader */}
                  <div className="space-y-0.5 pt-1">
                    <div className="flex justify-between text-[7.5px] uppercase font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Volume2 size={9} /> Tide Level</span>
                      <span className="text-cyan-300 font-mono">
                        {Math.round(((controller.temporal.breathConfig?.oceanVol as number) ?? 0.6) * 100)}%
                      </span>
                    </div>
                    <Fader
                      value={controller.temporal.breathConfig?.oceanVol ?? 0.6}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v: number) => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, oceanVol: v }))}
                      color="#06b6d4"
                      uiConfig={uiConfig}
                    />
                  </div>

                  {/* Breath Tide Entrainment Modulation Control (Default: Unmodulated) */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[7.5px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Radio size={9} className={controller.temporal.breathConfig?.entrainTide ? "text-cyan-400" : "text-slate-500"} />
                        <span>Tide Entrainment</span>
                      </span>
                      <button
                        id="btn-toggle-tide-entrainment"
                        onClick={() => {
                          const nextActive = !controller.temporal.breathConfig?.entrainTide;
                          controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
                            ...prev,
                            entrainTide: nextActive,
                            tideEntrainMode: prev.tideEntrainMode || 'ISOCHRONIC',
                            tideEntrainDepth: prev.tideEntrainDepth ?? 0.4
                          }));
                          onShowToast(
                            nextActive ? 'Tide Entrainment: ON' : 'Tide Entrainment: OFF (Unmodulated)',
                            1200
                          );
                        }}
                        className={
                          controller.temporal.breathConfig?.entrainTide
                            ? 'px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase border transition-all cursor-pointer bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs'
                            : 'px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase border transition-all cursor-pointer bg-white/5 text-slate-400 hover:text-slate-200 border-white/10'
                        }
                      >
                        {controller.temporal.breathConfig?.entrainTide ? 'ACTIVE' : 'OFF (UNMODULATED)'}
                      </button>
                    </div>

                    {controller.temporal.breathConfig?.entrainTide && (
                      <div className="space-y-2 pl-1 border-l border-cyan-500/20">
                        {/* Entrainment Quality Mode (Binaural, Isochronic, Monaural) */}
                        <div className="space-y-1">
                          <div className="text-[7px] uppercase tracking-wider text-slate-400 font-bold">
                            Entrainment Quality
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { id: 'BINAURAL', label: 'Binaural', desc: 'Stereo Bilateral' },
                              { id: 'ISOCHRONIC', label: 'Isochronic', desc: 'Pulsed Gating' },
                              { id: 'MONAURAL', label: 'Monaural', desc: 'Smooth AM' }
                            ].map(mode => {
                              const isSelected = (controller.temporal.breathConfig?.tideEntrainMode || 'ISOCHRONIC') === mode.id;
                              return (
                                <button
                                  key={mode.id}
                                  id={'btn-tide-mode-' + mode.id.toLowerCase()}
                                  onClick={() => {
                                    controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
                                      ...prev,
                                      tideEntrainMode: mode.id
                                    }));
                                    onShowToast('Mode: ' + mode.label + ' (' + mode.desc + ')', 1200);
                                  }}
                                  className={
                                    isSelected
                                      ? 'py-1 px-1 rounded text-center border transition-all cursor-pointer bg-cyan-500/25 text-cyan-300 border-cyan-500/60 shadow-xs font-bold'
                                      : 'py-1 px-1 rounded text-center border transition-all cursor-pointer bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
                                  }
                                >
                                  <span className="text-[8px] block">{mode.label}</span>
                                  <span className="text-[6.5px] text-slate-400 block opacity-80">{mode.desc}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Intensity Control Fader */}
                        <div className="space-y-0.5 pt-0.5">
                          <div className="flex justify-between text-[7px] uppercase font-bold text-slate-400">
                            <span>Modulation Intensity</span>
                            <span className="text-cyan-300 font-mono">
                              {Math.round(((controller.temporal.breathConfig?.tideEntrainDepth as number) ?? 0.4) * 100)}%
                            </span>
                          </div>
                          <Fader
                            value={controller.temporal.breathConfig?.tideEntrainDepth ?? 0.4}
                            min={0.05}
                            max={1.0}
                            step={0.05}
                            onChange={(v: number) => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, tideEntrainDepth: v }))}
                            color="#06b6d4"
                            uiConfig={uiConfig}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sentic Emotion Wave Controller */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Heart size={11} className="text-pink-400" />
                      <span>Sentic Emotion Wave</span>
                    </span>
                    <button
                      onClick={() => {
                        const nextActive = !controller.temporal.breathConfig?.isSenticPacing;
                        controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
                          ...prev,
                          isSenticPacing: nextActive,
                          senticState: nextActive && (!prev.senticState || prev.senticState === 'NO_EMOTION') ? 'LOVE' : prev.senticState
                        }));
                        if (nextActive && !controller.temporal.isBreathActive) {
                          controller.temporal.setIsBreathActive(true);
                          if (!controller.temporal.breathStartTime) {
                            controller.temporal.setBreathStartTime(performance.now() / 1000);
                          }
                        }
                        onShowToast(nextActive ? 'Sentic Pacing: Active' : 'Sentic Pacing: Disabled', 1200);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                        controller.temporal.breathConfig?.isSenticPacing
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50'
                          : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {controller.temporal.breathConfig?.isSenticPacing ? 'Active' : 'Off'}
                    </button>
                  </div>

                  {/* Emotion Form Selector Grid */}
                  <div className="grid grid-cols-2 gap-1.5 pr-0.5">
                    {SENTIC_EMOTION_META.map((item) => {
                      const isSelected = (controller.temporal.breathConfig?.senticState || 'NO_EMOTION') === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            const isLinear = item.id === 'NO_EMOTION';
                            controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
                              ...prev,
                              isSenticPacing: !isLinear,
                              senticState: item.id
                            }));
                            if (!isLinear && !controller.temporal.isBreathActive) {
                              controller.temporal.setIsBreathActive(true);
                              if (!controller.temporal.breathStartTime) {
                                controller.temporal.setBreathStartTime(performance.now() / 1000);
                              }
                            }
                            onShowToast(`Sentic: ${item.name}`, 1200);
                          }}
                          className={`p-1.5 rounded text-left transition-all border text-[9px] font-medium flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-white/10 text-white shadow-sm'
                              : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
                          }`}
                          style={{
                            borderColor: isSelected ? item.color : undefined
                          }}
                        >
                          <div className="truncate min-w-0 mr-1.5">
                            <span className="font-bold block truncate" style={{ color: isSelected ? item.color : undefined }}>
                              {item.name}
                            </span>
                            <span className="text-[7px] text-slate-500 block truncate">{item.tag}</span>
                          </div>
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ 
                              backgroundColor: item.color,
                              boxShadow: isSelected ? `0 0 8px ${item.color}` : 'none'
                            }} 
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Emotion Essentic Curve & Directive Box */}
                  <div className="p-2 rounded-lg bg-black/40 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-[7px] uppercase font-bold tracking-widest text-slate-400 block">Essentic Dynamic Directive</span>
                        <p className="text-[9px] italic text-slate-200 truncate" title={senticData.directive}>
                          "{senticData.directive}"
                        </p>
                      </div>
                      <div className="w-[120px] h-[26px] shrink-0 bg-slate-950/80 rounded border border-white/5 overflow-hidden flex items-center justify-center px-1">
                        <svg width="112" height="24" viewBox="0 0 120 24" className="overflow-visible">
                          <path 
                            d={senticSvgPath} 
                            fill="none" 
                            stroke={activeSenticMeta.color} 
                            strokeWidth="2" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Intensity Vibrato / Modulation Depth */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 whitespace-nowrap">Intensity</span>
                      <div className="flex-1">
                        <Fader 
                          value={controller.temporal.breathConfig?.senticVibratoDepth ?? 0.3} 
                          min={0} 
                          max={1} 
                          step={0.05} 
                          onChange={(v) => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({ ...prev, senticVibratoDepth: v }))} 
                          color={activeSenticMeta.color} 
                          uiConfig={uiConfig} 
                        />
                      </div>
                      <span className="text-[8px] font-mono font-bold text-right w-8" style={{ color: activeSenticMeta.color }}>
                        {Math.round((controller.temporal.breathConfig?.senticVibratoDepth ?? 0.3) * 100)}%
                      </span>
                    </div>

                    {/* Sensory Modulation Toggles */}
                    <div className="flex items-center gap-1 pt-1 flex-wrap pb-0.5">
                      {[
                        { key: 'isSenticVisual', label: 'Visual', icon: Eye },
                        { key: 'isSenticTideAM', label: 'Tide AM', icon: Waves },
                        { key: 'isSenticTideFM', label: 'Tide FM', icon: Activity },
                        { key: 'isSenticSoloist', label: 'Bell', icon: Bell },
                        { key: 'isSenticHaptics', label: 'Haptics', icon: Smartphone },
                      ].map(mod => {
                        const isActive = Boolean(controller.temporal.breathConfig?.[mod.key as keyof typeof controller.temporal.breathConfig] ?? true);
                        const ModIcon = mod.icon;
                        return (
                          <button
                            key={mod.key}
                            onClick={() => controller.temporal.setBreathConfig((prev: Record<string, unknown>) => ({
                              ...prev,
                              [mod.key]: !isActive
                            }))}
                            className={`px-1.5 py-1 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all border shrink-0 cursor-pointer ${
                              isActive
                                ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-xs'
                                : 'bg-white/5 text-slate-500 hover:text-slate-300 border-white/5'
                            }`}
                            title={`Toggle ${mod.label} Modulation`}
                          >
                            <ModIcon size={9} />
                            <span>{mod.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Live Bottom Bar & Visual Preview */}
                <div className="pt-2 border-t border-white/10 space-y-1">
                  <div className="flex justify-between text-[8px] uppercase tracking-wider text-slate-400">
                    <span>Live Pacer Bar Preview</span>
                    <span className="text-cyan-400 font-mono text-[8px]">
                      {controller.temporal.isBreathActive ? 'SYNCED' : 'STANDBY'}
                    </span>
                  </div>
                  <div className="w-full h-4 rounded overflow-hidden bg-slate-900 border border-white/10">
                    <TideMeter 
                      config={controller.temporal.breathConfig} 
                      uiConfig={uiConfig} 
                      isActive={controller.temporal.isBreathActive} 
                      startTime={controller.temporal.breathStartTime} 
                    />
                  </div>
                </div>

                {/* Link to Breath Architect */}
                <div className="pt-1.5 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsPacerMenuOpen(false);
                      onOpenBreathSheet();
                    }}
                    className="w-full py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sliders size={11} /> Open Breath Architect
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 5. Time Crystal Button */}
      <HarmonicDockItem 
        label={controller.atmosphere.immersionConfig?.isTimeCrystal ? String(controller.atmosphere.immersionConfig.timeCrystalTopology || 'FIBONACCI').split('_')[0].substring(0, 4) : "Crystal"} 
        icon={Network} 
        isActive={Boolean(controller.atmosphere.immersionConfig?.isTimeCrystal)} 
        color="#10b981" 
        onClick={() => {
          const CYCLE = ['FIBONACCI', 'PRIME', 'THUE_MORSE', 'PERIOD_DOUBLE'];
          const cur = controller.atmosphere.immersionConfig;
          let nextState: Record<string, unknown>;
          let toastMsg = '';
          if (!cur?.isTimeCrystal) {
            nextState = { ...cur, isTimeCrystal: true, timeCrystalTopology: 'FIBONACCI' };
            toastMsg = 'Time Crystal: FIBONACCI (Golden Ratio)';
          } else {
            const idx = CYCLE.indexOf(((cur.timeCrystalTopology as string) || 'FIBONACCI'));
            if (idx === CYCLE.length - 1) {
              nextState = { ...cur, isTimeCrystal: false };
              toastMsg = 'Time Crystal: OFF';
            } else {
              const nextTop = CYCLE[idx + 1];
              nextState = { ...cur, timeCrystalTopology: nextTop };
              toastMsg = `Time Crystal: ${nextTop}`;
            }
          }
          controller.atmosphere.setImmersionConfig(nextState);
          if (controller.audio.isFeedbackActive && (controller.audio.feedbackConfig?.pulseSync === 'TIME_CRYSTAL' || controller.audio.feedbackConfig?.syncWithTimeCrystal)) {
            toastMsg += ' (Pulse Synced)';
          }
          onShowToast(toastMsg, 1400);
        }} 
      />

      {/* 6. Tones Button & Popover Dropdown */}
      <div className="relative">
        <HarmonicDockItem 
          label={controller.temporal.entrainmentMode === 'SYNCED' ? "Tones (Sync)" : controller.temporal.entrainmentMode === 'DRONE' ? "Tones (Drone)" : "Tones"} 
          icon={controller.temporal.entrainmentMode === 'SILENT' ? VolumeX : Volume2} 
          isActive={controller.temporal.entrainmentMode !== 'SILENT'} 
          color={controller.temporal.entrainmentMode === 'SYNCED' ? "#f59e0b" : controller.temporal.entrainmentMode === 'DRONE' ? "#a855f7" : "#64748b"} 
          onClick={() => {
            controller.cycleEntrainmentMode();
            const cur = controller.temporal.entrainmentMode;
            const next = cur === 'SYNCED' ? 'DRONE' : cur === 'DRONE' ? 'SILENT' : 'SYNCED';
            const msg = next === 'SYNCED' ? 'Tones: Breath-Synced' : next === 'DRONE' ? 'Tones: Continuous Drone' : 'Tones: Silent';
            onShowToast(msg, 1400);
          }} 
          onContextMenu={(e) => {
            e.preventDefault();
            setIsTonesMenuOpen(prev => !prev);
          }}
        />

        <button
          onClick={(e) => { e.stopPropagation(); setIsTonesMenuOpen(prev => !prev); }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900/90 border border-purple-500/40 text-purple-300 hover:text-white flex items-center justify-center text-[8px] transition-colors shadow-md cursor-pointer"
          title="Toggle Tones & Harmonics Menu"
          aria-label="Toggle Tones & Harmonics Menu"
        >
          <ChevronDown size={9} className={`transition-transform duration-200 ${isTonesMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        <SoundDesignMenu
          isOpen={isTonesMenuOpen}
          onClose={() => setIsTonesMenuOpen(false)}
          entrainmentMode={controller.temporal.entrainmentMode}
          onSetEntrainmentMode={(mode) => {
            controller.temporal.setEntrainmentMode(mode);
            if (mode === 'SYNCED' && !controller.temporal.isBreathActive) {
              controller.temporal.setIsBreathActive(true);
              controller.temporal.setBreathStartTime(performance.now() / 1000);
            }
            if (mode !== 'SILENT' && !controller.audioSys.audioEnabled) {
              controller.audioSys.setAudioEnabled(true);
              controller.audioSys.initAudio(
                controller.atmosphere.reverbConfig,
                controller.temporal.breathConfig,
                controller.temporal.binauralFreqs,
                controller.atmosphere.delayConfig
              );
            }
            onShowToast(`Tones: ${mode}`, 1200);
          }}
          isPerfectFifth={!!controller.atmosphere.immersionConfig.isPerfectFifth}
          isPerfectFifthBreathSync={!!controller.atmosphere.immersionConfig.isPerfectFifthBreathSync}
          onTogglePerfectFifth={(active) => {
            controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({ ...prev, isPerfectFifth: active }));
            onShowToast(active ? 'Harmonic Fifth: Active' : 'Harmonic Fifth: Disabled', 1200);
          }}
          onSetPerfectFifthSync={(isBreathSync) => {
            controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({ ...prev, isPerfectFifthBreathSync: isBreathSync }));
            onShowToast(isBreathSync ? 'Fifth: Breath Glide (1:1 → 3:2)' : 'Fifth: Static 3:2 Ratio', 1200);
          }}
          toneTimbre={(controller.atmosphere.immersionConfig.toneTimbre as 'SINE' | 'WARM_TRI' | 'CHIME' | 'SOFT_SAW') || 'SINE'}
          onSetToneTimbre={(timbre) => {
            controller.atmosphere.setImmersionConfig((prev: Record<string, unknown>) => ({ ...prev, toneTimbre: timbre }));
            onShowToast(`Timbre: ${timbre}`, 1200);
          }}
          harmonicMasterVolume={controller.audio.harmonicMasterVolume}
          onHarmonicMasterVolumeChange={(v) => controller.audio.setHarmonicMasterVolume(v)}
          activeColorWheel={activeColorWheelId}
          onSelectColorWheel={onSelectColorWheel}
          uiConfig={uiConfig}
        />
      </div>
    </div>
  );
};
