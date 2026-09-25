import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Activity, Wind, Sliders, Bell, ChevronDown, Save, Trash2, Layout, Heart, Waves, Smartphone, Eye, BookOpen, Zap, Moon, Scale, Trophy, Play, X, Music, Clock, VolumeX } from 'lucide-react';
import { BreathConfig, MetronomeSound, TurnaroundMode } from '../../../services/audio/AudioTypes';
import { UIConfig } from '../../system/StyleEditor';
import { Fader } from '../../ui/Faders';
import { SENTIC_STATES, SenticEmotion } from '../../../services/kinematics/senticForms';

interface Props { temporal: any; audioSys: any; uiConfig: UIConfig; bpm: number; }

export type BreathCategory = 'RELAX' | 'BALANCE' | 'ENERGY' | 'PERFORMANCE';

export interface BreathPreset { id: string; name: string; category: BreathCategory; description: string; benefits: string[]; config: { inhale: number, holdIn: number, exhale: number, holdOut: number }; }

export const DEFAULT_BREATH_PRESETS: BreathPreset[] = [
    { id: 'resonance', name: 'Resonance (Coherent)', category: 'BALANCE', description: 'The "Om" frequency (0.1Hz). Maximizes Heart Rate Variability (HRV) and aligns cardiovascular rhythms.', benefits: ['❤️ Max HRV', '🧠 Flow State', '⚖️ Autonomic Balance'], config: { inhale: 5.5, holdIn: 0, exhale: 5.5, holdOut: 0 } },
    { id: 'box', name: 'Box Breathing', category: 'BALANCE', description: 'Used by Navy SEALs to reset panic and heighten focus. Equalizes O2 and CO2 levels.', benefits: ['🛡️ Stress Armor', '🎯 Laser Focus', '🛑 Panic Reset'], config: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 } },
    { id: 'triangle', name: 'Triangle (Apnea)', category: 'BALANCE', description: 'Geometric synchronization pattern. Removes the wait phase to maintain momentum.', benefits: ['📐 Geometric Sync', '⚖️ Stabilization', '🌬️ Breath Control'], config: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 0 } },
    { id: 'relax', name: 'The 4-7-8', category: 'RELAX', description: 'Dr. Andrew Weil\'s famous technique. A potent parasympathetic brake for sleep onset.', benefits: ['🌙 Insomnia Relief', '📉 Lowers BP', '🧘 Deep Calm'], config: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 } },
    { id: 'vagal_brake', name: 'Vagal Brake', category: 'RELAX', description: 'Doubles the exhale duration to stimulate the Vagus Nerve and crash cortisol levels.', benefits: ['💓 Slows Heart', '😌 Anxiety Relief', '🌬️ Vagus Stim'], config: { inhale: 4, holdIn: 0, exhale: 8, holdOut: 0 } },
    { id: 'deep_sleep', name: 'Deep Sleep', category: 'RELAX', description: 'Heavy sedation pattern with long exhales and pauses. Mimics delta-wave sleep breathing.', benefits: ['💤 Sedation', '🌙 Sleep Induction', '📉 Cortisol Crash'], config: { inhale: 4, holdIn: 2, exhale: 8, holdOut: 4 } },
    { id: 'tranquility', name: 'Tranquility', category: 'RELAX', description: 'Gentle pauses after inhale and exhale to still the mind without strain.', benefits: ['☮️ Inner Peace', '🌊 Gentle Rhythm', '😌 Mild Relaxation'], config: { inhale: 4, holdIn: 2, exhale: 4, holdOut: 2 } },
    { id: 'dmt', name: 'Tummo (Fire)', category: 'ENERGY', description: 'Super-ventilation technique (Wim Hof style). Rapid oxygenation increases alkalinity and alertness.', benefits: ['🔥 Inner Heat', '⚡ High Energy', '🧪 Alkalinity'], config: { inhale: 2, holdIn: 0, exhale: 1, holdOut: 0 } },
    { id: 'golden_ratio', name: 'Golden Ratio (Phi)', category: 'PERFORMANCE', description: 'Aligns biological rhythms with the Golden Ratio (Phi) to prevent chaotic feedback and enhance discernment.', benefits: ['✨ Gamma Sync', '🧠 Memory', '👁️ Clarity'], config: { inhale: 4.0, holdIn: 0, exhale: 6.5, holdOut: 0 } },
    { id: 'square_adv', name: 'Square (Advanced)', category: 'PERFORMANCE', description: 'A 40-second cycle for elite focus and CO2 tolerance building.', benefits: ['🤿 CO2 Tolerance', '🧘‍♂️ Deep Trance', '🧠 Mental Resilience'], config: { inhale: 10, holdIn: 10, exhale: 10, holdOut: 10 } },
    { id: 'co2_a', name: 'CO2 Table A', category: 'PERFORMANCE', description: 'Hypoxic training interval. Forces the body to become more efficient at utilizing oxygen.', benefits: ['🏃 Oxygen Efficiency', '🔴 Hypoxic Training', '💪 Endurance'], config: { inhale: 4, holdIn: 0, exhale: 4, holdOut: 15 } },
    { id: 'co2_b', name: 'CO2 Table B', category: 'PERFORMANCE', description: 'Advanced hypoxic hold. Only for experienced practitioners.', benefits: ['🚀 Elite Endurance', '🔴 Deep Hypoxia', '🧠 Mental Toughness'], config: { inhale: 4, holdIn: 0, exhale: 4, holdOut: 30 } }
];

const METRONOME_SOUNDS: MetronomeSound[] = ['BAMBOO', 'STONE', 'CEDAR', 'CLAY', 'THUNDER'];

// DAW GRID DEFINITIONS (12 Distinct Musical Divisions)
const DAW_GRID = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64];
const getDawGridLabel = (sub: number) => {
    const labels: Record<number, string> = {
        1: '1 Bar', 2: '1/2', 3: '1/2T', 4: '1/4', 6: '1/4T', 
        8: '1/8', 12: '1/8T', 16: '1/16', 24: '1/16T', 
        32: '1/32', 48: '1/32T', 64: '1/64'
    };
    return labels[sub] || `${sub}`;
};

export const CATEGORY_ICONS = { RELAX: <Moon size={12} className="text-indigo-400" />, BALANCE: <Scale size={12} className="text-teal-400" />, ENERGY: <Zap size={12} className="text-amber-400" />, PERFORMANCE: <Trophy size={12} className="text-rose-400" /> };
export const CATEGORY_GRADIENTS = { RELAX: 'from-indigo-950 to-slate-950', BALANCE: 'from-teal-950 to-slate-950', ENERGY: 'from-amber-950 to-slate-950', PERFORMANCE: 'from-rose-950 to-slate-950' };
export const CATEGORY_ACCENT = { RELAX: 'text-indigo-400 border-indigo-500/50 bg-indigo-500/10', BALANCE: 'text-teal-400 border-teal-500/50 bg-teal-500/10', ENERGY: 'text-amber-400 border-amber-500/50 bg-amber-500/10', PERFORMANCE: 'text-rose-400 border-rose-500/50 bg-rose-500/10' };

import { getPacerColors, PACER_COLOR_SCHEMES, PACER_STYLES } from '../../../services/audio/pacerStyles';

export const TideMeter = ({ 
    config, 
    uiConfig,
    isActive, 
    startTime,
    overrideProgress,
    overridePhase,
    experienceBlocks,
    activeBlockIndex,
    isPaused
}: { 
    config: BreathConfig; 
    uiConfig?: UIConfig; 
    isActive?: boolean; 
    startTime?: number;
    overrideProgress?: number;
    overridePhase?: string | number;
    experienceBlocks?: Array<{ durationSeconds: number; breathPhase: string; label?: string }>;
    activeBlockIndex?: number;
    isPaused?: boolean;
}) => {
    const puckRef = useRef<HTMLDivElement>(null);
    const [activePhaseIndex, setActivePhaseIndex] = useState<number>(-1); 
    const requestRef = useRef<number>(0);
    
    const pacerColors = getPacerColors(config?.colorScheme, config?.customColor);

    const isExpMode = Boolean(experienceBlocks && experienceBlocks.length > 0);
    const expTotalDuration = isExpMode 
        ? experienceBlocks!.reduce((acc, b) => acc + (b.durationSeconds || 4), 0) || 1
        : 1;

    const inhale = config?.inhale ?? 4;
    const holdIn = config?.holdIn ?? 2;
    const exhale = config?.exhale ?? 6;
    const holdOut = config?.holdOut ?? 0;

    const standardTotal = (inhale + holdIn + exhale + holdOut) || 1;
    const getW = (v: number) => ((v / standardTotal) * 100);

    const getPhaseColor = (phase: string) => {
        if (phase === 'INHALE') return pacerColors.inhale || '#10b981';
        if (phase === 'HOLD_IN') return pacerColors.holdIn || '#f59e0b';
        if (phase === 'EXHALE') return pacerColors.exhale || '#a855f7';
        if (phase === 'HOLD_OUT') return pacerColors.holdOut || '#3b82f6';
        return '#06b6d4';
    };

    // Declaratively resolve the active phase index without triggering setState during renders
    const resolvedPhaseIndex = useMemo(() => {
        if (isExpMode) {
            return activeBlockIndex !== undefined ? activeBlockIndex : 0;
        }
        if (overridePhase !== undefined) {
            if (typeof overridePhase === 'number') return overridePhase;
            if (overridePhase === 'HOLD_IN') return 1;
            if (overridePhase === 'EXHALE') return 2;
            if (overridePhase === 'HOLD_OUT') return 3;
            return 0;
        }
        return activePhaseIndex;
    }, [isExpMode, activeBlockIndex, overridePhase, activePhaseIndex]);

    // Compute puck position declaratively when overrideProgress is supplied
    const overridePuckPct = useMemo(() => {
        if (isExpMode && experienceBlocks && experienceBlocks.length > 0) {
            const curIdx = activeBlockIndex !== undefined ? activeBlockIndex : 0;
            const clampedProg = Math.max(0, Math.min(1, overrideProgress !== undefined ? overrideProgress : 0));
            let startPct = 0;
            for (let i = 0; i < curIdx && i < experienceBlocks.length; i++) {
                startPct += ((experienceBlocks[i].durationSeconds || 4) / expTotalDuration) * 100;
            }
            const currentBlockDuration = (experienceBlocks[curIdx]?.durationSeconds || 4);
            const widthPct = (currentBlockDuration / expTotalDuration) * 100;
            return Math.min(99.8, Math.max(0.2, startPct + (widthPct * clampedProg)));
        }

        if (overrideProgress !== undefined) {
            let phaseIdx = 0;
            if (typeof overridePhase === 'number') {
                phaseIdx = overridePhase;
            } else if (overridePhase === 'HOLD_IN') {
                phaseIdx = 1;
            } else if (overridePhase === 'EXHALE') {
                phaseIdx = 2;
            } else if (overridePhase === 'HOLD_OUT') {
                phaseIdx = 3;
            } else {
                phaseIdx = 0;
            }

            const clampedProg = Math.max(0, Math.min(1, overrideProgress));
            let startPct = 0;
            let widthPct = getW(inhale);

            if (phaseIdx === 1) {
                startPct = getW(inhale);
                widthPct = getW(holdIn);
            } else if (phaseIdx === 2) {
                startPct = getW(inhale) + getW(holdIn);
                widthPct = getW(exhale);
            } else if (phaseIdx === 3) {
                startPct = getW(inhale) + getW(holdIn) + getW(exhale);
                widthPct = getW(holdOut);
            }

            const currentPosPct = startPct + (widthPct * clampedProg);
            return Math.min(99.5, Math.max(0.5, currentPosPct));
        }

        return null;
    }, [isExpMode, experienceBlocks, activeBlockIndex, overrideProgress, overridePhase, expTotalDuration, inhale, holdIn, exhale, holdOut, standardTotal]);

    // Standalone autonomous animation loop when running purely from system timer (NO overrideProgress)
    useEffect(() => {
        if (overrideProgress !== undefined) {
            return;
        }

        if (!isActive || !startTime || standardTotal <= 0) {
            if (puckRef.current) puckRef.current.style.left = '0%';
            setActivePhaseIndex(prev => (prev !== -1 ? -1 : prev));
            return;
        }
        
        let animId: number;
        const loop = () => {
            if (isPaused) {
                animId = requestAnimationFrame(loop);
                return;
            }
            const now = performance.now() / 1000;
            const elapsed = Math.max(0, now - startTime);
            const absoluteProgress = elapsed % standardTotal;
            const progress = absoluteProgress / standardTotal;
            
            if (puckRef.current) puckRef.current.style.left = `${progress * 100}%`;

            let newPhase = -1;
            if (absoluteProgress < inhale) newPhase = 0;
            else if (absoluteProgress < inhale + holdIn) newPhase = 1;
            else if (absoluteProgress < inhale + holdIn + exhale) newPhase = 2;
            else newPhase = 3;
            setActivePhaseIndex(prev => (prev !== newPhase ? newPhase : prev));

            animId = requestAnimationFrame(loop);
        };
        animId = requestAnimationFrame(loop);
        return () => { if (animId) cancelAnimationFrame(animId); };
    }, [overrideProgress, isActive, startTime, isPaused, standardTotal, inhale, holdIn, exhale, holdOut]);

    const isSentic = config.isSenticPacing && config.senticState && config.senticState !== 'NO_EMOTION';

    const curExpProg = Math.max(0, Math.min(1, overrideProgress !== undefined ? overrideProgress : 0));

    return (
        <div className="h-5 w-full bg-slate-900 rounded-sm relative overflow-hidden border border-white/10 shadow-inner">
            <div className="absolute inset-0 flex">
                {isExpMode && experienceBlocks && experienceBlocks.length > 0 ? (
                    experienceBlocks.map((b, idx) => {
                        const blockW = ((b.durationSeconds || 4) / expTotalDuration) * 100;
                        const isCurrent = resolvedPhaseIndex === idx;
                        const isPast = activeBlockIndex !== undefined && idx < activeBlockIndex;
                        const color = getPhaseColor(b.breathPhase);
                        return (
                            <div
                                key={idx}
                                style={{
                                    width: `${blockW}%`,
                                    backgroundColor: `${color}20`,
                                }}
                                className={`relative transition-all duration-100 border-r border-white/10 flex items-center justify-center overflow-hidden ${
                                    isCurrent ? 'z-10' : (isPast ? 'opacity-85' : 'opacity-40')
                                }`}
                                title={`${b.label || b.breathPhase} (${(b.durationSeconds || 4).toFixed(1)}s)`}
                            >
                                <div
                                    className="absolute inset-y-0 left-0 transition-all duration-75"
                                    style={{
                                        width: isPast ? '100%' : (isCurrent ? `${curExpProg * 100}%` : '0%'),
                                        backgroundColor: color,
                                        opacity: isCurrent ? 0.9 : 0.4,
                                        boxShadow: isCurrent ? `0 0 12px ${color}` : 'none'
                                    }}
                                />
                                <span className="relative z-10 text-[8px] font-mono font-bold tracking-tight text-white select-none truncate px-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                    {b.breathPhase.charAt(0)}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <>
                        <div 
                            style={{ 
                                width: `${getW(config.inhale)}%`, 
                                backgroundColor: resolvedPhaseIndex === 0 ? pacerColors.inhale : `${pacerColors.inhale}33`,
                                boxShadow: resolvedPhaseIndex === 0 ? `0 0 12px ${pacerColors.inhale}` : 'none'
                            }} 
                            className={`relative transition-all duration-200 border-r border-white/5 ${resolvedPhaseIndex === 0 ? 'z-10' : 'opacity-60'}`}
                        />
                        <div 
                            style={{ 
                                width: `${getW(config.holdIn)}%`, 
                                backgroundColor: resolvedPhaseIndex === 1 ? pacerColors.holdIn : `${pacerColors.holdIn}33`,
                                boxShadow: resolvedPhaseIndex === 1 ? `0 0 12px ${pacerColors.holdIn}` : 'none'
                            }} 
                            className={`relative transition-all duration-200 border-r border-white/5 ${resolvedPhaseIndex === 1 ? 'z-10' : 'opacity-60'}`}
                        />
                        <div 
                            style={{ 
                                width: `${getW(config.exhale)}%`, 
                                backgroundColor: resolvedPhaseIndex === 2 ? pacerColors.exhale : `${pacerColors.exhale}33`,
                                boxShadow: resolvedPhaseIndex === 2 ? `0 0 12px ${pacerColors.exhale}` : 'none'
                            }} 
                            className={`relative transition-all duration-200 border-r border-white/5 ${resolvedPhaseIndex === 2 ? 'z-10' : 'opacity-60'}`}
                        />
                        <div 
                            style={{ 
                                width: `${getW(config.holdOut)}%`, 
                                backgroundColor: resolvedPhaseIndex === 3 ? pacerColors.holdOut : `${pacerColors.holdOut}33`,
                                boxShadow: resolvedPhaseIndex === 3 ? `0 0 12px ${pacerColors.holdOut}` : 'none'
                            }} 
                            className={`relative transition-all duration-200 ${resolvedPhaseIndex === 3 ? 'z-10' : 'opacity-60'}`}
                        />
                    </>
                )}
                
                {isSentic && <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 pointer-events-none mix-blend-screen" />}
            </div>
            {isActive && (
                <div 
                    ref={puckRef} 
                    className={`absolute top-0 bottom-0 w-1 z-20 pointer-events-none ${
                        isSentic ? 'bg-pink-400 shadow-[0_0_10px_#f472b6]' : 'bg-white shadow-[0_0_8px_white] mix-blend-difference'
                    }`} 
                    style={{ left: overridePuckPct !== null ? `${overridePuckPct}%` : '0%' }} 
                />
            )}
        </div>
    );
};

export const PatternPreviewBar = ({ config }: { config: { inhale: number, holdIn: number, exhale: number, holdOut: number, isSenticPacing?: boolean, senticState?: string, colorScheme?: string, customColor?: string } }) => {
    const total = config.inhale + config.holdIn + config.exhale + config.holdOut || 1;
    const getW = (v: number) => (v / total) * 100;
    const pacerColors = getPacerColors(config.colorScheme, config.customColor);
    
    return (
        <div className="flex h-3 w-full rounded-full overflow-hidden bg-black/50 border border-white/10 mt-4 relative">
            <div style={{ width: `${getW(config.inhale)}%`, backgroundColor: `${pacerColors.inhale}cc` }} className="flex items-center justify-center"><span className="text-[6px] text-black font-bold opacity-0 md:opacity-100">IN</span></div>
            <div style={{ width: `${getW(config.holdIn)}%`, backgroundColor: `${pacerColors.holdIn}cc` }} className="flex items-center justify-center"><span className="text-[6px] text-black font-bold opacity-0 md:opacity-100">HOLD</span></div>
            <div style={{ width: `${getW(config.exhale)}%`, backgroundColor: `${pacerColors.exhale}cc` }} className="flex items-center justify-center"><span className="text-[6px] text-black font-bold opacity-0 md:opacity-100">OUT</span></div>
            <div style={{ width: `${getW(config.holdOut)}%`, backgroundColor: `${pacerColors.holdOut}cc` }} className="flex items-center justify-center"><span className="text-[6px] text-black font-bold opacity-0 md:opacity-100">WAIT</span></div>
            
            {(config.isSenticPacing && config.senticState && config.senticState !== 'NO_EMOTION') && (
                <div className="absolute inset-0 bg-pink-500/20 pointer-events-none mix-blend-screen" />
            )}
        </div>
    );
};

const PhaseNoiseDropdown = ({ value, onChange, activeColorClass, uiConfig }: { value: string, onChange: (v: string) => void, activeColorClass: string, uiConfig: UIConfig }) => {
    const TIDES = ['WHITE', 'PINK', 'BROWN', 'OCEAN', 'RAIN', 'STREAM', 'WIND', 'FIRE', 'FOREST', 'CAVE', 'VINYL', 'DRONE', 'SILENCE'];
    return (
        <div className="relative w-full">
            <select 
                value={value || 'PINK'} 
                onChange={(e) => onChange(e.target.value)} 
                className={`w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-[9px] font-bold outline-none transition-colors hover:bg-white/5 ${activeColorClass} appearance-none cursor-pointer uppercase tracking-widest`}
                style={{ color: uiConfig.textColor }}
            >
                {TIDES.map(t => <option key={t} value={t} className="bg-slate-950 text-slate-200">{t}</option>)}
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: uiConfig.textColor }} />
        </div>
    );
};

export const BreathDesigner: React.FC<Props> = ({ temporal, audioSys, uiConfig, bpm }) => {

    const { breathConfig: config, setBreathConfig: onChange, binauralFreqs } = temporal;
    const onPreview = audioSys.previewCue;

    const update = (key: keyof BreathConfig, val: any) => {
        const nextConfig = { ...config, [key]: val };
        onChange(nextConfig);
        if ((key as string).includes('Noise') || key === 'noiseType') {
            if (audioSys.updateBreathConfig) {
                audioSys.updateBreathConfig(nextConfig);
            }
        }
    };

    const [showEq, setShowEq] = useState(false);
    const [presets, setPresets] = useState<BreathPreset[]>(() => {
        const saved = localStorage.getItem('breath_presets');
        return saved ? [...DEFAULT_BREATH_PRESETS, ...JSON.parse(saved)] : DEFAULT_BREATH_PRESETS;
    });
    
    const [showDeck, setShowDeck] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [showSave, setShowSave] = useState(false);
    const [newName, setNewName] = useState('');

    const VISUALS = ['RING', 'HORIZON', 'VIGNETTE', 'GLOW', 'DOT', 'CHEVRON', 'NONE'];
    const TIDES = ['WHITE', 'PINK', 'BROWN', 'OCEAN', 'RAIN', 'STREAM', 'WIND', 'FIRE', 'FOREST', 'CAVE', 'VINYL', 'DRONE', 'SILENCE'];
    const TONES = ['NONE', 'SINE_BELL', 'TIBETAN', 'PIANO', 'HARP', 'WOOD', 'WATER', 'SHAKER', 'CELLO', 'SYNTH', 'OM', 'GONG', 'TRIANGLE'];
    const EQ_FREQS = ['20', '32', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k', '20k'];
    const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const SCIENTIFIC_KEYS = ['SCHUMANN', 'FIFTHS', 'PHI', 'HARMONIC', 'TRITONE', 'PLANCK', 'HEART'];

    const metronome = config.metronome || { enabled: false, sound: 'BAMBOO' as MetronomeSound, bpm: 60, syncToBreath: true, foam: 0.5, vol: 0.5, subdivision: 4, phaseMask: { inhale: true, holdIn: true, exhale: true, holdOut: true }, countdownBeats: 0 };

    const updateMetronome = (key: string, val: any) => onChange({ ...config, metronome: { ...metronome, [key]: val } });
    const togglePhaseMask = (phase: 'inhale' | 'holdIn' | 'exhale' | 'holdOut') => {
        const currentMask = metronome.phaseMask || { inhale: true, holdIn: true, exhale: true, holdOut: true };
        const isPhaseActive = currentMask[phase] !== false;
        updateMetronome('phaseMask', { ...currentMask, [phase]: !isPhaseActive });
    };

    const activePresetId = React.useMemo(() => {
        const match = presets.find(p => 
            Math.abs(p.config.inhale - config.inhale) < 0.1 &&
            Math.abs(p.config.holdIn - config.holdIn) < 0.1 &&
            Math.abs(p.config.exhale - config.exhale) < 0.1 &&
            Math.abs(p.config.holdOut - config.holdOut) < 0.1
        );
        return match ? match.id : null;
    }, [config.inhale, config.holdIn, config.exhale, config.holdOut, presets]);

    const activePreset = presets.find(p => p.id === activePresetId);
    const previewPreset = presets.find(p => p.id === previewId) || activePreset || presets[0];

    const updateEq = (index: number, value: number) => {
        const newEq = [...(config.tideEq || new Array(12).fill(0))];
        newEq[index] = value;
        update('tideEq', newEq);
    };

    const calculateBreathBpm = () => {
        const total = config.inhale + config.holdIn + config.exhale + config.holdOut;
        return total > 0 ? (60 / total).toFixed(1) : "0.0";
    };

    const loadPreset = (p: BreathPreset) => { onChange({ ...config, ...p.config }); setShowDeck(false); };

    const savePreset = () => {
        if(!newName) return;
        const newPreset: BreathPreset = { id: `custom_${Date.now()}`, name: newName, category: 'BALANCE', description: "Custom user preset.", benefits: ["✨ Custom Flow"], config: { inhale: config.inhale, holdIn: config.holdIn, exhale: config.exhale, holdOut: config.holdOut } };
        const customPresets = presets.filter(p => !DEFAULT_BREATH_PRESETS.some(dp => dp.id === p.id));
        const updated = [...customPresets, newPreset];
        localStorage.setItem('breath_presets', JSON.stringify(updated));
        setPresets([...DEFAULT_BREATH_PRESETS, ...updated]);
        setNewName('');
        setShowSave(false);
    };

    const deletePreset = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const customPresets = presets.filter(p => !DEFAULT_BREATH_PRESETS.some(dp => dp.id === p.id) && p.id !== id);
        localStorage.setItem('breath_presets', JSON.stringify(customPresets));
        setPresets([...DEFAULT_BREATH_PRESETS, ...customPresets]);
    };

    const totalSeconds = (config.inhale + config.holdIn + config.exhale + config.holdOut);
    const beatsPerSecond = totalSeconds > 0 ? ((metronome.subdivision || 4) / totalSeconds).toFixed(2) : "0.00";

    let approxFreq = 0;
    if (config.cueBase && config.cueBase !== 'NONE') {
        let base = 432; 
        if (config.cueBase === 'HEART') base = (bpm / 60) * 128; 
        else if (config.cueBase === 'SCHUMANN') base = 7.83 * 32; 
        else if (config.cueBase === 'FIFTHS') base = 256 * 1.5; 
        else if (config.cueBase === 'PHI') base = 256 * 1.618;
        else if (config.cueBase === 'TRITONE') base = 256 * 1.414;
        else if (config.cueBase === 'HARMONIC') base = 256 * 2;
        else if (config.cueBase === 'PLANCK') base = 256; 
        else if (config.cueBase === 'C') base = 261.63;
        else if (config.cueBase === 'C#') base = 277.18;
        else if (config.cueBase === 'D') base = 293.66;
        else if (config.cueBase === 'D#') base = 311.13;
        else if (config.cueBase === 'E') base = 329.63;
        else if (config.cueBase === 'F') base = 349.23;
        else if (config.cueBase === 'F#') base = 369.99;
        else if (config.cueBase === 'G') base = 392.00;
        else if (config.cueBase === 'G#') base = 415.30;
        else if (config.cueBase === 'A') base = 440.00;
        else if (config.cueBase === 'A#') base = 466.16;
        else if (config.cueBase === 'B') base = 493.88;
        approxFreq = base * ((config.cueHarmonic || 16) / 16);
    }

    const groupedPresets: Record<string, BreathPreset[]> = {
        RELAX: presets.filter(p => p.category === 'RELAX'), BALANCE: presets.filter(p => p.category === 'BALANCE'),
        ENERGY: presets.filter(p => p.category === 'ENERGY'), PERFORMANCE: presets.filter(p => p.category === 'PERFORMANCE'),
    };

    const activeSenticKey = (config.senticState as SenticEmotion) || 'NO_EMOTION';
    const senticData = SENTIC_STATES[activeSenticKey] || SENTIC_STATES['NO_EMOTION'];

    // CALCULATION FOR DAW SLIDER POSITION
    const currentDawIndex = DAW_GRID.indexOf(metronome.subdivision || 4);
    const safeDawIndex = currentDawIndex === -1 ? 3 : currentDawIndex; 

    return (
        <div className="space-y-4">
            
            <div className="p-3 rounded border transition-colors duration-300" style={{ backgroundColor: `rgba(${uiConfig.cardRgb}, 0.3)`, borderColor: `rgba(${uiConfig.borderRgb}, 0.2)` }}>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-emerald-400">
                        <Activity size={12} /> Breath Architect
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border text-emerald-300 bg-emerald-900/30 border-emerald-500/30">
                        {calculateBreathBpm()} BPM
                    </span>
                </div>

                <div className="flex gap-2 mb-3 animate-in fade-in duration-200">
                    <div className="relative flex-1">
                        <button onClick={() => { setShowDeck(true); setPreviewId(activePresetId || presets[0].id); }} className="w-full flex items-center justify-between rounded bg-black/40 border border-white/10 px-2 py-1.5 text-[10px] text-white hover:border-emerald-500/50 transition-colors group">
                            <span className="flex items-center gap-2"><BookOpen size={12} className="opacity-50 group-hover:text-emerald-400" />{activePreset ? activePreset.name : 'Custom Cycle'}</span>
                            <Layout size={12} className="opacity-50" />
                        </button>
                    </div>
                    <button onClick={() => setShowSave(!showSave)} className={`p-1.5 rounded border transition-colors ${showSave ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-transparent text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10'}`}><Save size={12} /></button>
                </div>

                {showDeck && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
                        <div className="flex-1 flex flex-col max-w-md w-full mx-auto bg-slate-950 border-x border-white/10 shadow-2xl relative overflow-hidden">
                            <div className={`p-6 shrink-0 relative bg-gradient-to-b ${CATEGORY_GRADIENTS[previewPreset.category]}`}>
                                <button onClick={() => setShowDeck(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                                <div className="flex justify-center mb-4"><span className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${CATEGORY_ACCENT[previewPreset.category]}`}>{CATEGORY_ICONS[previewPreset.category]} {previewPreset.category}</span></div>
                                <h2 className="text-2xl font-light text-center text-white mb-2 tracking-wide">{previewPreset.name}</h2>
                                <p className="text-xs text-center text-slate-300 leading-relaxed mb-4 px-2 font-medium">{previewPreset.description}</p>
                                <div className="flex flex-wrap justify-center gap-2 mb-6">{previewPreset.benefits.map((b, i) => (<span key={i} className="text-[9px] font-bold uppercase tracking-wide bg-black/30 text-slate-200 px-2 py-1 rounded border border-white/10">{b}</span>))}</div>
                                <div className="mb-6"><div className="flex justify-between text-[9px] font-mono text-slate-400 px-1 mb-1"><span>IN: {previewPreset.config.inhale}s</span><span>HOLD: {previewPreset.config.holdIn}s</span><span>OUT: {previewPreset.config.exhale}s</span><span>WAIT: {previewPreset.config.holdOut}s</span></div><PatternPreviewBar config={previewPreset.config} /></div>
                                <button onClick={() => loadPreset(previewPreset)} className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-sm rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"><Play size={16} fill="currentColor" /> Activate Breath</button>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-slate-900/50 p-4 space-y-6">
                                {Object.entries(groupedPresets).map(([cat, items]) => (
                                    items.length > 0 && (
                                        <div key={cat} className="space-y-2"><div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2 border-l-2 border-white/10 ml-1">{cat}</div><div className="grid grid-cols-1 gap-2">{items.map(p => {
                                            const isPreview = previewId === p.id;
                                            return (
                                                <div key={p.id} onClick={() => setPreviewId(p.id)} onDoubleClick={() => loadPreset(p)} className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 flex items-center justify-between group ${isPreview ? `bg-white/10 border-white/30` : 'bg-black/20 border-white/5 hover:bg-white/5'}`}>
                                                    <div className="flex flex-col"><span className={`text-xs font-bold transition-colors ${isPreview ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{p.name}</span><span className="text-[9px] font-mono text-slate-600 group-hover:text-slate-500">{p.config.inhale}-{p.config.holdIn}-{p.config.exhale}-{p.config.holdOut}</span></div>
                                                    {isPreview ? (<div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_currentColor]" />) : (!DEFAULT_BREATH_PRESETS.some(dp => dp.id === p.id) && (<button onClick={(e) => deletePreset(p.id, e)} className="p-1.5 text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>))}
                                                </div>
                                            )
                                        })}</div></div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {showSave && (
                    <div className="flex gap-2 mb-4 animate-in slide-in-from-top-2">
                        <input type="text" placeholder="Preset Name..." value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded px-2 text-[10px] text-white focus:border-emerald-500 focus:outline-none"/>
                        <button onClick={savePreset} disabled={!newName} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold uppercase">Save</button>
                    </div>
                )}

                <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase">
                            <span>Inhale</span>
                            <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="0" 
                                    max="60" 
                                    value={config.inhale} 
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        if (!isNaN(v) && v >= 0) update('inhale', v);
                                    }}
                                    className="w-14 bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-cyan-400 text-right focus:border-cyan-400 outline-none"
                                />
                                <span className="font-mono text-cyan-400">s</span>
                            </div>
                        </div>
                        <Fader value={config.inhale} min={0} max={60} step={0.5} onChange={(v:number) => update('inhale', v)} color="#22d3ee" uiConfig={uiConfig} />
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest w-12">Texture</span>
                            <div className="relative flex-1"><PhaseNoiseDropdown value={config.inhaleNoise || config.noiseType || 'PINK'} onChange={(v) => update('inhaleNoise', v)} activeColorClass="text-cyan-400" uiConfig={uiConfig}/></div>
                        </div>
                    </div>
                    
                    <div className="space-y-1 pl-2 border-l-2 border-amber-500/20">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase">
                            <span>Hold (Apex)</span>
                            <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="0" 
                                    max="60" 
                                    value={config.holdIn} 
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        if (!isNaN(v) && v >= 0) update('holdIn', v);
                                    }}
                                    className="w-14 bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-amber-400 text-right focus:border-amber-400 outline-none"
                                />
                                <span className="font-mono text-amber-400">s</span>
                            </div>
                        </div>
                        <Fader value={config.holdIn} min={0} max={60} step={0.5} onChange={(v:number) => update('holdIn', v)} color="#fbbf24" uiConfig={uiConfig} />
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest w-12">Texture</span>
                            <div className="relative flex-1"><PhaseNoiseDropdown value={config.holdInNoise || 'SILENCE'} onChange={(v) => update('holdInNoise', v)} activeColorClass="text-amber-400" uiConfig={uiConfig}/></div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase">
                            <span>Exhale</span>
                            <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="0" 
                                    max="60" 
                                    value={config.exhale} 
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        if (!isNaN(v) && v >= 0) update('exhale', v);
                                    }}
                                    className="w-14 bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-blue-400 text-right focus:border-blue-400 outline-none"
                                />
                                <span className="font-mono text-blue-400">s</span>
                            </div>
                        </div>
                        <Fader value={config.exhale} min={0} max={60} step={0.5} onChange={(v:number) => update('exhale', v)} color="#60a5fa" uiConfig={uiConfig} />
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest w-12">Texture</span>
                            <div className="relative flex-1"><PhaseNoiseDropdown value={config.exhaleNoise || config.noiseType || 'BROWN'} onChange={(v) => update('exhaleNoise', v)} activeColorClass="text-blue-400" uiConfig={uiConfig}/></div>
                        </div>
                    </div>

                    <div className="space-y-1 pl-2 border-l-2 border-purple-500/20">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase">
                            <span>Wait (Nadir)</span>
                            <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="0" 
                                    max="60" 
                                    value={config.holdOut} 
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        if (!isNaN(v) && v >= 0) update('holdOut', v);
                                    }}
                                    className="w-14 bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-purple-400 text-right focus:border-purple-400 outline-none"
                                />
                                <span className="font-mono text-purple-400">s</span>
                            </div>
                        </div>
                        <Fader value={config.holdOut} min={0} max={60} step={0.5} onChange={(v:number) => update('holdOut', v)} color="#c084fc" uiConfig={uiConfig} />
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest w-12">Texture</span>
                            <div className="relative flex-1"><PhaseNoiseDropdown value={config.holdOutNoise || 'CAVE'} onChange={(v) => update('holdOutNoise', v)} activeColorClass="text-purple-400" uiConfig={uiConfig}/></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/5 mt-3">
                    <span className="text-[9px] text-slate-500 uppercase">Geometry</span>
                    <div className="relative flex-1">
                        <select value={config.visualMode} onChange={(e) => update('visualMode', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[9px] appearance-none focus:outline-none focus:border-cyan-500" style={{ color: uiConfig.textColor }}>
                            {VISUALS.map(v => <option key={v} value={v} className="bg-slate-950 text-slate-200">{v}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="p-3 rounded border border-pink-500/20 bg-pink-950/10 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400 flex items-center gap-2">
                        <Heart size={12} /> Sentic Emotion Overlay
                    </span>
                    <button onClick={() => update('isSenticPacing', !config.isSenticPacing)} className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-colors ${config.isSenticPacing ? 'bg-pink-500' : 'bg-slate-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${config.isSenticPacing ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
                
                <p className="text-[8px] text-slate-500 leading-snug">Warp the physical breath visualizer to the chosen bio-form. Optionally applies psychological sensory shivers across the breath cycle.</p>

                {config.isSenticPacing && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 pt-2 border-t border-pink-500/20">
                        <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Target Emotion Form</span>
                            <div className="relative">
                                <select value={activeSenticKey} onChange={(e) => update('senticState', e.target.value)} className="w-full bg-black/60 border border-pink-500/30 rounded px-3 py-2 text-[10px] appearance-none focus:outline-none focus:border-pink-400 font-bold uppercase tracking-widest transition-colors cursor-pointer text-pink-300">
                                    <option value="NO_EMOTION">No Emotion (Off)</option>
                                    <option value="ANGER">Anger</option>
                                    <option value="HATE">Hate</option>
                                    <option value="GRIEF">Grief</option>
                                    <option value="LOVE">Love</option>
                                    <option value="SEX">Sex (Eros)</option>
                                    <option value="JOY">Joy</option>
                                    <option value="REVERENCE">Reverence</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-pink-500/50"/>
                            </div>
                        </div>

                        <div className="bg-black/40 border border-white/5 rounded p-3 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500/50" />
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Waves size={8} className="text-pink-500/70"/> Overlay Form Curve</span>
                            <span className="text-xs text-slate-200 font-medium leading-snug tracking-wide">
                                "{senticData.directive}"
                            </span>
                        </div>

                        <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[9px] text-slate-400 uppercase"><span>Sentic Intensity</span><span className="font-mono text-pink-400">{((config.senticVibratoDepth ?? 0.5) * 100).toFixed(0)}%</span></div>
                            <Fader value={config.senticVibratoDepth ?? 0.5} min={0} max={1} step={0.05} onChange={(v:number) => update('senticVibratoDepth', v)} color="#f472b6" uiConfig={uiConfig} />
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Sensory Routing</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => update('isSenticVisual', config.isSenticVisual === false ? true : false)} className={`flex items-center gap-2 px-2 py-1.5 rounded border text-[8px] font-bold uppercase transition-colors ${config.isSenticVisual !== false ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-black/40 text-slate-500 border-white/10 hover:border-pink-500/30'}`}>
                                    <Eye size={10} /> Visual Shiver
                                </button>
                                <button onClick={() => update('isSenticTideAM', config.isSenticTideAM === false ? true : false)} className={`flex items-center gap-2 px-2 py-1.5 rounded border text-[8px] font-bold uppercase transition-colors ${config.isSenticTideAM !== false ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-black/40 text-slate-500 border-white/10 hover:border-pink-500/30'}`}>
                                    <VolumeX size={10} /> Tide Tremolo
                                </button>
                                <button onClick={() => update('isSenticTideFM', config.isSenticTideFM === false ? true : false)} className={`flex items-center gap-2 px-2 py-1.5 rounded border text-[8px] font-bold uppercase transition-colors ${config.isSenticTideFM !== false ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-black/40 text-slate-500 border-white/10 hover:border-pink-500/30'}`}>
                                    <Wind size={10} /> Timbral Howl
                                </button>
                                <button onClick={() => update('isSenticSoloist', config.isSenticSoloist === false ? true : false)} className={`flex items-center gap-2 px-2 py-1.5 rounded border text-[8px] font-bold uppercase transition-colors ${config.isSenticSoloist !== false ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-black/40 text-slate-500 border-white/10 hover:border-pink-500/30'}`}>
                                    <Bell size={10} /> Bell Vibrato
                                </button>
                                <button onClick={() => update('isSenticHaptics', config.isSenticHaptics === false ? true : false)} className={`col-span-2 flex justify-center items-center gap-2 px-2 py-1.5 rounded border text-[8px] font-bold uppercase transition-colors ${config.isSenticHaptics !== false ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-black/40 text-slate-500 border-white/10 hover:border-pink-500/30'}`}>
                                    <Smartphone size={10} /> Device Haptics
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Breath & Tide Sound Engine */}
            <div className="p-3 rounded border border-cyan-500/20 bg-cyan-950/10 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                        <Wind size={12} /> Breath & Tide Sound
                    </span>
                    <span className="text-[8px] font-mono text-cyan-400 font-bold">
                        {Math.round((config.oceanVol ?? 0.5) * 100)}%
                    </span>
                </div>

                {/* Tide Sound Texture Selector */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] text-slate-400 uppercase tracking-wider font-bold">
                        <span>Acoustic Profile</span>
                        <span className="text-cyan-300 font-mono">{config.noiseType || 'OCEAN'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {[
                            { id: 'OCEAN', label: 'Ocean Tide' },
                            { id: 'WIND', label: 'Wind Breeze' },
                            { id: 'PINK', label: 'Pink Noise' },
                            { id: 'BROWN', label: 'Brown Noise' },
                            { id: 'RAIN', label: 'Rain Cascade' },
                            { id: 'STREAM', label: 'Forest Stream' },
                            { id: 'WHITE', label: 'White Noise' },
                            { id: 'FOREST', label: 'Night Forest' },
                            { id: 'CAVE', label: 'Deep Cave' }
                        ].map(t => {
                            const isSelected = (config.noiseType || 'OCEAN') === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => update('noiseType', t.id)}
                                    className={`py-1 px-1.5 rounded text-[8px] font-bold border transition-all text-center truncate ${
                                        isSelected
                                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60 shadow-xs'
                                            : 'bg-white/5 text-slate-400 hover:text-white border-transparent hover:bg-white/10'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tide Volume Fader */}
                <div className="space-y-1 pt-1 border-t border-white/5">
                    <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Tide Level</span>
                    </div>
                    <Fader value={config.oceanVol} min={0} max={1} step={0.05} onChange={(v:number) => update('oceanVol', v)} color="#22d3ee" uiConfig={uiConfig} />
                </div>
            </div>

            <div className="p-3 rounded border border-amber-500/20 bg-amber-950/10 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2"><Bell size={12} /> Turnaround Bell & Cue Tones</span>
                    <div className="relative w-32">
                        <select value={config.toneType} onChange={(e) => update('toneType', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[9px] appearance-none focus:outline-none focus:border-amber-500 font-bold" style={{ color: uiConfig.textColor }}>
                            {TONES.map(t => <option key={t} value={t} className="bg-slate-950 text-slate-200">{t.replace('_', ' ')}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: uiConfig.textColor }}/>
                    </div>
                </div>
                
                {config.toneType !== 'NONE' && (
                    <div className="space-y-3 pt-1 animate-in slide-in-from-top-1">
                        {/* Music Mode Chord Root Auto-Sync */}
                        <div className="flex items-center justify-between p-2 rounded bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center gap-2">
                                <Music size={12} className={config.syncTurnaroundToChordRoot ? "text-amber-400" : "text-slate-400"} />
                                <div>
                                    <div className="text-[9px] font-bold text-slate-200">Sync to Chord Root</div>
                                    <div className="text-[7.5px] text-slate-400">Auto-tunes turnaround bell to active chord root in Music Mode</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => update('syncTurnaroundToChordRoot', !config.syncTurnaroundToChordRoot)}
                                className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-colors border ${
                                    config.syncTurnaroundToChordRoot
                                        ? 'bg-amber-500/30 text-amber-300 border-amber-500/60 shadow-xs'
                                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                                }`}
                            >
                                {config.syncTurnaroundToChordRoot ? 'AUTO-SYNC' : 'MANUAL'}
                            </button>
                        </div>

                        {/* Key Root Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 uppercase tracking-wide w-20">Key Root</span>
                            <div className="relative flex-1">
                                <select value={config.cueBase || 'SCHUMANN'} onChange={(e) => update('cueBase', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[9px] appearance-none focus:outline-none focus:border-amber-500 font-mono" style={{ color: uiConfig.textColor }}>
                                    <optgroup label="Musical Keys">{MUSICAL_KEYS.map(k => <option key={k} value={k} className="bg-slate-950 text-slate-200">{k} Major</option>)}</optgroup>
                                    <optgroup label="Planetary Constants">{SCIENTIFIC_KEYS.map(k => <option key={k} value={k} className="bg-slate-950 text-slate-200">{k}</option>)}</optgroup>
                                </select>
                                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: uiConfig.textColor }}/>
                            </div>
                        </div>

                        {/* Frequency & Harmonic Multiplier */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                                <span>Harmonic Pitch</span>
                                <span className="font-mono text-amber-300 font-bold">{approxFreq.toFixed(0)} Hz</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] text-slate-600 font-mono">LO</span>
                                <input type="range" min="1" max="32" step="1" value={config.cueHarmonic || 16} onChange={(e) => update('cueHarmonic', parseInt(e.target.value))} className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"/>
                                <span className="text-[8px] text-slate-600 font-mono">HI</span>
                            </div>
                        </div>

                        {/* Bell Decay / Ring Time */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                                <span>Bell Ring / Decay</span>
                                <span className="font-mono text-amber-300 font-bold">{(config.cueDecay ?? 2.5).toFixed(1)}s</span>
                            </div>
                            <Fader value={config.cueDecay ?? 2.5} min={0.4} max={8.0} step={0.1} onChange={(v:number) => update('cueDecay', v)} color="#f59e0b" uiConfig={uiConfig} />
                        </div>

                        {/* Turnaround Phase Gating */}
                        <div className="space-y-1 pt-1 border-t border-white/5">
                            <div className="flex justify-between items-center text-[9px] text-slate-400 mb-1">
                                <span>Turnaround Chime Phases</span>
                            </div>
                            <div className="flex gap-1">
                                {[
                                    { id: 'inhale', label: 'Inhale Start' },
                                    { id: 'holdIn', label: 'Inhale Turn (Apex)' },
                                    { id: 'exhale', label: 'Exhale Start' },
                                    { id: 'holdOut', label: 'Exhale Turn (Nadir)' }
                                ].map((p) => {
                                    const mask = config.cuePhaseMask || { inhale: true, exhale: true, holdIn: false, holdOut: false };
                                    const isActive = (mask as any)[p.id] ?? (p.id === 'inhale' || p.id === 'exhale');
                                    return (
                                        <button 
                                            key={p.id} 
                                            onClick={() => {
                                                const currentMask = config.cuePhaseMask || { inhale: true, exhale: true, holdIn: false, holdOut: false };
                                                update('cuePhaseMask', { ...currentMask, [p.id]: !isActive });
                                            }} 
                                            className={`flex-1 py-1 rounded text-[7px] font-bold uppercase border transition-all ${isActive ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30' : 'bg-slate-900 text-slate-600 border-slate-800 hover:border-slate-600'}`}
                                        >
                                            {p.id.replace('holdIn', 'Apex').replace('holdOut', 'Nadir').replace('inhale', 'In').replace('exhale', 'Out')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Bell Volume & Preview Test */}
                        <div className="flex gap-2 items-center border-t border-white/5 pt-2">
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between text-[9px] text-slate-400">
                                    <span>Bell Volume</span>
                                    <span className="font-mono text-amber-300">{Math.round((config.cueVolume ?? 0.5) * 100)}%</span>
                                </div>
                                <Fader value={config.cueVolume ?? 0.5} min={0} max={1} step={0.05} onChange={(v:number) => update('cueVolume', v)} color="#fbbf24" uiConfig={uiConfig} />
                            </div>
                            <button onClick={() => onPreview(config, binauralFreqs, bpm)} className="px-3 py-2 bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[9px] font-bold rounded hover:bg-amber-500/30 transition-colors uppercase flex items-center gap-1 shrink-0 mt-3"><Music size={10} /> Audition</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};