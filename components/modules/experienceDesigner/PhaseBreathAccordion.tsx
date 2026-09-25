import React, { useState } from 'react';
import { Wind, Clock, ChevronDown, ChevronUp, Bell, Volume2, Sparkles, SlidersHorizontal, Eye, Repeat, Activity } from 'lucide-react';
import { ExperienceBlock, BreathPhase, BlockBreathConfig, BlockBreathPattern } from '../../../services/audio/experienceDesigner';
import { PACER_BELL_TONES } from '../PlanetaryTunerModule';

interface Props {
    block: ExperienceBlock;
    blockIndex: number;
    updateBlock: (index: number, patch: Partial<ExperienceBlock>) => void;
    defaultOpen?: boolean;
    isOpen?: boolean;
    onToggleOpen?: () => void;
}

const PHASE_DEFS: Record<BreathPhase, { label: string; icon: string; bg: string; text: string; border: string }> = {
    INHALE: {
        label: 'Inhale Phase',
        icon: '🫁',
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        border: 'border-emerald-500/40'
    },
    HOLD_IN: {
        label: 'Apex Hold',
        icon: '⏸️',
        bg: 'bg-cyan-500/20',
        text: 'text-cyan-300',
        border: 'border-cyan-500/40'
    },
    EXHALE: {
        label: 'Exhale Phase',
        icon: '🌬️',
        bg: 'bg-indigo-500/20',
        text: 'text-indigo-300',
        border: 'border-indigo-500/40'
    },
    HOLD_OUT: {
        label: 'Low Rest',
        icon: '⏹️',
        bg: 'bg-slate-500/20',
        text: 'text-slate-300',
        border: 'border-slate-500/40'
    }
};

const NOISE_TEXTURES: { id: string; name: string; tag: string; icon: string }[] = [
    { id: 'OCEAN', name: 'Ocean Surf', tag: 'Rolling Pacific swell', icon: '🌊' },
    { id: 'RAIN', name: 'Mountain Rain', tag: 'Gentle canopy shower', icon: '🌧️' },
    { id: 'STREAM', name: 'Forest Stream', tag: 'Fresh mountain water', icon: '💧' },
    { id: 'WIND', name: 'Wind Whisper', tag: 'Soft alpine breeze', icon: '🌬️' },
    { id: 'FIRE', name: 'Campfire', tag: 'Warm crackling hearth', icon: '🔥' },
    { id: 'FOREST', name: 'Forest Canopy', tag: 'Deep wild woodland', icon: '🌲' },
    { id: 'CAVE', name: 'Deep Cave', tag: 'Dark subterranean echo', icon: '🕳️' },
    { id: 'VINYL', name: 'Analog Vinyl', tag: 'Warm dust & needle hiss', icon: '📻' },
    { id: 'DRONE', name: 'Ambient Drone', tag: 'Vocal harmonic warmth', icon: '🛸' },
    { id: 'WHITE', name: 'White Air', tag: 'Full-spectrum mist', icon: '💨' },
    { id: 'PINK', name: 'Pink Noise', tag: 'Balanced 1/f warm soothe', icon: '🌸' },
    { id: 'BROWN', name: 'Brown Sub', tag: 'Deep low-end ocean floor', icon: '🪵' },
    { id: 'SILENCE', name: 'Silence', tag: 'Muted respiration air', icon: '🤫' },
];

const PACER_VISUAL_MODES = [
    { id: 'RING', label: 'Expanding Ring' },
    { id: 'HORIZON', label: 'Ocean Horizon' },
    { id: 'VIGNETTE', label: 'Peripheral Vignette' },
    { id: 'GLOW', label: 'Radial Glow' },
    { id: 'DOT', label: 'Zenith Dot' },
    { id: 'CHEVRON', label: 'Dynamic Chevron' },
    { id: 'NONE', label: 'Hidden' },
];

const PACER_COLOR_PRESETS = [
    { id: 'CYAN_OCEAN', label: 'Cyan Ocean', color: '#06b6d4' },
    { id: 'CHAKRA_RAINBOW', label: 'Chakra Rainbow', color: '#a855f7' },
    { id: 'DEEP_TWILIGHT', label: 'Deep Twilight', color: '#6366f1' },
    { id: 'GOLDEN_SOLAR', label: 'Golden Solar', color: '#f59e0b' },
    { id: 'EMERALD_NATURE', label: 'Emerald Nature', color: '#10b981' },
    { id: 'MONOCHROME_ZEN', label: 'Monochrome Zen', color: '#94a3b8' },
    { id: 'COHERENT_ROSE', label: 'Coherent Rose', color: '#f43f5e' },
];

export const PhaseBreathAccordion: React.FC<Props> = ({
    block,
    blockIndex,
    updateBlock,
    defaultOpen = false,
    isOpen: controlledOpen,
    onToggleOpen
}) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const handleToggle = () => {
        if (onToggleOpen) onToggleOpen();
        else setInternalOpen(!isOpen);
    };

    const breathPhase: BreathPhase = block.breathPhase || 'INHALE';
    const currentPhaseDef = PHASE_DEFS[breathPhase] || PHASE_DEFS.INHALE;
    const duration = block.durationSeconds || 4.0;
    const glide = block.glideSeconds ?? 0.4;

    const breathCfg = block.breath || {};
    const isCustomBreath = breathCfg.enabled ?? false;

    // Sub-breath cycle pattern (Inhale / HoldIn / Exhale / HoldOut + Loops)
    const activePattern: BlockBreathPattern = block.breathPattern || breathCfg.pattern || {
        mode: 'PACED',
        inhale: 4,
        holdIn: 2,
        exhale: 6,
        holdOut: 0,
        cycles: Math.max(1, Math.round(duration / 12)),
        label: '4-2-6 Paced Breath'
    };

    const updatePatternPatch = (patch: Partial<BlockBreathPattern>, autoAdjustDuration = false) => {
        const nextPattern: BlockBreathPattern = {
            ...activePattern,
            ...patch
        };
        const oneLoop = (nextPattern.inhale || 4) + (nextPattern.holdIn || 0) + (nextPattern.exhale || 4) + (nextPattern.holdOut || 0);
        const loops = nextPattern.cycles || 1;
        const newDuration = autoAdjustDuration ? Math.max(1, Math.round(oneLoop * loops)) : duration;

        updateBlock(blockIndex, {
            breathPattern: nextPattern,
            durationSeconds: newDuration,
            breath: {
                ...breathCfg,
                enabled: true,
                pattern: nextPattern
            }
        });
    };

    const activeNoise = breathCfg.noiseType || 'OCEAN';
    const activeNoiseVol = breathCfg.noiseVolume ?? 0.7;
    const activeEntrainTide = breathCfg.entrainTide ?? false;
    const activeTideMode = breathCfg.tideEntrainMode || 'ISOCHRONIC';
    const activeTideDepth = breathCfg.tideEntrainDepth ?? 0.6;

    const activeCueTone = breathCfg.cueTone || 'NONE';
    const activeCueVol = breathCfg.cueVolume ?? 0.7;
    const activeCueOctave = breathCfg.cueOctave ?? 4;
    const activeCueDecay = breathCfg.cueDecay ?? 1.5;

    const activeVisualMode = breathCfg.visualMode || 'RING';
    const activeColorScheme = breathCfg.colorScheme || 'CYAN_OCEAN';

    const updateBreathPatch = (patch: Partial<BlockBreathConfig>) => {
        updateBlock(blockIndex, {
            breath: {
                ...breathCfg,
                enabled: true,
                ...patch
            }
        });
    };

    const toggleCustomBreath = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateBlock(blockIndex, {
            breath: {
                ...breathCfg,
                enabled: !isCustomBreath,
                noiseType: activeNoise,
                noiseVolume: activeNoiseVol,
                cueTone: activeCueTone,
                visualMode: activeVisualMode,
                colorScheme: activeColorScheme
            }
        });
    };

    const currentNoiseObj = NOISE_TEXTURES.find(n => n.id === activeNoise) || NOISE_TEXTURES[0];
    const currentBellObj = PACER_BELL_TONES.find(b => b.id === activeCueTone) || PACER_BELL_TONES[0];

    return (
        <div className="border border-emerald-500/30 rounded-xl bg-slate-950/80 overflow-hidden transition-all shadow-[0_2px_12px_rgba(16,185,129,0.08)]">
            {/* Tinted Accordion Header - Spacious min-h to prevent text clipping */}
            <div
                onClick={handleToggle}
                className="min-h-[68px] sm:min-h-[64px] py-2.5 px-3 sm:px-3.5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-slate-950/90 hover:from-emerald-950/90 hover:via-slate-900 transition-all select-none border-b border-emerald-500/20"
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className="w-8 h-8 rounded-lg border bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)] flex items-center justify-center shrink-0 self-center">
                        <Wind size={15} />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                                Breath & Timing
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${currentPhaseDef.bg} ${currentPhaseDef.text} ${currentPhaseDef.border}`}>
                                <span>{currentPhaseDef.icon}</span>
                                <span>{currentPhaseDef.label}</span>
                                <span>· {duration.toFixed(1)}s</span>
                            </span>
                            {isCustomBreath && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                                    Custom
                                </span>
                            )}
                        </div>
                        <span className="text-[10.5px] text-emerald-300/85 block leading-normal">
                            {isCustomBreath 
                                ? `${currentNoiseObj.name} noise · ${activeCueTone !== 'NONE' ? currentBellObj.name : 'No chime cue'}` 
                                : 'Sync with global respiratory soundscape & turnaround cues'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center pl-1">
                    <button
                        type="button"
                        onClick={toggleCustomBreath}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all border ${
                            isCustomBreath
                                ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50 shadow-sm'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                        }`}
                        title={isCustomBreath ? "Phase uses custom sound & cues" : "Inheriting global breath soundscape"}
                    >
                        {isCustomBreath ? 'Custom' : 'Inherit'}
                    </button>
                    {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </div>

            {/* Accordion Body */}
            {isOpen && (
                <div className="p-3 sm:p-3.5 space-y-4 bg-black/40 border-t border-white/5">
                    {/* SECTION 1: Respiratory Kinetic State & Timing */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase text-emerald-300 tracking-wider flex items-center gap-1">
                                <Activity size={12} className="text-emerald-400" />
                                <span>1. Respiratory Kinetic State & Envelope</span>
                            </label>
                            {block.breathPattern && (
                                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                                    {block.breathPattern.label || `${block.breathPattern.cycles || 1} Loops`}
                                </span>
                            )}
                        </div>

                        {/* SUB-BREATH PATTERN (Inhale, Apex Hold, Exhale, Low Rest + Cycles) */}
                        <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-2.5 space-y-2.5 shadow-sm">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                    <Wind size={12} className="text-teal-400" />
                                    Breath Cycle Timing
                                </span>
                                <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                                    <Repeat size={10} className="text-slate-400" />
                                    <span>{activePattern.cycles || 1} {((activePattern.cycles || 1) === 1) ? 'cycle' : 'cycles'}</span>
                                    <span className="text-slate-500">·</span>
                                    <span>{((activePattern.inhale || 4) + (activePattern.holdIn || 0) + (activePattern.exhale || 4) + (activePattern.holdOut || 0)).toFixed(1)}s / cycle</span>
                                </div>
                            </div>

                            {/* 4-Step Respiratory Timing Boxes (Inhale, Apex Hold, Exhale, Low Rest) */}
                            <div className="grid grid-cols-4 gap-1.5">
                                {/* Inhale */}
                                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-1.5 flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tight">Inhale</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0.5"
                                            max="30"
                                            value={activePattern.inhale ?? 4}
                                            onChange={(e) => updatePatternPatch({ inhale: Math.max(0.5, parseFloat(e.target.value) || 1) }, true)}
                                            className="w-10 bg-black/60 border border-emerald-500/30 rounded text-center text-xs font-mono font-bold text-white py-0.5"
                                        />
                                        <span className="text-[9px] text-slate-400 font-mono">s</span>
                                    </div>
                                </div>

                                {/* Apex Hold */}
                                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-lg p-1.5 flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-tight">Apex Hold</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            max="30"
                                            value={activePattern.holdIn ?? 2}
                                            onChange={(e) => updatePatternPatch({ holdIn: Math.max(0, parseFloat(e.target.value) || 0) }, true)}
                                            className="w-10 bg-black/60 border border-cyan-500/30 rounded text-center text-xs font-mono font-bold text-white py-0.5"
                                        />
                                        <span className="text-[9px] text-slate-400 font-mono">s</span>
                                    </div>
                                </div>

                                {/* Exhale */}
                                <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-1.5 flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tight">Exhale</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0.5"
                                            max="30"
                                            value={activePattern.exhale ?? 6}
                                            onChange={(e) => updatePatternPatch({ exhale: Math.max(0.5, parseFloat(e.target.value) || 1) }, true)}
                                            className="w-10 bg-black/60 border border-indigo-500/30 rounded text-center text-xs font-mono font-bold text-white py-0.5"
                                        />
                                        <span className="text-[9px] text-slate-400 font-mono">s</span>
                                    </div>
                                </div>

                                {/* Low Rest */}
                                <div className="bg-slate-950/40 border border-slate-700/50 rounded-lg p-1.5 flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Low Rest</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            max="30"
                                            value={activePattern.holdOut ?? 0}
                                            onChange={(e) => updatePatternPatch({ holdOut: Math.max(0, parseFloat(e.target.value) || 0) }, true)}
                                            className="w-10 bg-black/60 border border-slate-700 rounded text-center text-xs font-mono font-bold text-white py-0.5"
                                        />
                                        <span className="text-[9px] text-slate-400 font-mono">s</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cycle Loops Multiplier */}
                            <div className="flex items-center justify-between bg-black/50 px-2 py-1.5 rounded-lg border border-white/5 text-xs">
                                <span className="text-slate-300 text-[11px] font-medium flex items-center gap-1.5">
                                    <Repeat size={12} className="text-emerald-400" />
                                    Breath Loops in this Phase:
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => updatePatternPatch({ cycles: Math.max(1, (activePattern.cycles || 1) - 1) }, true)}
                                        className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-xs flex items-center justify-center"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={activePattern.cycles || 1}
                                        onChange={(e) => updatePatternPatch({ cycles: Math.max(1, parseInt(e.target.value) || 1) }, true)}
                                        className="w-10 h-6 bg-slate-900 border border-white/20 rounded text-center text-xs font-mono font-bold text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => updatePatternPatch({ cycles: Math.min(100, (activePattern.cycles || 1) + 1) }, true)}
                                        className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-xs flex items-center justify-center"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Quick Presets Row */}
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                                {[
                                    { label: '4-7-8 Relax', in: 4, hIn: 7, ex: 8, hOut: 0 },
                                    { label: '4-4-4-4 Box', in: 4, hIn: 4, ex: 4, hOut: 4 },
                                    { label: '5.5s Coherent', in: 5.5, hIn: 0, ex: 5.5, hOut: 0 },
                                    { label: '4-2-6 Vagus', in: 4, hIn: 2, ex: 6, hOut: 0 },
                                    { label: '4-2-4 Balance', in: 4, hIn: 2, ex: 4, hOut: 0 },
                                ].map(p => (
                                    <button
                                        key={p.label}
                                        type="button"
                                        onClick={() => updatePatternPatch({ inhale: p.in, holdIn: p.hIn, exhale: p.ex, holdOut: p.hOut, label: p.label }, true)}
                                        className="px-2 py-0.5 rounded text-[9px] font-medium bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/40 text-slate-300 whitespace-nowrap transition-colors"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Legacy Single-Phase State Selector (if free flow or single cycle wanted) */}
                        <div className="pt-1">
                            <span className="text-[9px] font-semibold text-slate-400 block mb-1">Primary Kinetic Trajectory:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                {(['INHALE', 'HOLD_IN', 'EXHALE', 'HOLD_OUT'] as BreathPhase[]).map(phase => {
                                    const isActive = breathPhase === phase;
                                    const phaseDef = PHASE_DEFS[phase];
                                    return (
                                        <button
                                            key={phase}
                                            type="button"
                                            onClick={() => updateBlock(blockIndex, { breathPhase: phase })}
                                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                                                isActive
                                                    ? `${phaseDef.bg} ${phaseDef.text} ${phaseDef.border} shadow-sm scale-[1.01]`
                                                    : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <span>{phaseDef.icon}</span>
                                            <span>{phaseDef.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Duration Stepper & Range Slider */}
                        <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                                    <Clock size={13} className="text-emerald-400" />
                                    <span className="font-semibold">Phase Duration:</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => updateBlock(blockIndex, { durationSeconds: Math.max(0.5, duration - 0.5) })}
                                        className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center active:bg-white/25 hover:bg-white/20 text-sm font-bold"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0.5"
                                        max="60"
                                        value={duration}
                                        onChange={(e) => updateBlock(blockIndex, { durationSeconds: Math.max(0.5, parseFloat(e.target.value) || 1.0) })}
                                        className="w-14 h-7 bg-slate-900 border border-white/15 rounded-lg px-1 text-center font-mono font-bold text-white text-xs"
                                    />
                                    <span className="text-xs text-slate-400 font-mono">s</span>
                                    <button
                                        type="button"
                                        onClick={() => updateBlock(blockIndex, { durationSeconds: Math.min(60, duration + 0.5) })}
                                        className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center active:bg-white/25 hover:bg-white/20 text-sm font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="30"
                                step="0.5"
                                value={duration}
                                onChange={(e) => updateBlock(blockIndex, { durationSeconds: parseFloat(e.target.value) || 1.0 })}
                                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />

                            {/* Portamento Glide / Crossfade into next block */}
                            <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-white/5">
                                <span className="text-[11px] font-medium text-slate-300">Envelope Crossfade / Glide:</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="2.0"
                                        step="0.1"
                                        value={glide}
                                        onChange={(e) => updateBlock(blockIndex, { glideSeconds: parseFloat(e.target.value) })}
                                        className="w-24 accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                                    />
                                    <span className="font-mono text-emerald-300 font-bold text-xs">{glide.toFixed(1)}s</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Breath Sound & Noise Textures */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
                                <Volume2 size={12} />
                                <span>2. Phase Sound & Noise Patterns</span>
                            </label>
                            <span className="text-[8px] font-mono text-cyan-400 font-bold">
                                {currentNoiseObj.icon} {currentNoiseObj.name}
                            </span>
                        </div>

                        {/* Noise Texture Grid */}
                        <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                            {NOISE_TEXTURES.map(item => {
                                const isSelected = activeNoise === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => updateBreathPatch({ noiseType: item.id })}
                                        className={`p-1.5 rounded-lg text-left transition-all border text-[9px] font-medium flex items-center gap-1.5 ${
                                            isSelected
                                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-sm'
                                                : 'bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="text-base shrink-0">{item.icon}</span>
                                        <div className="min-w-0">
                                            <span className="font-bold block leading-tight">{item.name}</span>
                                            <span className="text-[7.5px] text-slate-400 block leading-tight">{item.tag}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Noise Volume & Tide Entrainment Fader */}
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-[9px]">
                                <span className="font-bold uppercase tracking-wider text-slate-400">Respiration Ocean/Tide Level</span>
                                <span className="font-mono font-bold text-cyan-300">{Math.round(activeNoiseVol * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={activeNoiseVol}
                                onChange={(e) => updateBreathPatch({ noiseVolume: parseFloat(e.target.value) })}
                                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />

                            {/* Tide Entrainment Modulation */}
                            <div className="pt-2 border-t border-white/5 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-slate-300 font-medium">Breath Tide Entrainment Modulation</span>
                                    <button
                                        type="button"
                                        onClick={() => updateBreathPatch({ entrainTide: !activeEntrainTide })}
                                        className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-colors border ${
                                            activeEntrainTide
                                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                                                : 'bg-white/5 text-slate-500 border-white/10'
                                        }`}
                                    >
                                        {activeEntrainTide ? 'Modulating' : 'Off'}
                                    </button>
                                </div>
                                {activeEntrainTide && (
                                    <div className="space-y-1.5 pt-1">
                                        <div className="grid grid-cols-3 gap-1">
                                            {(['ISOCHRONIC', 'BINAURAL', 'MONAURAL'] as const).map(mode => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => updateBreathPatch({ tideEntrainMode: mode })}
                                                    className={`py-1 text-[8px] font-bold rounded uppercase border transition-colors ${
                                                        activeTideMode === mode
                                                            ? 'bg-cyan-500/30 text-cyan-200 border-cyan-500/60 shadow-xs'
                                                            : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                                                    }`}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between text-[8px] text-slate-400 pt-0.5">
                                            <span>Modulation Depth</span>
                                            <span className="font-mono text-cyan-300">{Math.round(activeTideDepth * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0.1}
                                            max={1.0}
                                            step={0.05}
                                            value={activeTideDepth}
                                            onChange={(e) => updateBreathPatch({ tideEntrainDepth: parseFloat(e.target.value) })}
                                            className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Turnaround Bell & Cue Tones */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                                <Bell size={12} />
                                <span>3. Turnaround Bell & Cue Sound</span>
                            </label>
                            <span className="text-[8px] font-mono text-amber-400 font-bold">
                                {currentBellObj.name}
                            </span>
                        </div>

                        {/* Bell Sound Selection Grid */}
                        <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                            {PACER_BELL_TONES.map(tone => {
                                const isSelected = activeCueTone === tone.id;
                                return (
                                    <button
                                        key={tone.id}
                                        type="button"
                                        onClick={() => updateBreathPatch({ cueTone: tone.id })}
                                        className={`p-1.5 rounded-lg text-left transition-all border text-[9px] font-medium flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm'
                                                : 'bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <span className="font-bold block leading-tight">{tone.name}</span>
                                            <span className="text-[7.5px] text-slate-400 block leading-tight">{tone.tag}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Bell Tuning Parameters (when active) */}
                        {activeCueTone !== 'NONE' && (
                            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-2 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between text-[9px]">
                                    <span className="font-bold uppercase tracking-wider text-slate-400">Bell Volume</span>
                                    <span className="font-mono font-bold text-amber-300">{Math.round(activeCueVol * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={0.1}
                                    max={1.0}
                                    step={0.05}
                                    value={activeCueVol}
                                    onChange={(e) => updateBreathPatch({ cueVolume: parseFloat(e.target.value) })}
                                    className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                                />

                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                                    {/* Octave Selector */}
                                    <div>
                                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block mb-1">
                                            Cue Octave
                                        </span>
                                        <div className="grid grid-cols-5 gap-1">
                                            {[2, 3, 4, 5, 6].map(oct => (
                                                <button
                                                    key={oct}
                                                    type="button"
                                                    onClick={() => updateBreathPatch({ cueOctave: oct })}
                                                    className={`py-0.5 text-[8px] font-bold rounded border transition-colors ${
                                                        activeCueOctave === oct
                                                            ? 'bg-amber-500/30 text-amber-200 border-amber-500/60'
                                                            : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                                                    }`}
                                                >
                                                    {oct}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ring / Decay Duration */}
                                    <div>
                                        <div className="flex justify-between text-[8px] uppercase tracking-wider text-slate-400 mb-1">
                                            <span>Decay Ring</span>
                                            <span className="font-mono text-amber-300">{activeCueDecay.toFixed(1)}s</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0.3}
                                            max={4.0}
                                            step={0.1}
                                            value={activeCueDecay}
                                            onChange={(e) => updateBreathPatch({ cueDecay: parseFloat(e.target.value) })}
                                            className="w-full accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: Visual Pacer Style & Color Scheme */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                        <label className="text-[9px] font-bold uppercase text-teal-300 tracking-wider flex items-center gap-1.5">
                            <Eye size={12} />
                            <span>4. Pacer Visual Mode & Color Scheme</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {PACER_VISUAL_MODES.map(mode => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => updateBreathPatch({ visualMode: mode.id })}
                                    className={`py-1.5 px-2 text-[9px] font-bold rounded border transition-colors text-center ${
                                        activeVisualMode === mode.id
                                            ? 'bg-teal-500/30 text-teal-200 border-teal-500/60 shadow-xs'
                                            : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                                    }`}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {PACER_COLOR_PRESETS.map(scheme => (
                                <button
                                    key={scheme.id}
                                    type="button"
                                    onClick={() => updateBreathPatch({ colorScheme: scheme.id })}
                                    className={`py-1.5 px-2 text-[9px] font-bold rounded border transition-colors flex items-center gap-1.5 ${
                                        activeColorScheme === scheme.id
                                            ? 'bg-white/15 text-white border-white/40 shadow-xs'
                                            : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                                    }`}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: scheme.color }}
                                    />
                                    <span>{scheme.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
