import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    X, Sparkles, Play, Square, ChevronRight, ChevronLeft, 
    Check,
    Waves, Sliders, ShieldCheck, Wind, Volume2, Shuffle, Activity,
    SlidersHorizontal, Music
} from 'lucide-react';
import { 
    MOOD_CATEGORIES, 
    MusicalMood, 
    ChordDef, 
    ProgressionDef,
    getChordFrequencies,
    ChordGlideConfig,
    DEFAULT_CHORD_GLIDE_CONFIG,
    CHORD_GLIDE_PRESETS,
    VoiceLeadingMode,
    VoicingStyle,
    getAllMoodCategories,
    loadCustomProgressions
} from '../../services/audio/chordProgressions';
import { TuningTemperament, TEMPERAMENTS } from './visuals/shared';
import { ProgressionDesigner } from './ProgressionDesigner';
import { BreathConfig } from '../../services/audio/AudioTypes';
import { HarmonicVisualizer } from './HarmonicVisualizer';
import { MasterTransportControls, MasterTransportStatus } from './tuner/MasterTransportControls';

interface MusicalProgressionModalProps {
    isOpen: boolean;
    onClose: () => void;
    isProgressionActive: boolean;
    onToggleProgression: () => void;
    masterStatus?: MasterTransportStatus;
    onMasterPlayPause?: () => void;
    onMasterStop?: () => void;
    onMasterClear?: () => void;
    activeMood: MusicalMood;
    onSelectMood: (mood: MusicalMood) => void;
    activeProgressionId: string;
    onSelectProgression: (progId: string) => void;
    currentChordIndex: number;
    onAdvanceChord: (dir: 1 | -1) => void;
    advanceMode: 'BREATH_CYCLE' | 'BREATH_PHASE' | 'BREATH_EXHALE' | 'MANUAL';
    onAdvanceModeChange: (mode: 'BREATH_CYCLE' | 'BREATH_PHASE' | 'BREATH_EXHALE' | 'MANUAL') => void;
    pitch: number;
    temperament: TuningTemperament;
    octaveShift: number;
    onPitchChange: (pitch: number) => void;
    onTemperamentChange: (t: TuningTemperament) => void;
    onOpenArchitect?: () => void;
    onPlaySingleChord?: (chord: ChordDef) => void;
    onSelectChordIndex?: (index: number) => void;
    chordGlideConfig?: ChordGlideConfig;
    onChordGlideConfigChange?: (updates: Partial<ChordGlideConfig>) => void;
    customProgressions?: ProgressionDef[];
    onSaveAndActivateProgression?: (prog: ProgressionDef) => void;
    onCustomProgressionsChange?: () => void;
    breathConfig?: BreathConfig;
    isBreathActive?: boolean;
    onToggleBreathPacer?: () => void;
}

export const MusicalProgressionModal: React.FC<MusicalProgressionModalProps> = ({
    isOpen,
    onClose,
    isProgressionActive,
    onToggleProgression,
    masterStatus,
    onMasterPlayPause,
    onMasterStop,
    onMasterClear,
    activeMood,
    onSelectMood,
    activeProgressionId,
    onSelectProgression,
    currentChordIndex,
    onAdvanceChord,
    advanceMode,
    onAdvanceModeChange,
    pitch,
    temperament,
    octaveShift,
    onPitchChange,
    onTemperamentChange,
    onOpenArchitect,
    onPlaySingleChord,
    onSelectChordIndex,
    chordGlideConfig,
    onChordGlideConfigChange,
    customProgressions: propCustomProgressions,
    onSaveAndActivateProgression,
    onCustomProgressionsChange,
    breathConfig,
    isBreathActive,
    onToggleBreathPacer
}) => {
    const [selectedTab, setSelectedTab] = useState<'EXPLORE' | 'CHORDS' | 'TEMPERAMENT_SYNC' | 'DESIGNER'>('EXPLORE');
    const [isGliding, setIsGliding] = useState(false);
    const [isCustomPitchOpen, setIsCustomPitchOpen] = useState(false);
    const [localCustomProgressions, setLocalCustomProgressions] = useState<ProgressionDef[]>([]);
    const prevChordIndexRef = useRef(currentChordIndex);

    const getProgressionDisplayName = (name: string): string => {
        if (!name) return '';
        const idx = name.indexOf('(');
        if (idx !== -1) {
            return name.slice(0, idx).trim();
        }
        return name.trim();
    };

    const glide = chordGlideConfig || DEFAULT_CHORD_GLIDE_CONFIG;

    // Breath metrics for live calculation
    const inhale = breathConfig?.inhale !== undefined ? Number(breathConfig.inhale) : 4;
    const exhale = breathConfig?.exhale !== undefined ? Number(breathConfig.exhale) : 6;
    const holdIn = breathConfig?.holdIn !== undefined ? Number(breathConfig.holdIn) : 0;
    const holdOut = breathConfig?.holdOut !== undefined ? Number(breathConfig.holdOut) : 0;
    const fullCycle = inhale + holdIn + exhale + holdOut;
    const multiplier = glide.breathSyncMultiplier ?? 1.0;

    // Keep custom progressions in sync
    useEffect(() => {
        setLocalCustomProgressions(loadCustomProgressions());
    }, [isOpen, propCustomProgressions]);

    const handleCustomChange = () => {
        setLocalCustomProgressions(loadCustomProgressions());
        onCustomProgressionsChange?.();
    };

    const effectiveCustomProgressions = propCustomProgressions || localCustomProgressions;
    const moodCategoriesWithCustom = useMemo(() => {
        return getAllMoodCategories(effectiveCustomProgressions);
    }, [effectiveCustomProgressions]);

    useEffect(() => {
        if (prevChordIndexRef.current !== currentChordIndex) {
            prevChordIndexRef.current = currentChordIndex;
            if (glide.enabled) {
                let duration = glide.time;
                if (glide.syncToBreath) {
                    const inhaleTime = Math.max(0.2, inhale);
                    const exhaleTime = Math.max(0.2, exhale);
                    const mult = glide.breathSyncMultiplier ?? 1.0;
                    if (glide.breathSyncTarget === 'EXHALE') duration = exhaleTime * mult;
                    else if (glide.breathSyncTarget === 'CYCLE') duration = fullCycle * mult;
                    else duration = inhaleTime * mult;
                }
                if (duration > 0.04) {
                    const startTimer = setTimeout(() => {
                        setIsGliding(true);
                    }, 0);
                    const endTimer = setTimeout(() => {
                        setIsGliding(false);
                    }, Math.min(duration * 1000, 10000));
                    return () => {
                        clearTimeout(startTimer);
                        clearTimeout(endTimer);
                    };
                }
            }
        }
    }, [currentChordIndex, glide.enabled, glide.time, glide.syncToBreath, glide.breathSyncTarget, glide.breathSyncMultiplier, inhale, exhale, fullCycle]);

    if (!isOpen) return null;

    const currentMoodCategory = moodCategoriesWithCustom.find(m => m.mood === activeMood) || moodCategoriesWithCustom[0];
    const currentProgression = currentMoodCategory.progressions.find(p => p.id === activeProgressionId) 
        || currentMoodCategory.progressions[0] 
        || moodCategoriesWithCustom[0].progressions[0];

    const currentChord = currentProgression.chords[currentChordIndex % currentProgression.chords.length];
    const resolvedCurrentChord = currentChord ? getChordFrequencies(currentChord, pitch, temperament, octaveShift, {
        adaptiveJustIntonation: glide.adaptiveJustIntonation,
        voicingStyle: glide.voicingStyle,
        lowIntervalLimit: glide.lowIntervalLimit,
        abComparisonMode: glide.abComparisonMode
    }) : null;

    return (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-1.5 sm:p-6 animate-in fade-in duration-200 pointer-events-auto">
            <div className="w-full max-w-3xl bg-slate-950 border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[85vh]">
                
                {/* Header (Responsive, auto-fitting height with smooth horizontal scrolling for tuning controls) */}
                <div className="px-3 sm:px-5 py-2 sm:py-2.5 border-b border-white/10 bg-slate-900/95 shrink-0 flex flex-col gap-1.5 sm:gap-2">
                    {/* Top Row: Title + Primary Actions */}
                    <div className="flex items-center justify-between gap-2 h-7 sm:h-8 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1 sm:p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                                <Sparkles size={15} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-bold tracking-wide text-white uppercase truncate flex items-center gap-1.5">
                                    <span>Musical Mode</span>
                                    <span className="hidden sm:inline text-slate-500 font-normal">|</span>
                                    <span className="hidden sm:inline text-slate-300 font-medium">Harmonic Moods & Engine</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <MasterTransportControls
                                status={masterStatus ?? (isProgressionActive ? 'PLAYING' : 'IDLE')}
                                onPlayPause={() => {
                                    if (masterStatus === 'IDLE' && !isProgressionActive) {
                                        onToggleProgression();
                                    } else if (onMasterPlayPause) {
                                        onMasterPlayPause();
                                    } else {
                                        onToggleProgression();
                                    }
                                }}
                                onStop={() => {
                                    if (onMasterStop) onMasterStop();
                                    else if (isProgressionActive) onToggleProgression();
                                }}
                                onClear={() => {
                                    if (onMasterClear) onMasterClear();
                                    else if (isProgressionActive) onToggleProgression();
                                }}
                                variant="modal"
                            />

                            <button 
                                onClick={onClose}
                                className="p-1 sm:p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
                                title="Close modal"
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Metadata Section: Clean single-line info & horizontal tuning strip */}
                    <div className="flex flex-col gap-1 sm:gap-1.5 pt-1 border-t border-white/10 shrink-0">
                        {/* Row 2: Mood & Progression Name */}
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono whitespace-nowrap overflow-hidden shrink-0 min-w-0">
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="text-slate-400 uppercase text-[8.5px] sm:text-[9.5px] tracking-wider font-semibold">Mood:</span>
                                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold text-[9.5px] sm:text-[11px] truncate max-w-[110px] sm:max-w-[190px]">
                                    {currentMoodCategory.label}
                                </span>
                            </div>

                            <span className="text-slate-600 shrink-0">·</span>

                            <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                                <span className="text-slate-400 uppercase text-[8.5px] sm:text-[9.5px] tracking-wider font-semibold shrink-0">Prog:</span>
                                <span 
                                    className="px-1.5 sm:px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold text-[9.5px] sm:text-[11px] truncate min-w-0 flex-1"
                                    title={currentProgression.name}
                                >
                                    {getProgressionDisplayName(currentProgression.name)}
                                </span>
                            </div>
                        </div>

                        {/* Row 3: Interactive Tuning Controls & Frequency Glide Status (Single horizontal scroll strip on mobile to prevent wrapping overlap) */}
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-mono text-slate-300 shrink-0 pt-0.5 overflow-x-auto no-scrollbar whitespace-nowrap">
                            {/* Concert Pitch Selector */}
                            <div className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded border border-white/15 shrink-0">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Pitch:</span>
                                <select
                                    value={[432, 440, 444, 415, 430.54, 442].some(hz => Math.abs(pitch - hz) < 0.05) ? pitch.toString() : 'CUSTOM'}
                                    onChange={(e) => {
                                        if (e.target.value === 'CUSTOM') {
                                            setIsCustomPitchOpen(true);
                                        } else {
                                            setIsCustomPitchOpen(false);
                                            onPitchChange(parseFloat(e.target.value));
                                        }
                                    }}
                                    className="bg-transparent text-cyan-300 font-bold text-[9px] focus:outline-none cursor-pointer"
                                    title="Concert Pitch Reference (A4 Frequency)"
                                >
                                    <option value="432" className="bg-slate-950 text-white">432.0 Hz · Verdi</option>
                                    <option value="440" className="bg-slate-950 text-white">440.0 Hz · Standard</option>
                                    <option value="444" className="bg-slate-950 text-white">444.0 Hz · Solfeggio 528</option>
                                    <option value="415" className="bg-slate-950 text-white">415.0 Hz · Baroque</option>
                                    <option value="430.54" className="bg-slate-950 text-white">430.54 Hz · C=256</option>
                                    <option value="442" className="bg-slate-950 text-white">442.0 Hz · Orchestra</option>
                                    <option value="CUSTOM" className="bg-slate-950 text-amber-400">Custom Pitch...</option>
                                </select>

                                {(![432, 440, 444, 415, 430.54, 442].some(hz => Math.abs(pitch - hz) < 0.05) || isCustomPitchOpen) && (
                                    <div className="flex items-center gap-0.5 ml-1 border-l border-white/20 pl-1">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="380"
                                            max="480"
                                            value={pitch}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val) && val >= 380 && val <= 480) onPitchChange(val);
                                            }}
                                            className="w-11 bg-black/80 text-cyan-300 font-bold px-1 rounded text-right focus:outline-none text-[9px]"
                                            placeholder="Hz"
                                        />
                                        <span className="text-[7.5px] text-slate-400">Hz</span>
                                    </div>
                                )}
                            </div>

                            {/* Temperament Selector */}
                            <div className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded border border-white/15 shrink-0">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Tuning:</span>
                                <select
                                    value={temperament}
                                    onChange={(e) => onTemperamentChange(e.target.value as TuningTemperament)}
                                    className="bg-transparent text-emerald-300 font-bold text-[9px] focus:outline-none cursor-pointer max-w-[115px] sm:max-w-[165px] truncate"
                                    title="Tuning Temperament"
                                >
                                    {TEMPERAMENTS.map(t => (
                                        <option key={t.id} value={t.id} className="bg-slate-950 text-white">
                                            {t.shortName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Architect Button */}
                            {onOpenArchitect && (
                                <button
                                    type="button"
                                    onClick={onOpenArchitect}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-colors font-bold uppercase text-[8px] tracking-wider shrink-0"
                                    title="Open Full Tuning & Temperament Architect"
                                >
                                    <SlidersHorizontal size={10} />
                                    <span>Architect</span>
                                </button>
                            )}

                            {glide.enabled && (
                                <span 
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border transition-colors shrink-0 ${
                                        isGliding 
                                            ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]' 
                                            : 'bg-white/5 text-slate-400 border-white/10'
                                    }`}
                                    title={glide.syncToBreath ? `Breath Synchronized Glide: ${(inhale * multiplier).toFixed(1)}s Inhale / ${(exhale * multiplier).toFixed(1)}s Exhale` : `Frequency glide: ${Math.round(glide.time * 1000)}ms`}
                                >
                                    {glide.syncToBreath ? (
                                        <Wind size={11} className={isGliding ? 'text-cyan-400 animate-pulse shrink-0' : 'text-slate-500 shrink-0'} />
                                    ) : (
                                        <Waves size={11} className={isGliding ? 'text-cyan-400 animate-spin shrink-0' : 'text-slate-500 shrink-0'} />
                                    )}
                                    <span>
                                        {glide.syncToBreath 
                                            ? `Breath Sync (${(inhale * multiplier).toFixed(1)}s/${(exhale * multiplier).toFixed(1)}s)` 
                                            : `Glide ${Math.round(glide.time * 1000)}ms`
                                        }
                                    </span>
                                    {isGliding && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sub-Header / Responsive Tabs: 4-Column Grid on Mobile with concise non-wrapping labels */}
                <div className="border-b border-white/10 bg-black/50 px-1 sm:px-4 pt-1 sm:pt-2 shrink-0">
                    <div className="grid grid-cols-4 sm:flex sm:gap-2 w-full">
                        <button
                            onClick={() => setSelectedTab('EXPLORE')}
                            className={`pb-2 pt-1 px-1 sm:px-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 text-center flex items-center justify-center whitespace-nowrap min-w-0 ${
                                selectedTab === 'EXPLORE' 
                                    ? 'border-amber-400 text-amber-300' 
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span className="sm:hidden">1. Moods</span>
                            <span className="hidden sm:inline">1. Moods & Library</span>
                        </button>
                        <button
                            onClick={() => setSelectedTab('CHORDS')}
                            className={`pb-2 pt-1 px-1 sm:px-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 text-center flex items-center justify-center whitespace-nowrap min-w-0 ${
                                selectedTab === 'CHORDS' 
                                    ? 'border-amber-400 text-amber-300' 
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span className="sm:hidden">2. Chords</span>
                            <span className="hidden sm:inline">2. Active Chords ({currentProgression.chords.length})</span>
                        </button>
                        <button
                            onClick={() => setSelectedTab('TEMPERAMENT_SYNC')}
                            className={`pb-2 pt-1 px-1 sm:px-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 text-center flex items-center justify-center gap-1 whitespace-nowrap min-w-0 ${
                                selectedTab === 'TEMPERAMENT_SYNC' 
                                    ? 'border-amber-400 text-amber-300' 
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span className="sm:hidden">3. Tuning</span>
                            <span className="hidden sm:inline">3. Breath Sync & Tuning</span>
                            {glide.enabled && (
                                <span className="hidden sm:inline-block px-1 py-0.2 text-[8px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
                                    {glide.syncToBreath ? 'Breath Sync' : `${Math.round(glide.time * 1000)}ms`}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setSelectedTab('DESIGNER')}
                            className={`pb-2 pt-1 px-1 sm:px-3 text-[9px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 text-center flex items-center justify-center gap-1 whitespace-nowrap min-w-0 ${
                                selectedTab === 'DESIGNER' 
                                    ? 'border-amber-400 text-amber-300' 
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Sparkles size={11} className="text-amber-400 shrink-0 hidden sm:inline" />
                            <span className="sm:hidden">4. Design</span>
                            <span className="hidden sm:inline">4. Progression Designer</span>
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    
                    {/* TAB 1: EXPLORE MOODS & PROGRESSIONS */}
                    {selectedTab === 'EXPLORE' && (
                        <div className="space-y-4">
                            {/* Mood Chips */}
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Select Emotion / Mood Atmosphere
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {moodCategoriesWithCustom.map(category => {
                                        const isSelected = category.mood === activeMood;
                                        return (
                                            <button
                                                key={category.mood}
                                                onClick={() => {
                                                    onSelectMood(category.mood);
                                                    if (category.progressions.length > 0) {
                                                        onSelectProgression(category.progressions[0].id);
                                                    }
                                                }}
                                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                                    isSelected 
                                                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
                                                        : 'bg-black/30 border-white/10 hover:border-white/20 text-slate-300 hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold leading-snug line-clamp-2">{category.label}</span>
                                                    {isSelected && <Check size={12} className="text-amber-400 shrink-0" />}
                                                </div>
                                                <div className="text-[8px] text-slate-400 line-clamp-2 leading-tight">
                                                    {category.description}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Progressions in Current Mood */}
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-2">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Progressions in {currentMoodCategory.label} ({currentMoodCategory.progressions.length})
                                    </div>
                                    <button
                                        onClick={() => setSelectedTab('DESIGNER')}
                                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1 transition-all"
                                    >
                                        <Sparkles size={11} />
                                        <span>Create / Design Progression</span>
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {currentMoodCategory.progressions.map(prog => {
                                        const isSelected = prog.id === activeProgressionId;
                                        return (
                                            <div
                                                key={prog.id}
                                                onClick={() => onSelectProgression(prog.id)}
                                                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                    isSelected 
                                                        ? 'bg-slate-900 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                                                        : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                                                }`}
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                                                            {prog.name}
                                                        </span>
                                                        {prog.isCustom && (
                                                            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-bold uppercase rounded">
                                                                Custom
                                                            </span>
                                                        )}
                                                        {isSelected && (
                                                            <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[8px] font-bold uppercase rounded">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] text-slate-400">
                                                        {prog.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <span className="text-[8px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                                            Preferred Tuning: {TEMPERAMENTS.find(t => t.id === prog.recommendedTemperament)?.shortName || prog.recommendedTemperament}
                                                        </span>
                                                        <span className="text-[8px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                                                            Pitch: {prog.recommendedPitch} Hz
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 sm:gap-1.5 shrink-0 max-w-full sm:max-w-[340px] py-1 overflow-x-auto">
                                                    {prog.chords.map((chord, idx) => (
                                                        <button 
                                                            key={idx}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onPlaySingleChord) {
                                                                    onPlaySingleChord(chord);
                                                                }
                                                            }}
                                                            className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/5 hover:bg-amber-500/20 hover:border-amber-400/50 border border-white/10 rounded font-mono text-[10px] sm:text-xs font-bold text-slate-200 hover:text-amber-300 shadow-sm whitespace-nowrap transition-all flex items-center gap-1 group/btn"
                                                            title={`Click to audition ${chord.name}`}
                                                        >
                                                            <Play size={8} className="opacity-40 group-hover/btn:opacity-100 fill-current text-amber-400 shrink-0" />
                                                            <span>{chord.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: ACTIVE CHORDS & VOICINGS */}
                    {selectedTab === 'CHORDS' && (
                        <div className="space-y-4">
                            {/* Interactive Step Navigator */}
                            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate">
                                            Live Chord Stepper
                                        </div>
                                        <button
                                            onClick={() => onChordGlideConfigChange?.({ enabled: !glide.enabled })}
                                            className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border transition-all flex items-center gap-1 shrink-0 ${
                                                glide.enabled 
                                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                                                    : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                                            }`}
                                            title="Toggle Portamento / Frequency Glide"
                                        >
                                            <Waves size={10} />
                                            <span>Glide: {glide.enabled ? `${Math.round(glide.time * 1000)}ms` : 'Off'}</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                        <button
                                            onClick={() => onAdvanceChord(-1)}
                                            className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10"
                                            title="Previous Chord"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span className="text-xs font-mono font-bold text-amber-400">
                                            Step {(currentChordIndex % currentProgression.chords.length) + 1} / {currentProgression.chords.length}
                                        </span>
                                        <button
                                            onClick={() => onAdvanceChord(1)}
                                            className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10"
                                            title="Next Chord"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                                    {currentProgression.chords.map((chord, idx) => {
                                        const isCurrent = (currentChordIndex % currentProgression.chords.length) === idx;
                                        const chordData = getChordFrequencies(chord, pitch, temperament, octaveShift, {
                                            adaptiveJustIntonation: glide.adaptiveJustIntonation,
                                            voicingStyle: glide.voicingStyle,
                                            lowIntervalLimit: glide.lowIntervalLimit,
                                            abComparisonMode: glide.abComparisonMode
                                        });
                                        const isChordGliding = isCurrent && isGliding && glide.enabled;
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    if (onSelectChordIndex) {
                                                        onSelectChordIndex(idx);
                                                    } else {
                                                        const stepDiff = idx - (currentChordIndex % currentProgression.chords.length);
                                                        if (stepDiff !== 0) {
                                                            onAdvanceChord(stepDiff);
                                                        }
                                                        if (onPlaySingleChord) onPlaySingleChord(chord);
                                                    }
                                                }}
                                                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer overflow-hidden group ${
                                                    isChordGliding
                                                        ? 'bg-gradient-to-b from-cyan-950/90 via-slate-900 to-amber-950/40 border-cyan-400 text-white shadow-[0_0_22px_rgba(6,182,212,0.45)] scale-[1.02]'
                                                        : isCurrent 
                                                            ? 'bg-amber-500/25 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[1.01]' 
                                                            : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                {/* Top Row: State Badge + Audition Button (Flexbox to eliminate collision) */}
                                                <div className="flex items-center justify-between gap-1 mb-1 min-h-[18px]">
                                                    {isChordGliding ? (
                                                        <div className="flex items-center gap-1 text-[7.5px] font-mono font-bold text-cyan-300 bg-cyan-950/90 border border-cyan-400/60 rounded px-1.5 py-0.5 animate-pulse shadow-sm truncate">
                                                            <Waves size={8} className="animate-spin shrink-0" />
                                                            <span className="truncate">Gliding</span>
                                                        </div>
                                                    ) : isCurrent ? (
                                                        <div className="flex items-center gap-1 text-[7.5px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 rounded px-1.5 py-0.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                                                            <span>Sounding</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[7.5px] sm:text-[8px] font-mono text-slate-500">Step {idx + 1}</span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onPlaySingleChord) onPlaySingleChord(chord);
                                                        }}
                                                        className="p-1 rounded-md bg-white/10 hover:bg-amber-500/30 text-slate-300 hover:text-amber-300 transition-all shrink-0"
                                                        title={`Audition ${chord.name}`}
                                                    >
                                                        <Play size={8} className="fill-current" />
                                                    </button>
                                                </div>

                                                <div className="text-sm sm:text-base font-extrabold font-mono text-amber-300 mb-0.5 sm:mb-1">
                                                    {chord.name}
                                                </div>
                                                <div className="text-[8px] sm:text-[9px] font-mono text-slate-400 truncate">
                                                    {chordData.notes.map(n => n.note).join(' - ')}
                                                </div>
                                                <div className="text-[7.5px] sm:text-[8px] font-mono text-cyan-400 mt-0.5 sm:mt-1 truncate">
                                                    {chordData.notes.map(n => Math.round(n.freq)).join(' · ')} Hz
                                                </div>

                                                {/* Bottom Sweep Shimmer Line during Glide */}
                                                {isChordGliding && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400 animate-pulse" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Active Chord Harmonic Detail */}
                            {resolvedCurrentChord && (
                                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                            <span>Now Sounding Notes ({resolvedCurrentChord.name})</span>
                                            {isGliding && glide.enabled && (
                                                <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-400/40 flex items-center gap-1 animate-pulse">
                                                    <Waves size={9} className="animate-spin" />
                                                    Slewing Frequencies...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {resolvedCurrentChord.notes.map((n, i) => (
                                            <div 
                                                key={i} 
                                                className={`p-2.5 rounded-lg border text-center transition-all ${
                                                    isGliding && glide.enabled
                                                        ? 'bg-cyan-950/50 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                                                        : 'bg-slate-900/80 border-cyan-500/20'
                                                }`}
                                            >
                                                <div className="text-xs font-bold text-white font-mono flex items-center justify-center gap-1">
                                                    <span>{n.note}{n.octave}</span>
                                                    {isGliding && glide.enabled && (
                                                        <Waves size={10} className="text-cyan-400 animate-pulse" />
                                                    )}
                                                </div>
                                                <div className="text-[10px] font-mono text-cyan-300 flex items-center justify-center gap-1">
                                                    <span>{n.freq.toFixed(2)} Hz</span>
                                                    {isGliding && glide.enabled && (
                                                        <span className="text-[7.5px] text-cyan-400 uppercase font-sans">slew</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Real-time Harmonic Consonance & Acoustic Oscilloscope */}
                            <HarmonicVisualizer
                                chordInfo={resolvedCurrentChord}
                                isGliding={isGliding && glide.enabled}
                                abComparisonMode={glide.abComparisonMode}
                                onToggleAbComparison={() => onChordGlideConfigChange?.({ abComparisonMode: glide.abComparisonMode === '12TET' ? 'PRESET' : '12TET' })}
                                currentTemperamentName={TEMPERAMENTS.find(t => t.id === temperament)?.shortName || temperament}
                            />
                        </div>
                    )}

                    {/* TAB 3: BREATH PACER SYNCHRONIZATION, GLIDE & TUNING */}
                    {selectedTab === 'TEMPERAMENT_SYNC' && (
                        <div className="space-y-4">
                            {/* CONCERT PITCH & TEMPERAMENT ARCHITECT CARD */}
                            <div className="p-4 rounded-xl bg-slate-900/90 border border-white/15 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                            <Music size={16} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                                <span>Concert Pitch Reference & Tuning Temperament</span>
                                            </div>
                                            <div className="text-[9px] text-slate-400">
                                                Calibrate fundamental reference pitch (A4) and select acoustic harmonic temperament
                                            </div>
                                        </div>
                                    </div>

                                    {onOpenArchitect && (
                                        <button
                                            type="button"
                                            onClick={onOpenArchitect}
                                            className="px-3 py-1.5 rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all border flex items-center gap-1.5 shrink-0 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border-cyan-500/40 shadow-sm"
                                        >
                                            <SlidersHorizontal size={12} />
                                            <span>Full Tuning Architect</span>
                                        </button>
                                    )}
                                </div>

                                {/* Concert Pitch Presets & Slider */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                            <ShieldCheck size={12} className="text-emerald-400" />
                                            Concert Pitch (A4 Reference Frequency)
                                        </span>
                                        <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-cyan-500/30">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="380"
                                                max="480"
                                                value={pitch}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (!isNaN(val) && val >= 380 && val <= 480) onPitchChange(val);
                                                }}
                                                className="w-14 bg-transparent text-cyan-300 font-mono font-bold text-xs text-right focus:outline-none"
                                            />
                                            <span className="text-[9px] font-mono text-slate-400 font-bold">Hz</span>
                                        </div>
                                    </div>

                                    {/* Preset Pills */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                                        {[
                                            { label: '432 Hz', value: 432.0, tag: 'Verdi' },
                                            { label: '440 Hz', value: 440.0, tag: 'Standard' },
                                            { label: '444 Hz', value: 444.0, tag: 'Solfeggio' },
                                            { label: '415 Hz', value: 415.0, tag: 'Baroque' },
                                            { label: '430.54 Hz', value: 430.54, tag: 'C=256' },
                                            { label: '442 Hz', value: 442.0, tag: 'Orchestra' },
                                        ].map(preset => {
                                            const isSelected = Math.abs(pitch - preset.value) < 0.05;
                                            return (
                                                <button
                                                    key={preset.value}
                                                    type="button"
                                                    onClick={() => onPitchChange(preset.value)}
                                                    className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                                                        isSelected
                                                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                                                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                                    }`}
                                                >
                                                    <div className="text-[10px] font-mono leading-tight">{preset.label}</div>
                                                    <div className="text-[7.5px] uppercase tracking-wider text-slate-500">{preset.tag}</div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Continuous Pitch Slider */}
                                    <input
                                        type="range"
                                        min="380"
                                        max="480"
                                        step="0.1"
                                        value={pitch}
                                        onChange={(e) => onPitchChange(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none mt-1"
                                    />
                                </div>

                                {/* Temperament Selection Grid */}
                                <div className="space-y-2 pt-1 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                            Acoustic Temperament Selection ({TEMPERAMENTS.length} Systems)
                                        </span>
                                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                                            Active: {TEMPERAMENTS.find(t => t.id === temperament)?.name || temperament}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {TEMPERAMENTS.map(t => {
                                            const isSelected = temperament === t.id;
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => onTemperamentChange(t.id)}
                                                    className={`p-2.5 rounded-lg border text-left transition-all ${
                                                        isSelected
                                                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                                                            : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[10px] font-bold">{t.name}</span>
                                                        <span className="text-[8px] font-mono text-emerald-400 font-semibold">{t.shortName}</span>
                                                    </div>
                                                    <div className="text-[8px] text-slate-400 leading-tight">
                                                        {t.description}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* CHORD GLIDE & PORTAMENTO CARD */}
                            <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.08)] space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                                            <Waves size={16} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                                <span>Chord Portamento / Pitch Glide</span>
                                                {glide.enabled && (
                                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 animate-pulse">
                                                        ACTIVE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[9px] text-slate-400">
                                                Smooth voice-leading frequency sweeps between chord shifts without clicks or phase jumps
                                            </div>
                                        </div>
                                    </div>

                                    {/* Master Glide Toggle Button */}
                                    <button
                                        onClick={() => onChordGlideConfigChange?.({ enabled: !glide.enabled })}
                                        className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all border flex items-center gap-1.5 shrink-0 ${
                                            glide.enabled 
                                                ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                                                : 'bg-white/5 text-slate-300 hover:text-white border-white/15 hover:bg-white/10'
                                        }`}
                                    >
                                        <Waves size={12} className={glide.enabled ? 'stroke-[2.5]' : ''} />
                                        <span>{glide.enabled ? 'Glide Active (ON)' : 'Instant Shifts (OFF)'}</span>
                                    </button>
                                </div>

                                {glide.enabled && (
                                    <div className="space-y-3.5 pt-1">
                                        {/* Glide Timing Mode Selector: Manual vs Breath Sync */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg border shrink-0 transition-colors ${glide.syncToBreath ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                                                    {glide.syncToBreath ? <Wind size={15} className="animate-pulse text-cyan-400" /> : <Sliders size={15} />}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                                                        <span>Glide Timing Synchronization</span>
                                                        {glide.syncToBreath && (
                                                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                                                                BREATH-SYNCED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[8.5px] text-slate-400">
                                                        {glide.syncToBreath 
                                                            ? 'Glide duration dynamically locks to active Inhale & Exhale breath timing' 
                                                            : 'Standard fixed-duration portamento between chord transitions'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10 shrink-0 self-start sm:self-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => onChordGlideConfigChange?.({ syncToBreath: false })}
                                                    className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
                                                        !glide.syncToBreath 
                                                            ? 'bg-white/15 text-white shadow-sm border border-white/20' 
                                                            : 'text-slate-400 hover:text-slate-200'
                                                    }`}
                                                >
                                                    <Sliders size={10} />
                                                    <span>Manual (ms)</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onChordGlideConfigChange?.({ syncToBreath: true, enabled: true })}
                                                    className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                                                        glide.syncToBreath 
                                                            ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)] font-extrabold border border-cyan-300' 
                                                            : 'text-slate-400 hover:text-cyan-300'
                                                    }`}
                                                >
                                                    <Wind size={11} className={glide.syncToBreath ? 'fill-current' : ''} />
                                                    <span>Breath Sync</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Breath-Synchronized Glide Controls */}
                                        {glide.syncToBreath ? (
                                            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                                                {/* Alignment Mode Cards */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                                                            <Wind size={12} className="text-cyan-400" />
                                                            Breath Phase Timing Alignment
                                                        </span>
                                                        <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 font-semibold">
                                                            Inhale: {(inhale * multiplier).toFixed(1)}s · Exhale: {(exhale * multiplier).toFixed(1)}s
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                                        {([
                                                            {
                                                                target: 'PHASE' as const,
                                                                title: 'Dynamic Inhale & Exhale',
                                                                badge: `${(inhale * multiplier).toFixed(1)}s In / ${(exhale * multiplier).toFixed(1)}s Ex`,
                                                                desc: 'Glides across Inhale during inhalation, and across Exhale during exhalation.'
                                                            },
                                                            {
                                                                target: 'INHALE' as const,
                                                                title: 'Inhale Phase Locked',
                                                                badge: `${(inhale * multiplier).toFixed(1)}s Glide`,
                                                                desc: 'Every chord shift glides at the exact duration of the active Inhale.'
                                                            },
                                                            {
                                                                target: 'EXHALE' as const,
                                                                title: 'Exhale Phase Locked',
                                                                badge: `${(exhale * multiplier).toFixed(1)}s Glide`,
                                                                desc: 'Every chord shift glides at the exact duration of the active Exhale.'
                                                            },
                                                            {
                                                                target: 'CYCLE' as const,
                                                                title: 'Full Breath Cycle',
                                                                badge: `${(fullCycle * multiplier).toFixed(1)}s Glide`,
                                                                desc: 'Ultra-slow ambient morphing spanning the entire continuous breath cycle.'
                                                            }
                                                        ]).map(opt => {
                                                            const isCurrent = (glide.breathSyncTarget || 'PHASE') === opt.target;
                                                            return (
                                                                <button
                                                                    key={opt.target}
                                                                    onClick={() => onChordGlideConfigChange?.({ breathSyncTarget: opt.target })}
                                                                    className={`p-2.5 rounded-lg border text-left transition-all ${
                                                                        isCurrent
                                                                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                                                            : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-[10px] font-bold">{opt.title}</span>
                                                                        <span className="text-[8px] font-mono text-cyan-400 font-semibold">{opt.badge}</span>
                                                                    </div>
                                                                    <div className="text-[8px] text-slate-400 leading-tight">
                                                                        {opt.desc}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Phase Proportion / Multiplier */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
                                                            Phase Proportion (Glide Fraction of Breath Stroke)
                                                        </span>
                                                        <span className="text-[9px] font-mono text-cyan-300 font-bold">
                                                            {Math.round(multiplier * 100)}% of Breath Phase
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                        {[
                                                            { mult: 1.0, label: '100% (Full Phase)', desc: 'Glides across entire breath' },
                                                            { mult: 0.75, label: '75% (3/4 Phase)', desc: 'Smooth swell with resting plateau' },
                                                            { mult: 0.5, label: '50% (Half Phase)', desc: 'Transitions first half of breath' },
                                                            { mult: 0.25, label: '25% (Quarter Phase)', desc: 'Quick swell at phase start' }
                                                        ].map(m => {
                                                            const isSelected = Math.abs(multiplier - m.mult) < 0.05;
                                                            return (
                                                                <button
                                                                    key={m.mult}
                                                                    onClick={() => onChordGlideConfigChange?.({ breathSyncMultiplier: m.mult })}
                                                                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                                                                        isSelected
                                                                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.25)] font-bold'
                                                                            : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                                                    }`}
                                                                >
                                                                    <div className="text-[9px] font-semibold">{m.label}</div>
                                                                    <div className="text-[7.5px] text-slate-400 font-mono truncate">{m.desc}</div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Live Breath Pacer Status */}
                                                <div className="p-2 rounded-lg bg-black/50 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[9px]">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${isBreathActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                                                        <span className="text-slate-300">
                                                            {isBreathActive ? (
                                                                <span>Breath Pacer Running: Inhale {inhale}s · Hold {holdIn}s · Exhale {exhale}s · Hold {holdOut}s</span>
                                                            ) : (
                                                                <span>Breath Pacer Idle (Glides calculate using current preset: {inhale}s Inhale / {exhale}s Exhale)</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    {onToggleBreathPacer && (
                                                        <button
                                                            type="button"
                                                            onClick={onToggleBreathPacer}
                                                            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 uppercase text-[8px] font-bold tracking-wider transition-colors shrink-0"
                                                        >
                                                            {isBreathActive ? 'Pause Pacer' : 'Start Pacer'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Manual Portamento Time Slider */
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                                        <Sliders size={12} className="text-cyan-400" />
                                                        Portamento Transition Time
                                                    </span>
                                                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                                                        {Math.round(glide.time * 1000)} ms <span className="text-slate-400 font-normal">({glide.time.toFixed(2)}s)</span>
                                                    </span>
                                                </div>

                                                <input
                                                    type="range"
                                                    min="0.05"
                                                    max="1.50"
                                                    step="0.05"
                                                    value={glide.time}
                                                    onChange={(e) => onChordGlideConfigChange?.({ time: parseFloat(e.target.value) })}
                                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                                                />
                                                <div className="flex justify-between text-[8px] font-mono text-slate-500 px-0.5">
                                                    <span>50ms (micro-slide)</span>
                                                    <span>400ms (lyrical)</span>
                                                    <span>800ms (ambient)</span>
                                                    <span>1500ms (deep swell)</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Zen Quick-Pick Presets */}
                                        <div className="space-y-1.5">
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                                <span>Zen Quick-Picks</span>
                                                <span className="text-[8px] text-slate-500 font-normal">Includes fixed & breath-adaptive presets</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                                {CHORD_GLIDE_PRESETS.map(preset => {
                                                    const isSelected = preset.syncToBreath 
                                                        ? Boolean(glide.syncToBreath) 
                                                        : (!glide.syncToBreath && Math.abs(glide.time - preset.time) < 0.02);
                                                    return (
                                                        <button
                                                            key={preset.label}
                                                            onClick={() => {
                                                                if (preset.syncToBreath) {
                                                                    onChordGlideConfigChange?.({ 
                                                                        syncToBreath: true, 
                                                                        enabled: true,
                                                                        breathSyncTarget: preset.breathSyncTarget || 'PHASE',
                                                                        breathSyncMultiplier: preset.breathSyncMultiplier || 1.0
                                                                    });
                                                                } else {
                                                                    onChordGlideConfigChange?.({ 
                                                                        syncToBreath: false, 
                                                                        time: preset.time,
                                                                        enabled: true
                                                                    });
                                                                }
                                                            }}
                                                            className={`p-2 rounded-lg border text-left transition-all ${
                                                                isSelected 
                                                                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.25)]' 
                                                                    : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-bold flex items-center gap-1">
                                                                    {preset.syncToBreath && <Wind size={10} className="text-cyan-400 shrink-0" />}
                                                                    {preset.label}
                                                                </span>
                                                                <span className="text-[8px] font-mono text-cyan-400">
                                                                    {preset.syncToBreath 
                                                                        ? `${(inhale * multiplier).toFixed(1)}s/${(exhale * multiplier).toFixed(1)}s`
                                                                        : `${Math.round(preset.time * 1000)}ms`
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="text-[8px] text-slate-400 truncate">
                                                                {preset.description}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Slew Curve & Voice-Leading Mode */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                            {/* Slew Curve */}
                                            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1.5">
                                                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                    Frequency Ramp Curve
                                                </div>
                                                <div className="flex gap-1.5">
                                                    {(['EXPONENTIAL', 'LINEAR'] as const).map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => onChordGlideConfigChange?.({ curve: c })}
                                                            className={`flex-1 py-1 px-2 rounded text-[8px] font-bold uppercase border transition-all ${
                                                                glide.curve === c 
                                                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]' 
                                                                    : 'bg-white/5 text-slate-400 border-transparent hover:text-slate-200'
                                                            }`}
                                                        >
                                                            {c === 'EXPONENTIAL' ? 'Exponential (Vocal)' : 'Linear (Uniform)'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Voice-Leading Mode */}
                                            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1.5">
                                                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                    Voice-Leading Counterpoint
                                                </div>
                                                <div className="flex gap-1">
                                                    {([
                                                        { id: 'CLOSEST_PITCH', label: 'Closest' },
                                                        { id: 'STRICT_VOICING', label: 'Strict' },
                                                        { id: 'CONTRARY_MOTION', label: 'Contrary' }
                                                    ] as const).map(m => (
                                                        <button
                                                            key={m.id}
                                                            onClick={() => onChordGlideConfigChange?.({ voiceLeading: m.id })}
                                                            className={`flex-1 py-1 px-1.5 rounded text-[8px] font-bold uppercase border transition-all truncate ${
                                                                glide.voiceLeading === m.id 
                                                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]' 
                                                                    : 'bg-white/5 text-slate-400 border-transparent hover:text-slate-200'
                                                            }`}
                                                            title={m.id === 'CONTRARY_MOTION' ? 'Classical Counterpoint: Inner voices move contrary to soprano melody' : m.id === 'CLOSEST_PITCH' ? 'Smooth Minimal-Distance Voice Leading' : 'Strict Register Voicing'}
                                                        >
                                                            {m.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Voicing Style (Bill Evans Rootless & Open Drop-2) */}
                                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                    Harmonic Voicing Distribution
                                                </div>
                                                <span className="text-[8px] font-mono text-cyan-400">
                                                    {glide.voicingStyle === 'ROOTLESS_SHELL' ? 'Bill Evans Shell' : glide.voicingStyle === 'OPEN_DROP2' ? 'Open Drop-2' : 'Full Stack'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                                {([
                                                    { id: 'FULL_STACK', title: 'Full Stack', desc: 'Standard stacked chord voices' },
                                                    { id: 'ROOTLESS_SHELL', title: 'Bill Evans', desc: 'Rootless shell (omits 150-300Hz root mud, adds 9th)' },
                                                    { id: 'OPEN_DROP2', title: 'Open Drop-2', desc: 'Spreads 2nd voice down 1 octave' }
                                                ] as const).map(v => (
                                                    <button
                                                        key={v.id}
                                                        type="button"
                                                        onClick={() => onChordGlideConfigChange?.({ voicingStyle: v.id })}
                                                        className={`p-1.5 rounded-lg border text-left transition-all ${
                                                            (glide.voicingStyle || 'FULL_STACK') === v.id
                                                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                                                                : 'bg-white/5 text-slate-400 border-transparent hover:text-slate-200'
                                                        }`}
                                                    >
                                                        <div className="text-[8.5px] font-bold truncate">{v.title}</div>
                                                        <div className="text-[7px] text-slate-400 leading-tight line-clamp-1">{v.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Harmonic Purity & Acoustic Safeguards Matrix */}
                                        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                                    <ShieldCheck size={12} className="text-emerald-400" />
                                                    <span>Harmonic Purity & Acoustic Protection</span>
                                                </div>
                                                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                                    Professor Grade Tuning
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                {/* Adaptive Just Intonation */}
                                                <button
                                                    type="button"
                                                    onClick={() => onChordGlideConfigChange?.({ adaptiveJustIntonation: !glide.adaptiveJustIntonation })}
                                                    className={`p-2 rounded-lg border text-left transition-all ${
                                                        glide.adaptiveJustIntonation
                                                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                                                            : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[9px] font-bold">Adaptive Just Intonation</span>
                                                        <span className={`text-[7.5px] px-1 py-0.2 rounded font-mono ${glide.adaptiveJustIntonation ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-slate-400'}`}>
                                                            {glide.adaptiveJustIntonation ? 'ON' : 'OFF'}
                                                        </span>
                                                    </div>
                                                    <div className="text-[7.5px] text-slate-400 leading-tight">
                                                        Dynamic root anchoring dissolves syntonic comma wolf intervals.
                                                    </div>
                                                </button>

                                                {/* Low Interval Limit Protection */}
                                                <button
                                                    type="button"
                                                    onClick={() => onChordGlideConfigChange?.({ lowIntervalLimit: !glide.lowIntervalLimit })}
                                                    className={`p-2 rounded-lg border text-left transition-all ${
                                                        glide.lowIntervalLimit
                                                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                                                            : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[9px] font-bold">Low Interval Limit</span>
                                                        <span className={`text-[7.5px] px-1 py-0.2 rounded font-mono ${glide.lowIntervalLimit ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/10 text-slate-400'}`}>
                                                            {glide.lowIntervalLimit ? 'ON' : 'OFF'}
                                                        </span>
                                                    </div>
                                                    <div className="text-[7.5px] text-slate-400 leading-tight">
                                                        Prevents muddy intermodulation distortion below C3 (130.8 Hz).
                                                    </div>
                                                </button>

                                                {/* Respiration Harmonic Tension */}
                                                <button
                                                    type="button"
                                                    onClick={() => onChordGlideConfigChange?.({ breathHarmonicTension: !glide.breathHarmonicTension })}
                                                    className={`p-2 rounded-lg border text-left transition-all ${
                                                        glide.breathHarmonicTension
                                                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                                                            : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[9px] font-bold">Respiration Tension</span>
                                                        <span className={`text-[7.5px] px-1 py-0.2 rounded font-mono ${glide.breathHarmonicTension ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-slate-400'}`}>
                                                            {glide.breathHarmonicTension ? 'ON' : 'OFF'}
                                                        </span>
                                                    </div>
                                                    <div className="text-[7.5px] text-slate-400 leading-tight">
                                                        Swells presence on inhale and settles grounded on exhale.
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Clinical Entrainment Protection Badge */}
                                        <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 flex items-center gap-2 text-[9px] text-cyan-300 font-mono">
                                            <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
                                            <span>Binaural Entrainment Locked: L/R frequency differentials remain synchronously bound throughout portamento.</span>
                                        </div>

                                        {/* Live Audition Glide Test Bar */}
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/10 gap-2">
                                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                                <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0">Audition:</span>
                                                {isGliding ? (
                                                    <span className="text-[9px] font-mono text-cyan-300 font-bold animate-pulse flex items-center gap-1 truncate">
                                                        {glide.syncToBreath ? (
                                                            <Wind size={11} className="text-cyan-400 animate-pulse shrink-0" />
                                                        ) : (
                                                            <Waves size={10} className="animate-spin text-cyan-400 shrink-0" />
                                                        )}
                                                        Gliding to {currentChord?.name || 'Chord'}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-mono text-slate-400 truncate">Current: <strong className="text-amber-300">{currentChord?.name || 'C'}</strong></span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0">
                                                <button
                                                    onClick={() => onAdvanceChord(-1)}
                                                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 text-[9px] font-bold flex items-center gap-1 transition-all"
                                                    title="Step to Previous Chord with Glide"
                                                >
                                                    <ChevronLeft size={12} /> Prev
                                                </button>
                                                <button
                                                    onClick={() => onAdvanceChord(1)}
                                                    className="flex-1 sm:flex-none px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm"
                                                    title="Step to Next Chord with Glide"
                                                >
                                                    <Play size={10} className="fill-current" />
                                                    <span className="sm:hidden">Next Glide</span>
                                                    <span className="hidden sm:inline">Audition Next Chord Glide</span>
                                                    <ChevronRight size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Breath Synchronization Mode */}
                            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                    Breath Pacer Synchronization Mode
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                    {([
                                        { mode: 'BREATH_PHASE', title: 'Start of Inhale & Exhale', desc: 'Advances strictly on the start of Inhale and start of Exhale (never during holds).' },
                                        { mode: 'BREATH_CYCLE', title: 'Start of Inhale Only', desc: 'Advances strictly on the start of each new Inhalation cycle.' },
                                        { mode: 'BREATH_EXHALE', title: 'Start of Exhale Only', desc: 'Advances strictly on the start of each Exhalation phase.' },
                                        { mode: 'MANUAL', title: 'Manual Only', desc: 'Advances only when you press Next / Previous or select a chord.' }
                                    ] as const).map(opt => (
                                        <button
                                            key={opt.mode}
                                            onClick={() => onAdvanceModeChange(opt.mode)}
                                            className={`p-3 rounded-xl border text-left transition-all ${
                                                advanceMode === opt.mode 
                                                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]' 
                                                    : 'bg-black/30 border-white/10 hover:border-white/20 text-slate-300 hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold">{opt.title}</span>
                                                {advanceMode === opt.mode && <Check size={12} className="text-cyan-400 shrink-0" />}
                                            </div>
                                            <div className="text-[8px] text-slate-400 leading-tight">
                                                {opt.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Generative Harmonic Branching / Drift Toggle */}
                                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                            <Shuffle size={12} />
                                        </div>
                                        <div>
                                            <div className="text-[9.5px] font-bold text-slate-200 uppercase">
                                                Generative Markov Harmonic Branching
                                            </div>
                                            <div className="text-[8px] text-slate-400">
                                                Instead of strict sequential looping, chords branch organically through related cadences and relative keys.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onChordGlideConfigChange?.({ generativeDrift: !glide.generativeDrift })}
                                        className={`px-3 py-1 rounded-lg border text-[8.5px] font-mono font-bold uppercase transition-all shrink-0 ${
                                            glide.generativeDrift
                                                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                        }`}
                                    >
                                        Markov Drift: {glide.generativeDrift ? 'Active' : 'Sequential'}
                                    </button>
                                </div>
                            </div>

                            {/* Auto-Adopt Progression Tuning */}
                            <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                        Adopt Recommended Tuning for this Progression
                                    </div>
                                    <div className="text-[9px] text-slate-400">
                                        Recommended: {currentProgression.recommendedPitch} Hz · {TEMPERAMENTS.find(t => t.id === currentProgression.recommendedTemperament)?.name || currentProgression.recommendedTemperament}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        onPitchChange(currentProgression.recommendedPitch);
                                        onTemperamentChange(currentProgression.recommendedTemperament);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[9px] font-bold uppercase tracking-wider transition-colors shrink-0"
                                >
                                    Apply Tuning
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: PROGRESSION DESIGNER */}
                    {selectedTab === 'DESIGNER' && (
                        <ProgressionDesigner
                            currentProgression={currentProgression}
                            onSaveAndActivate={(prog) => {
                                handleCustomChange();
                                if (onSaveAndActivateProgression) {
                                    onSaveAndActivateProgression(prog);
                                } else {
                                    onSelectMood(prog.mood);
                                    onSelectProgression(prog.id);
                                    onPitchChange(prog.recommendedPitch);
                                    onTemperamentChange(prog.recommendedTemperament);
                                    if (!isProgressionActive) onToggleProgression();
                                }
                                setSelectedTab('CHORDS');
                            }}
                            onPlaySingleChord={onPlaySingleChord}
                            onCustomProgressionsChange={handleCustomChange}
                            currentPitch={pitch}
                            currentTemperament={temperament}
                        />
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-5 py-3 border-t border-white/10 bg-slate-900/90 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onAdvanceChord(-1)}
                            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-bold text-slate-300 hover:text-white uppercase flex items-center gap-1"
                        >
                            <ChevronLeft size={12} /> Prev Chord
                        </button>
                        <button
                            onClick={() => onAdvanceChord(1)}
                            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-bold text-slate-300 hover:text-white uppercase flex items-center gap-1"
                        >
                            Next Chord <ChevronRight size={12} />
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider transition-all"
                    >
                        Done
                    </button>
                </div>

            </div>
        </div>
    );
};
