import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    X, Sparkles, Play, Pause, Square, Plus, Trash2, ArrowLeft, ArrowRight, 
    Copy, Save, Volume2, RotateCcw, Clock, 
    Sliders, Check, ChevronLeft, ChevronRight,
    Repeat, Maximize, GripVertical, Layers
} from 'lucide-react';
import { 
    ExperienceBlock, 
    ExperienceDef, 
    STARTER_EXPERIENCES, 
    resolveBlockFrequencies, 
    loadCustomExperiences, 
    saveCustomExperience, 
    deleteCustomExperience 
} from '../../services/audio/experienceDesigner';
import { TuningTemperament } from './visuals/shared';
import { TuningArchitectPanel } from './TuningArchitectPanel';
import { EntrainmentLayer } from '../../services/audio/AudioTypes';
import { SenticEmotion } from '../../services/kinematics/senticForms';
import { PhaseAcousticAccordion } from './experienceDesigner/PhaseAcousticAccordion';
import { PhaseBreathAccordion } from './experienceDesigner/PhaseBreathAccordion';
import { PhaseEntrainmentAccordion } from './experienceDesigner/PhaseEntrainmentAccordion';
import { PhaseSenticsAccordion } from './experienceDesigner/PhaseSenticsAccordion';
import { PhaseHeartAccordion } from './experienceDesigner/PhaseHeartAccordion';
import { PhaseMatrixCrystalAccordion } from './experienceDesigner/PhaseMatrixCrystalAccordion';
import { PhasePulseAccordion } from './experienceDesigner/PhasePulseAccordion';
import { MasterTransportControls, MasterTransportStatus } from './tuner/MasterTransportControls';

interface ExperienceDesignerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPitch: number;
    currentTemperament: TuningTemperament;
    
    // Playback integration
    isPlaying: boolean;
    isPaused?: boolean;
    masterStatus?: MasterTransportStatus;
    onMasterPlayPause?: () => void;
    onMasterStop?: () => void;
    onMasterClear?: () => void;
    activeExperienceId?: string;
    activeBlockIndex: number;
    blockProgress: number; // 0.0 to 1.0 progress through current block
    currentCycle: number;
    totalCycles: number;
    onTogglePlayExperience: (experience: ExperienceDef) => void;
    onPlayAndImmerse?: (experience: ExperienceDef) => void;
    onToggleVisualizerImmersion?: (forced?: boolean) => void;
    onStopExperience: () => void;
    onAuditionBlock?: (block: ExperienceBlock) => void;
    onJumpToBlock?: (index: number) => void;
    onPitchChange?: (pitch: number) => void;
    onTemperamentChange?: (temperament: TuningTemperament) => void;

    // Multi-sensory global fallback states
    globalEntrainmentFreq?: number;
    globalEntrainmentLayers?: EntrainmentLayer[];
    globalSenticEmotion?: SenticEmotion;
    globalHeartSyncMode?: 'BREATH' | 'BREATH_COUNT' | 'STEADY' | 'BINAURAL';
    globalBpm?: number;
    globalComposerWarp?: string;
    globalTimeCrystalTopology?: 'FIBONACCI' | 'PRIME' | 'THUE_MORSE' | 'PERIOD_DOUBLE';
    globalTimeCrystalEnabled?: boolean;
    globalPulseStyle?: string;
}

export const ExperienceDesignerModal: React.FC<ExperienceDesignerModalProps> = ({
    isOpen,
    onClose,
    currentPitch,
    currentTemperament,
    isPlaying,
    isPaused = false,
    masterStatus,
    onMasterPlayPause,
    onMasterStop,
    onMasterClear,
    activeExperienceId,
    activeBlockIndex,
    blockProgress,
    currentCycle,
    totalCycles,
    onTogglePlayExperience,
    onPlayAndImmerse,
    onToggleVisualizerImmersion,
    onStopExperience,
    onAuditionBlock,
    onJumpToBlock,
    onPitchChange,
    onTemperamentChange,
    globalEntrainmentFreq,
    globalEntrainmentLayers,
    globalSenticEmotion,
    globalHeartSyncMode,
    globalBpm,
    globalComposerWarp,
    globalTimeCrystalTopology,
    globalTimeCrystalEnabled,
    globalPulseStyle
}) => {
    const [experiences, setExperiences] = useState<ExperienceDef[]>(() => {
        const custom = loadCustomExperiences();
        return [...custom, ...STARTER_EXPERIENCES];
    });

    const [selectedExpId, setSelectedExpId] = useState<string>(experiences[0]?.id || STARTER_EXPERIENCES[0]?.id || 'exp_hypnagogic_descent');
    const [currentExp, setCurrentExp] = useState<ExperienceDef>(() => experiences[0] || STARTER_EXPERIENCES[0]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

    // Tuning architect drawer/modal state
    const [isTuningMenuOpen, setIsTuningMenuOpen] = useState<boolean>(false);
    // Audition active state tracking
    const [auditioningBlockId, setAuditioningBlockId] = useState<string | null>(null);

    // Auto-fullscreen immersion on play preference
    const [autoImmerseOnPlay, setAutoImmerseOnPlay] = useState<boolean>(() => {
        try {
            return localStorage.getItem('experience_auto_immerse') === 'true';
        } catch {
            return false;
        }
    });

    const handleToggleAutoImmerse = (val: boolean) => {
        setAutoImmerseOnPlay(val);
        try {
            localStorage.setItem('experience_auto_immerse', String(val));
        } catch { /* ignore */ }
    };

    // Accordion Solo Mode state: when enabled, opening an accordion closes other layers in that phase
    const [isAccordionSoloMode, setIsAccordionSoloMode] = useState<boolean>(true);
    const [openAccordionMap, setOpenAccordionMap] = useState<Record<string, string | null>>({});

    const handleToggleAccordion = (blockId: string, layerName: string) => {
        if (isAccordionSoloMode) {
            setOpenAccordionMap(prev => ({
                ...prev,
                [blockId]: prev[blockId] === layerName ? null : layerName
            }));
        } else {
            setOpenAccordionMap(prev => {
                const current = prev[blockId] ? prev[blockId]!.split(',') : ['ACOUSTIC'];
                const hasIt = current.includes(layerName);
                const next = hasIt ? current.filter(x => x !== layerName) : [...current, layerName];
                return {
                    ...prev,
                    [blockId]: next.join(',')
                };
            });
        }
    };

    const isAccordionOpen = (blockId: string, layerName: string, defaultOpen: boolean = false) => {
        const stored = openAccordionMap[blockId];
        if (stored === undefined) {
            return false;
        }
        if (stored === null) return false;
        return stored.split(',').includes(layerName);
    };

    // Drag and Drop state for reordering phases
    const [draggedBlockIdx, setDraggedBlockIdx] = useState<number | null>(null);
    const [dragOverBlockIdx, setDragOverBlockIdx] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedBlockIdx(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverBlockIdx !== index) {
            setDragOverBlockIdx(index);
        }
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedBlockIdx === null || draggedBlockIdx === targetIndex) {
            setDraggedBlockIdx(null);
            setDragOverBlockIdx(null);
            return;
        }
        setCurrentExp(prev => {
            const nextBlocks = [...(prev.blocks || [])];
            const [removed] = nextBlocks.splice(draggedBlockIdx, 1);
            nextBlocks.splice(targetIndex, 0, removed);
            return { ...prev, blocks: nextBlocks };
        });
        setHasUnsavedChanges(true);
        setMobileFocusedIdx(targetIndex);
        setDraggedBlockIdx(null);
        setDragOverBlockIdx(null);
    };

    const handleDragEnd = () => {
        setDraggedBlockIdx(null);
        setDragOverBlockIdx(null);
    };

    // Universal Play trigger factoring in auto-immersion preference
    const handleTriggerPlay = (forceImmerse: boolean = false) => {
        if (forceImmerse || autoImmerseOnPlay) {
            if (onPlayAndImmerse) {
                onPlayAndImmerse(currentExp);
            } else {
                onTogglePlayExperience(currentExp);
                if (onToggleVisualizerImmersion) onToggleVisualizerImmersion(true);
            }
        } else {
            onTogglePlayExperience(currentExp);
        }
    };

    // Mobile layout responsive states
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [mobileViewMode, setMobileViewMode] = useState<'FOCUS' | 'LIST'>('FOCUS');
    const [mobileFocusedIdx, setMobileFocusedIdx] = useState<number>(0);

    // Active audition audio reference for true play/stop toggle
    const auditionCtxRef = useRef<AudioContext | null>(null);
    const activeAuditionRef = useRef<{
        masterGain: GainNode;
        oscillators: OscillatorNode[];
        blockId: string;
        safetyTimer: ReturnType<typeof setTimeout>;
    } | null>(null);

    // Keep onAuditionBlock reference stable to avoid recreating callbacks
    const onAuditionBlockRef = useRef(onAuditionBlock);
    useEffect(() => {
        onAuditionBlockRef.current = onAuditionBlock;
    }, [onAuditionBlock]);

    // Stop active audition audio immediately and cleanly (stable callback - no re-renders)
    const stopAuditionAudio = useCallback(() => {
        const activeAudition = activeAuditionRef.current;
        if (!activeAudition) {
            setAuditioningBlockId(null);
            return;
        }

        const { masterGain, oscillators, safetyTimer } = activeAudition;
        activeAuditionRef.current = null;
        clearTimeout(safetyTimer);

        try {
            const ctx = auditionCtxRef.current;
            if (ctx && ctx.state !== 'closed') {
                const now = ctx.currentTime;
                masterGain.gain.cancelScheduledValues(now);
                masterGain.gain.setValueAtTime(masterGain.gain.value, now);
                masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.025);
            }
            setTimeout(() => {
                oscillators.forEach(osc => {
                    try { osc.stop(); osc.disconnect(); } catch { /* ignore */ }
                });
                try { masterGain.disconnect(); } catch { /* ignore */ }
            }, 30);
        } catch {
            oscillators.forEach(osc => {
                try { osc.stop(); osc.disconnect(); } catch { /* ignore */ }
            });
        }

        setAuditioningBlockId(null);
    }, []);

    // Handle play or stop when audition button is pressed: simple, instant toggle
    const handleAuditionBlockAudio = useCallback((block: ExperienceBlock) => {
        // Instant Toggle Logic: If any audition audio is currently active, stop it immediately
        if (auditioningBlockId || activeAuditionRef.current) {
            const currentPlayingId = auditioningBlockId || activeAuditionRef.current?.blockId;
            stopAuditionAudio();
            // If the user clicked the button of the block that was currently playing, stop and finish (toggled off)
            if (currentPlayingId === block.id) {
                return;
            }
        }

        const pitch = currentExp.pitchRef || currentPitch || 432;
        const temp = currentExp.temperament || currentTemperament || 'JUST_INTONATION';
        // Treat as CHORD if it has custom chord notes
        const targetBlock: ExperienceBlock = {
            ...block,
            soundType: (block.chord?.customNotes && block.chord.customNotes.length > 0) ? 'CHORD' : block.soundType
        };
        const resolved = resolveBlockFrequencies(targetBlock, pitch, temp);
        if (!resolved.frequencies || resolved.frequencies.length === 0) return;

        try {
            const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtxClass) return;
            if (!auditionCtxRef.current || auditionCtxRef.current.state === 'closed') {
                auditionCtxRef.current = new AudioCtxClass();
            }
            const ctx = auditionCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            const masterGain = ctx.createGain();
            const count = resolved.frequencies.length;
            const peak = Math.min(0.24, 0.42 / Math.sqrt(Math.max(1, count)));

            const now = ctx.currentTime;
            masterGain.gain.setValueAtTime(0.0001, now);
            masterGain.gain.linearRampToValueAtTime(peak, now + 0.04);
            masterGain.connect(ctx.destination);

            const oscillators: OscillatorNode[] = [];
            resolved.frequencies.forEach((freq) => {
                if (!isFinite(freq) || freq <= 10) return;
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                const voiceGain = ctx.createGain();
                const voiceScale = freq > 1500 ? 0.7 : 1.0;
                voiceGain.gain.setValueAtTime(voiceScale, now);

                osc.connect(voiceGain);
                voiceGain.connect(masterGain);
                osc.start(now);
                oscillators.push(osc);
            });

            // 60-second safety timeout
            const safetyTimer = setTimeout(() => {
                stopAuditionAudio();
            }, 60000);

            activeAuditionRef.current = {
                masterGain,
                oscillators,
                blockId: block.id,
                safetyTimer
            };

            setAuditioningBlockId(block.id);
        } catch (e) {
            console.warn('Audio audition error:', e);
            stopAuditionAudio();
        }
    }, [auditioningBlockId, currentExp.pitchRef, currentExp.temperament, currentPitch, currentTemperament, stopAuditionAudio]);

    // Clean up on component unmount safely without setState calls
    useEffect(() => {
        return () => {
            stopAuditionAudio();
            if (auditionCtxRef.current && auditionCtxRef.current.state !== 'closed') {
                auditionCtxRef.current.close().catch(() => {});
            }
        };
    }, [stopAuditionAudio]);

    // Stop active audition if live playback begins
    const prevPlayingRef = useRef(isPlaying);
    useEffect(() => {
        if (!prevPlayingRef.current && isPlaying) {
            if (activeAuditionRef.current) {
                setTimeout(() => {
                    stopAuditionAudio();
                }, 0);
            }
        }
        prevPlayingRef.current = isPlaying;
    }, [isPlaying, stopAuditionAudio]);

    // Update active experience selection
    const handleSelectExperience = (id: string) => {
        const found = experiences.find(e => e.id === id);
        if (found) {
            setSelectedExpId(id);
            // Deep clone so editing doesn't mutate base template directly
            setCurrentExp(JSON.parse(JSON.stringify(found)));
            setHasUnsavedChanges(false);
            setMobileFocusedIdx(0);
            setOpenAccordionMap({});
        }
    };

    // Calculate total sequence time (with strictly preserved dependency)
    const totalCycleDuration = useMemo(() => {
        return (currentExp.blocks || []).reduce((acc, b) => acc + (Number(b.durationSeconds) || 0), 0);
    }, [currentExp.blocks]);

    // Active playback tracking for current experience
    const isCurrentPlaying = isPlaying && activeExperienceId === currentExp?.id;

    // Responsive Mobile Index calculation derived purely during render (eliminates cascading effect setState loops)
    const totalBlocks = currentExp?.blocks?.length || 0;
    const clampedMobileIdx = totalBlocks > 0 ? Math.min(mobileFocusedIdx, totalBlocks - 1) : 0;
    const effectiveMobileIdx = (isCurrentPlaying && activeBlockIndex >= 0 && activeBlockIndex < totalBlocks)
        ? activeBlockIndex
        : clampedMobileIdx;

    // Handle block property update
    const updateBlock = (index: number, updates: Partial<ExperienceBlock>) => {
        setCurrentExp(prev => {
            const nextBlocks = [...(prev.blocks || [])];
            nextBlocks[index] = { ...nextBlocks[index], ...updates };
            return { ...prev, blocks: nextBlocks };
        });
        setHasUnsavedChanges(true);
    };

    // Add new block
    const handleAddBlock = () => {
        const curBlocks = currentExp?.blocks || [];
        const newBlock: ExperienceBlock = {
            id: 'block_' + Math.random().toString(36).substring(2, 9),
            label: `Phase ${curBlocks.length + 1}`,
            soundType: 'CHORD',
            chord: { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
            breathPhase: 'INHALE',
            durationSeconds: 4.0,
            glideSeconds: 0.4
        };
        setCurrentExp(prev => ({ ...prev, blocks: [...(prev.blocks || []), newBlock] }));
        setHasUnsavedChanges(true);
        setMobileFocusedIdx(curBlocks.length);
    };

    // Duplicate block
    const handleDuplicateBlock = (index: number) => {
        const curBlocks = currentExp?.blocks || [];
        const target = curBlocks[index];
        if (!target) return;
        const dup: ExperienceBlock = {
            ...JSON.parse(JSON.stringify(target)),
            id: 'block_' + Math.random().toString(36).substring(2, 9),
            label: `${target.label || 'Phase'} (Copy)`
        };
        setCurrentExp(prev => {
            const nextBlocks = [...(prev.blocks || [])];
            nextBlocks.splice(index + 1, 0, dup);
            return { ...prev, blocks: nextBlocks };
        });
        setHasUnsavedChanges(true);
        setMobileFocusedIdx(index + 1);
    };

    // Move block left/right
    const handleMoveBlock = (index: number, direction: -1 | 1) => {
        const curBlocks = currentExp?.blocks || [];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= curBlocks.length) return;
        setCurrentExp(prev => {
            const nextBlocks = [...(prev.blocks || [])];
            const [removed] = nextBlocks.splice(index, 1);
            nextBlocks.splice(newIndex, 0, removed);
            return { ...prev, blocks: nextBlocks };
        });
        setHasUnsavedChanges(true);
        setMobileFocusedIdx(newIndex);
    };

    // Delete block
    const handleDeleteBlock = (index: number) => {
        const curBlocks = currentExp?.blocks || [];
        if (curBlocks.length <= 1) return;
        setCurrentExp(prev => ({
            ...prev,
            blocks: (prev.blocks || []).filter((_, i) => i !== index)
        }));
        setHasUnsavedChanges(true);
        setMobileFocusedIdx(prev => Math.max(0, Math.min(prev, curBlocks.length - 2)));
    };

    // Create a new blank experience
    const handleCreateNewExperience = () => {
        const newExp: ExperienceDef = {
            id: 'custom_exp_' + Date.now(),
            name: 'New Custom Experience',
            description: 'Custom acoustic-respiratory sequence with synchronized breath pacing.',
            category: 'CUSTOM',
            pitchRef: currentPitch || 432.0,
            temperament: currentTemperament || 'JUST_INTONATION',
            loopMode: 'CONTINUOUS',
            targetCycles: 4,
            blocks: [
                {
                    id: 'b_init_1',
                    label: 'Diaphragmatic Inhale',
                    soundType: 'CHORD',
                    chord: { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                    breathPhase: 'INHALE',
                    durationSeconds: 4.0,
                    glideSeconds: 0.4
                },
                {
                    id: 'b_init_2',
                    label: 'Apex Suspension',
                    soundType: 'PURE_TONE',
                    pureToneHz: 528.0,
                    breathPhase: 'HOLD_IN',
                    durationSeconds: 4.0,
                    glideSeconds: 0.4
                },
                {
                    id: 'b_init_3',
                    label: 'Vagal Exhale',
                    soundType: 'CHORD',
                    chord: { name: 'Am9', root: 'A', type: 'min9', octave: 3 },
                    breathPhase: 'EXHALE',
                    durationSeconds: 6.0,
                    glideSeconds: 0.6
                }
            ]
        };
        saveCustomExperience(newExp);
        const custom = loadCustomExperiences();
        setExperiences([...custom, ...STARTER_EXPERIENCES]);
        setSelectedExpId(newExp.id);
        setCurrentExp(newExp);
        setHasUnsavedChanges(false);
        setSaveSuccessNotice('Created new custom experience!');
        setTimeout(() => setSaveSuccessNotice(null), 3000);
    };

    // Save custom experience
    const handleSaveExperience = () => {
        // Ensure unique ID if saving a built-in template
        let expToSave = { ...currentExp };
        if (STARTER_EXPERIENCES.some(s => s.id === expToSave.id)) {
            expToSave = {
                ...expToSave,
                id: 'custom_exp_' + Date.now(),
                name: `${expToSave.name} (Custom)`,
                category: 'CUSTOM'
            };
        }
        saveCustomExperience(expToSave);
        const custom = loadCustomExperiences();
        setExperiences([...custom, ...STARTER_EXPERIENCES]);
        setSelectedExpId(expToSave.id);
        setCurrentExp(expToSave);
        setHasUnsavedChanges(false);
        setSaveSuccessNotice('Experience saved successfully!');
        setTimeout(() => setSaveSuccessNotice(null), 3000);
    };

    // Delete custom experience
    const handleDeleteExperience = (id: string) => {
        const isBuiltIn = STARTER_EXPERIENCES.some(s => s.id === id);
        if (isBuiltIn) return;
        const updated = deleteCustomExperience(id);
        setExperiences([...updated, ...STARTER_EXPERIENCES]);
        const fallback = STARTER_EXPERIENCES[0];
        setSelectedExpId(fallback.id);
        setCurrentExp(fallback);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-0 md:p-6 overflow-hidden animate-in fade-in duration-200">
            <div className="relative w-full h-full md:h-[92vh] md:max-h-[960px] md:max-w-7xl bg-gradient-to-b from-slate-900 via-zinc-950 to-black border-0 md:border md:border-white/15 rounded-none md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* 1. TOP HEADER BAR (OPTIMIZED FOR MOBILE & DESKTOP - NO CLIPPED TEXT) */}
                <div className="flex items-center justify-between px-3 md:px-5 py-2 md:py-2.5 border-b border-white/10 bg-slate-900/95 shrink-0 gap-2">
                    {/* Left branding and preset selector */}
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-teal-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                            <Sparkles size={15} />
                        </div>
                        <div className="min-w-0 flex items-center gap-2 flex-1 max-w-sm md:max-w-md">
                            {/* Preset Selector Dropdown */}
                            <select
                                value={selectedExpId}
                                onChange={(e) => handleSelectExperience(e.target.value)}
                                title="Select Preset Experience"
                                className="bg-black/70 border border-teal-500/40 hover:border-teal-400 text-teal-200 font-bold text-xs md:text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 w-full shadow-inner cursor-pointer"
                            >
                                <optgroup label="Preset Experiences">
                                    {STARTER_EXPERIENCES.map(exp => (
                                        <option key={exp.id} value={exp.id}>{exp.name} ({exp.blocks.length} phases · {exp.blocks.reduce((a, b) => a + (Number(b.durationSeconds) || 0), 0).toFixed(0)}s)</option>
                                    ))}
                                </optgroup>
                                {experiences.filter(e => !STARTER_EXPERIENCES.some(s => s.id === e.id)).length > 0 && (
                                    <optgroup label="Custom User Experiences">
                                        {experiences.filter(e => !STARTER_EXPERIENCES.some(s => s.id === e.id)).map(exp => (
                                            <option key={exp.id} value={exp.id}>{exp.name} (Custom)</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>

                            <button
                                type="button"
                                onClick={handleCreateNewExperience}
                                title="Create new experience"
                                className="hidden sm:flex px-2 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold items-center gap-1 shrink-0 transition-all"
                            >
                                <Plus size={13} />
                                <span>New</span>
                            </button>

                            {selectedExpId.startsWith('custom_') && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteExperience(selectedExpId)}
                                    title="Delete custom experience"
                                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center shrink-0 transition-all"
                                >
                                    <Trash2 size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Top Action Buttons (Single Play/Pause, Save, Stop, Settings, Close) */}
                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
                        {saveSuccessNotice && (
                            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg animate-in fade-in duration-150">
                                <Check size={12} />
                                <span>{saveSuccessNotice}</span>
                            </div>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={handleSaveExperience}
                            title="Save Experience"
                            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all min-h-[36px] ${
                                hasUnsavedChanges
                                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <Save size={13} />
                            <span className="hidden sm:inline">Save</span>
                        </button>

                        {/* Master Play / Pause / Stop / Clear Controls */}
                        <MasterTransportControls
                            status={masterStatus ?? (isCurrentPlaying ? (isPaused ? 'PAUSED' : 'PLAYING') : 'IDLE')}
                            onPlayPause={() => {
                                if (masterStatus === 'IDLE' && !isCurrentPlaying) {
                                    handleTriggerPlay(false);
                                } else if (onMasterPlayPause) {
                                    onMasterPlayPause();
                                } else {
                                    handleTriggerPlay(false);
                                }
                            }}
                            onStop={() => {
                                if (onMasterStop) onMasterStop();
                                else onStopExperience();
                            }}
                            onClear={() => {
                                if (onMasterClear) onMasterClear();
                                else onStopExperience();
                            }}
                            variant="modal"
                        />

                        {/* Play & Immerse (Auto-Fullscreen) Button */}
                        <button
                            onClick={() => handleTriggerPlay(true)}
                            title="Play & Immerse directly into full screen visualizer with floating HUD"
                            className="hidden sm:flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border min-h-[36px] bg-gradient-to-r from-cyan-500 to-blue-500 text-black border-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95"
                        >
                            <Maximize size={13} className="stroke-[2.5]" />
                            <span>Immerse</span>
                        </button>

                        {/* Settings Toggle */}
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            title="Experience & Looping Settings"
                            className={`p-2 rounded-lg border transition-all min-h-[36px] min-w-[36px] flex items-center justify-center ${
                                isSettingsOpen
                                    ? 'bg-teal-500/25 text-teal-300 border-teal-500/40 shadow-[0_0_8px_rgba(20,184,166,0.3)]'
                                    : 'bg-white/5 text-slate-300 border-white/10 active:bg-white/15'
                            }`}
                        >
                            <Sliders size={14} />
                        </button>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            aria-label="Close Experience Designer"
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                            <X size={17} />
                        </button>
                    </div>
                </div>

                {/* MOBILE COLLAPSIBLE SETTINGS DRAWER */}
                {isSettingsOpen && (
                    <div className="md:hidden border-b border-white/10 bg-slate-950/95 p-3.5 space-y-3 shrink-0 animate-in slide-in-from-top-2 duration-150">
                        <div className="flex items-center justify-between pb-1 border-b border-white/10">
                            <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Sliders size={13} /> Experience Parameters
                            </span>
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="text-xs text-slate-400 hover:text-white"
                            >
                                Done
                            </button>
                        </div>

                        {/* Experience Preset Picker */}
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400">Choose Sequence</label>
                            <select
                                value={selectedExpId}
                                onChange={(e) => handleSelectExperience(e.target.value)}
                                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-teal-500"
                            >
                                <optgroup label="Starter Experiences">
                                    {STARTER_EXPERIENCES.map(exp => (
                                        <option key={exp.id} value={exp.id}>{exp.name} ({exp.blocks.length} blocks)</option>
                                    ))}
                                </optgroup>
                                {experiences.filter(e => !STARTER_EXPERIENCES.some(s => s.id === e.id)).length > 0 && (
                                    <optgroup label="Custom Experiences">
                                        {experiences.filter(e => !STARTER_EXPERIENCES.some(s => s.id === e.id)).map(exp => (
                                            <option key={exp.id} value={exp.id}>{exp.name} (Custom)</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>

                        {/* Name & Description */}
                        <div className="space-y-1.5">
                            <input
                                type="text"
                                value={currentExp.name}
                                onChange={(e) => {
                                    setCurrentExp(prev => ({ ...prev, name: e.target.value }));
                                    setHasUnsavedChanges(true);
                                }}
                                placeholder="Experience Name..."
                                className="w-full bg-slate-900/80 border border-white/15 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-teal-400"
                            />
                            <input
                                type="text"
                                value={currentExp.description}
                                onChange={(e) => {
                                    setCurrentExp(prev => ({ ...prev, description: e.target.value }));
                                    setHasUnsavedChanges(true);
                                }}
                                placeholder="Description / notes..."
                                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-400"
                            />
                        </div>

                        {/* Looping Controls on Mobile */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-lg p-1 flex-1">
                                <button
                                    onClick={() => {
                                        setCurrentExp(prev => ({ ...prev, loopMode: 'CONTINUOUS' }));
                                        setHasUnsavedChanges(true);
                                    }}
                                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                                        currentExp.loopMode === 'CONTINUOUS'
                                            ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    Continuous
                                </button>
                                <button
                                    onClick={() => {
                                        setCurrentExp(prev => ({ ...prev, loopMode: 'CYCLE_COUNT' }));
                                        setHasUnsavedChanges(true);
                                    }}
                                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                                        currentExp.loopMode === 'CYCLE_COUNT'
                                            ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    Target Cycles
                                </button>
                            </div>

                            {currentExp.loopMode === 'CYCLE_COUNT' && (
                                <div className="flex items-center gap-1 bg-black/60 border border-white/15 rounded-lg px-2 py-1">
                                    <input
                                        type="number"
                                        min={1}
                                        max={64}
                                        value={currentExp.targetCycles || 4}
                                        onChange={(e) => {
                                            const val = Math.max(1, Math.min(64, parseInt(e.target.value) || 1));
                                            setCurrentExp(prev => ({ ...prev, targetCycles: val }));
                                            setHasUnsavedChanges(true);
                                        }}
                                        className="w-10 bg-transparent text-center text-white text-xs font-bold focus:outline-none"
                                    />
                                    <span className="text-[10px] text-slate-400 font-mono">cyc</span>
                                </div>
                            )}
                        </div>

                        {/* Quick Info Badges & Tuning Trigger */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setIsTuningMenuOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all font-semibold w-full justify-center"
                                title="Choose Tuning & Temperament"
                            >
                                <Sliders size={13} className="text-cyan-400" />
                                <span>Tuning: <strong className="text-amber-300 font-mono">{currentExp.pitchRef || currentPitch || 432}Hz</strong> · <strong className="text-white font-mono">{(currentExp.temperament || currentTemperament || 'JUST_INTONATION').replace(/_/g, ' ')}</strong></span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. DESKTOP SUB-BAR: EXPERIENCE PARAMETERS & GLOBAL SETTINGS */}
                <div className="hidden md:flex flex-wrap items-center justify-between px-5 py-2.5 bg-white/[0.02] border-b border-white/10 shrink-0 gap-3 text-xs">
                    {/* Active preset details */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
                        <span className="text-white font-bold tracking-wide">{currentExp.name}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-teal-400 font-mono font-semibold">{totalCycleDuration.toFixed(1)}s cycle</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-cyan-400 font-mono font-semibold">{currentExp.pitchRef || currentPitch || 432}Hz</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400">{currentExp.blocks.length} phases</span>
                    </div>

                    {/* Experience Details & Looping Options */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Auto-Fullscreen Toggle */}
                        <label 
                            title="Automatically enter fullscreen visualizer when Play is pressed"
                            className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300 bg-black/40 border border-white/10 px-2.5 py-1 rounded-lg select-none hover:border-cyan-500/40 transition-colors"
                        >
                            <input 
                                type="checkbox"
                                checked={autoImmerseOnPlay}
                                onChange={(e) => handleToggleAutoImmerse(e.target.checked)}
                                className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
                            />
                            <span className="font-medium">Auto-Fullscreen</span>
                        </label>

                        {/* Accordion Solo Mode Toggle */}
                        <button
                            onClick={() => setIsAccordionSoloMode(!isAccordionSoloMode)}
                            title={isAccordionSoloMode ? "Solo Accordion Mode active: Opening an accordion layer closes other layers in that phase" : "Multi-Accordion Mode: Multiple layers open simultaneously"}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                isAccordionSoloMode 
                                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-[0_0_8px_rgba(20,184,166,0.15)]' 
                                    : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'
                            }`}
                        >
                            <Layers size={11} />
                            <span>{isAccordionSoloMode ? 'Solo Accordions' : 'Free Expand'}</span>
                        </button>

                        {/* Looping Mode Toggle */}
                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1">
                            <button
                                onClick={() => {
                                    setCurrentExp(prev => ({ ...prev, loopMode: 'CONTINUOUS' }));
                                    setHasUnsavedChanges(true);
                                }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                    currentExp.loopMode === 'CONTINUOUS'
                                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-[0_0_8px_rgba(20,184,166,0.2)]'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Repeat size={11} />
                                <span>Continuous Loop</span>
                            </button>

                            <button
                                onClick={() => {
                                    setCurrentExp(prev => ({ ...prev, loopMode: 'CYCLE_COUNT' }));
                                    setHasUnsavedChanges(true);
                                }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                    currentExp.loopMode === 'CYCLE_COUNT'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Clock size={11} />
                                <span>Target Cycles</span>
                            </button>

                            {currentExp.loopMode === 'CYCLE_COUNT' && (
                                <div className="flex items-center gap-1 pl-1 pr-1.5 border-l border-white/10">
                                    <input
                                        type="number"
                                        min={1}
                                        max={64}
                                        value={currentExp.targetCycles || 4}
                                        onChange={(e) => {
                                            const val = Math.max(1, Math.min(64, parseInt(e.target.value) || 1));
                                            setCurrentExp(prev => ({ ...prev, targetCycles: val }));
                                            setHasUnsavedChanges(true);
                                        }}
                                        className="w-10 bg-white/5 border border-white/15 rounded px-1 text-center text-white text-xs font-bold"
                                    />
                                    <span className="text-[10px] text-slate-400">cycles</span>
                                </div>
                            )}
                        </div>

                        {/* Summary Badges */}
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                                <strong className="text-white">{currentExp.blocks.length}</strong> Blocks
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                                <strong className="text-teal-400">{totalCycleDuration.toFixed(1)}s</strong> per cycle
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. MAIN WORKSPACE: BLOCKS CARDS */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden md:overflow-x-auto p-3 md:p-5 space-y-3 md:space-y-4 flex flex-col">
                    
                    {/* Desktop Experience Info Card */}
                    <div className="hidden md:flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10 gap-3">
                        <div className="flex-1 min-w-[280px]">
                            <input
                                type="text"
                                value={currentExp.name}
                                onChange={(e) => {
                                    setCurrentExp(prev => ({ ...prev, name: e.target.value }));
                                    setHasUnsavedChanges(true);
                                }}
                                placeholder="Experience Name..."
                                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b focus:border-teal-400/50 pb-0.5"
                            />
                            <input
                                type="text"
                                value={currentExp.description}
                                onChange={(e) => {
                                    setCurrentExp(prev => ({ ...prev, description: e.target.value }));
                                    setHasUnsavedChanges(true);
                                }}
                                placeholder="Description / therapeutic notes..."
                                className="w-full bg-transparent text-xs text-slate-400 focus:outline-none focus:border-b focus:border-white/20 pt-1"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 font-medium">Tuning Pitch:</span>
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                                {currentExp.pitchRef || currentPitch || 432.0} Hz
                            </span>

                            <span className="text-xs text-slate-400 font-medium ml-2">Temperament:</span>
                            <span className="text-xs font-mono text-teal-300 bg-teal-500/10 border border-teal-500/25 px-2 py-0.5 rounded uppercase">
                                {(currentExp.temperament || currentTemperament || 'JUST_INTONATION').replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Mobile Phase Navigation Bar & Mode Switcher */}
                    <div className="md:hidden flex flex-col gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-white/10 shrink-0">
                        <div className="flex items-center justify-between gap-2">
                            {/* Previous / Next Phase Quick Stepper */}
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={effectiveMobileIdx <= 0}
                                    onClick={() => setMobileFocusedIdx(prev => Math.max(0, prev - 1))}
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none active:bg-white/15"
                                    title="Previous Phase"
                                >
                                    <ArrowLeft size={14} />
                                </button>
                                <span className="text-xs font-mono font-bold text-white px-1">
                                    Phase {effectiveMobileIdx + 1} <span className="text-slate-500 font-normal">/ {currentExp.blocks.length}</span>
                                </span>
                                <button
                                    type="button"
                                    disabled={effectiveMobileIdx >= currentExp.blocks.length - 1}
                                    onClick={() => setMobileFocusedIdx(prev => Math.min(currentExp.blocks.length - 1, prev + 1))}
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none active:bg-white/15"
                                    title="Next Phase"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>

                            {/* View Mode Toggle: Focus vs List */}
                            <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-lg p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setMobileViewMode('FOCUS')}
                                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                        mobileViewMode === 'FOCUS'
                                            ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    Single Phase
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMobileViewMode('LIST')}
                                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                        mobileViewMode === 'LIST'
                                            ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    All Phases ({currentExp.blocks.length})
                                </button>
                            </div>
                        </div>

                        {/* Phase Selector Pills Strip */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            {currentExp.blocks.map((b, bIdx) => {
                                const isSelected = effectiveMobileIdx === bIdx;
                                const isPlayingThis = isCurrentPlaying && activeBlockIndex === bIdx;
                                const phaseColor = 
                                    b.breathPhase === 'INHALE' ? '#10b981' :
                                    b.breathPhase === 'HOLD_IN' ? '#f59e0b' :
                                    b.breathPhase === 'EXHALE' ? '#a855f7' :
                                    b.breathPhase === 'HOLD_OUT' ? '#3b82f6' : '#06b6d4';

                                return (
                                    <button
                                        key={b.id || bIdx}
                                        type="button"
                                        onClick={() => {
                                            setMobileFocusedIdx(bIdx);
                                            if (isCurrentPlaying && onJumpToBlock) {
                                                onJumpToBlock(bIdx);
                                            }
                                        }}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 border ${
                                            isPlayingThis
                                                ? 'bg-teal-500/20 text-teal-200 border-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                                                : isSelected
                                                ? 'bg-white/15 text-white border-white/30'
                                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                                        }`}
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: phaseColor }}
                                        />
                                        <span>#{bIdx + 1}</span>
                                        <span className="text-[10px] text-slate-400">{b.durationSeconds}s</span>
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                onClick={handleAddBlock}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/30 shrink-0 active:bg-teal-500/20"
                                title="Add Phase"
                            >
                                <Plus size={12} />
                                <span>Add</span>
                            </button>
                        </div>
                    </div>

                    {/* Blocks Scroller / Layout Container */}
                    <div className="flex flex-col md:flex-row md:items-start md:gap-4 md:pb-4 md:min-h-[480px] w-full">
                        {(currentExp?.blocks || []).map((block, idx) => {
                            const isBlockActive = isCurrentPlaying && activeBlockIndex === idx;
                            const isMobileHidden = mobileViewMode === 'FOCUS' && effectiveMobileIdx !== idx;

                            return (
                                <div
                                    key={block.id || idx}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    className={`relative ${isMobileHidden ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[420px] lg:w-[460px] shrink-0 rounded-2xl border transition-all duration-200 shadow-xl overflow-hidden mb-3 md:mb-0 ${
                                        isBlockActive
                                            ? 'bg-slate-900 border-teal-400/80 shadow-[0_0_24px_rgba(20,184,166,0.3)] ring-1 ring-teal-400'
                                            : 'bg-zinc-900/90 border-white/10 hover:border-white/25'
                                    } ${draggedBlockIdx === idx ? 'opacity-30 scale-95 border-dashed border-teal-400' : ''} ${
                                        dragOverBlockIdx === idx && draggedBlockIdx !== idx ? 'ring-2 ring-teal-400 border-teal-300 scale-[1.02]' : ''
                                    }`}
                                >
                                    {/* Active Playing Banner across top of card */}
                                    {isBlockActive && (
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-400 z-10">
                                            <div 
                                                className="h-full bg-white transition-all duration-100 ease-linear"
                                                style={{ width: `${Math.round(blockProgress * 100)}%` }}
                                            />
                                        </div>
                                    )}

                                    {/* Card Header */}
                                    <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-white/[0.02]">
                                        <div className="flex items-center gap-1.5 flex-1 mr-2 min-w-0">
                                            {/* Drag Handle */}
                                            <div 
                                                title="Drag phase to reorder" 
                                                className="cursor-grab active:cursor-grabbing p-0.5 text-slate-500 hover:text-teal-300 transition-colors shrink-0"
                                            >
                                                <GripVertical size={14} />
                                            </div>

                                            <span className={`w-7 h-7 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                                                isBlockActive ? 'bg-teal-400 text-black border-teal-300' : 'bg-white/10 text-white border-white/20'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={block.label || `Phase ${idx + 1}`}
                                                onChange={(e) => updateBlock(idx, { label: e.target.value })}
                                                className="bg-transparent text-sm md:text-xs font-bold text-white focus:outline-none focus:border-b focus:border-teal-400 w-full"
                                            />
                                        </div>

                                        {/* Card Reordering & Tools with mobile friendly touch targets */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            {/* Audition Button (Play/Stop Toggle) */}
                                            <button
                                                type="button"
                                                onClick={() => handleAuditionBlockAudio(block)}
                                                title={auditioningBlockId === block.id ? "Stop audition audio" : "Audition acoustic frequencies"}
                                                className={`p-1.5 md:p-1 rounded transition-all min-w-[32px] min-h-[32px] flex items-center justify-center ${
                                                    auditioningBlockId === block.id
                                                        ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
                                                        : 'text-slate-400 hover:text-teal-300 hover:bg-teal-500/10'
                                                }`}
                                            >
                                                {auditioningBlockId === block.id ? (
                                                    <Square size={13} className="fill-current text-slate-950" />
                                                ) : (
                                                    <Volume2 size={15} />
                                                )}
                                            </button>

                                            {/* Reorder Left / Up */}
                                            <button
                                                disabled={idx === 0}
                                                onClick={() => handleMoveBlock(idx, -1)}
                                                title="Move left"
                                                className="p-1.5 md:p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 min-w-[32px] min-h-[32px] flex items-center justify-center"
                                            >
                                                <ArrowLeft size={15} />
                                            </button>

                                            {/* Reorder Right / Down */}
                                            <button
                                                disabled={idx === (currentExp?.blocks || []).length - 1}
                                                onClick={() => handleMoveBlock(idx, 1)}
                                                title="Move right"
                                                className="p-1.5 md:p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 min-w-[32px] min-h-[32px] flex items-center justify-center"
                                            >
                                                <ArrowRight size={15} />
                                            </button>

                                            {/* Duplicate Phase */}
                                            <button
                                                onClick={() => handleDuplicateBlock(idx)}
                                                title="Duplicate Phase"
                                                className="p-1.5 md:p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all min-w-[32px] min-h-[32px] flex items-center justify-center"
                                            >
                                                <Copy size={15} />
                                            </button>

                                            {/* Delete Phase */}
                                            <button
                                                disabled={(currentExp?.blocks || []).length <= 1}
                                                onClick={() => handleDeleteBlock(idx)}
                                                title="Delete Phase"
                                                className="p-1.5 md:p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-20 min-w-[32px] min-h-[32px] flex items-center justify-center"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* ALL PHASE LAYERS AS COLLAPSIBLE ACCORDIONS */}
                                    <div className="p-2.5 sm:p-3 space-y-2 md:overflow-y-auto md:max-h-[640px]">
                                        {/* 1. Acoustic Sound Layer Accordion */}
                                        <PhaseAcousticAccordion
                                            block={block}
                                            blockIndex={idx}
                                            updateBlock={updateBlock}
                                            basePitch={currentExp.pitchRef || currentPitch || 432}
                                            temperament={currentExp.temperament || currentTemperament || 'JUST_INTONATION'}
                                            isAuditioning={auditioningBlockId === block.id}
                                            onAudition={() => handleAuditionBlockAudio(block)}
                                            onOpenTuningMenu={() => setIsTuningMenuOpen(true)}
                                            isOpen={isAccordionOpen(block.id, 'ACOUSTIC', true)}
                                            onToggleOpen={() => handleToggleAccordion(block.id, 'ACOUSTIC')}
                                        />

                                        {/* 2. Breath Kinetic Layer Accordion */}
                                        <PhaseBreathAccordion
                                            block={block}
                                            blockIndex={idx}
                                            updateBlock={updateBlock}
                                            isOpen={isAccordionOpen(block.id, 'BREATH', false)}
                                            onToggleOpen={() => handleToggleAccordion(block.id, 'BREATH')}
                                        />

                                        {/* 3. Neural Entrainment Layer Accordion */}
                                        <PhaseEntrainmentAccordion
                                            config={block.entrainment}
                                            onChange={(cfg) => updateBlock(idx, { entrainment: cfg })}
                                            globalFreq={globalEntrainmentFreq}
                                            globalLayers={globalEntrainmentLayers}
                                            isOpen={isAccordionOpen(block.id, 'ENTRAINMENT', false)}
                                            onToggleOpen={() => handleToggleAccordion(block.id, 'ENTRAINMENT')}
                                        />

                                        {/* 4. Sentics Emotion Wave Layer Accordion */}
                                        <PhaseSenticsAccordion
                                            config={block.sentics}
                                            onChange={(cfg) => updateBlock(idx, { sentics: cfg })}
                                            globalEmotion={globalSenticEmotion}
                                            isOpen={isAccordionOpen(block.id, 'SENTICS', false)}
                                            onToggleOpen={() => handleToggleAccordion(block.id, 'SENTICS')}
                                        />

                                        {/* 5. Heart & Pulse Sync Layer Accordion */}
                                        <PhaseHeartAccordion
                                            config={block.heart}
                                            onChange={(cfg) => updateBlock(idx, { heart: cfg })}
                                            globalSyncMode={globalHeartSyncMode}
                                            globalBpm={globalBpm}
                                            isOpen={isAccordionOpen(block.id, 'HEART', false)}
                                            onToggleOpen={() => handleToggleAccordion(block.id, 'HEART')}
                                        />

                                        {/* 6. Matrix Warp & Time Crystal Layer Accordion */}
                                        <PhaseMatrixCrystalAccordion
                                            matrixConfig={block.matrix}
                                            crystalConfig={block.crystal}
                                            onMatrixChange={(cfg) => updateBlock(idx, { matrix: cfg })}
                                            onCrystalChange={(cfg) => updateBlock(idx, { crystal: cfg })}
                                            globalWarp={globalComposerWarp}
                                            globalCrystalTopology={globalTimeCrystalTopology}
                                            globalCrystalEnabled={globalTimeCrystalEnabled}
                                            isOpen={isAccordionOpen(block.id, 'MATRIX', false)}
                                            onToggleOpen={() => handleToggleAccordion(block.id, 'MATRIX')}
                                        />

                                        {/* 7. Retinal Visual Pulse Layer Accordion */}
                                        <PhasePulseAccordion
                                            config={block.pulse}
                                            onChange={(cfg) => updateBlock(idx, { pulse: cfg })}
                                            globalPulseStyle={globalPulseStyle}
                                            isOpen={isAccordionOpen(block.id, 'PULSE', false)}
                                            onToggleOpen={() => handleToggleAccordion(block.id, 'PULSE')}
                                        />
                                    </div>
                                    {/* Mobile Focus Navigation Stepper Footer */}
                                    {mobileViewMode === 'FOCUS' && (
                                        <div className="md:hidden flex items-center justify-between p-3 border-t border-white/10 bg-black/50">
                                            <button
                                                disabled={effectiveMobileIdx === 0}
                                                onClick={() => setMobileFocusedIdx(Math.max(0, effectiveMobileIdx - 1))}
                                                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-white/5 text-slate-300 border border-white/10 disabled:opacity-30 disabled:pointer-events-none active:bg-white/15 min-h-[38px]"
                                            >
                                                <ChevronLeft size={16} />
                                                <span>Prev Phase</span>
                                            </button>

                                            {/* Dots Indicator */}
                                            <div className="flex items-center gap-1.5">
                                                {(currentExp?.blocks || []).map((_, dotIdx) => (
                                                    <button
                                                        key={dotIdx}
                                                        onClick={() => setMobileFocusedIdx(dotIdx)}
                                                        className={`h-2.5 rounded-full transition-all ${
                                                            effectiveMobileIdx === dotIdx
                                                                ? 'bg-teal-400 w-5'
                                                                : isCurrentPlaying && activeBlockIndex === dotIdx
                                                                    ? 'bg-amber-400 w-2.5 animate-pulse'
                                                                    : 'bg-white/20 w-2.5'
                                                        }`}
                                                        aria-label={`Go to phase ${dotIdx + 1}`}
                                                    />
                                                ))}
                                            </div>

                                            {effectiveMobileIdx < (currentExp?.blocks || []).length - 1 ? (
                                                <button
                                                    onClick={() => setMobileFocusedIdx(Math.min(totalBlocks - 1, effectiveMobileIdx + 1))}
                                                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 active:bg-teal-500/30 min-h-[38px]"
                                                >
                                                    <span>Next Phase</span>
                                                    <ChevronRight size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleAddBlock}
                                                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-teal-500 text-black active:bg-teal-400 min-h-[38px]"
                                                >
                                                    <Plus size={14} />
                                                    <span>Add Phase</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add Block Button Card for Desktop */}
                        <div className="hidden md:flex w-[180px] shrink-0 h-[440px] rounded-2xl border-2 border-dashed border-white/15 hover:border-teal-400/50 flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer transition-all bg-white/[0.01] hover:bg-teal-500/5 group"
                            onClick={handleAddBlock}
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/15 group-hover:border-teal-400/60 group-hover:bg-teal-500/20 text-slate-400 group-hover:text-teal-300 flex items-center justify-center transition-all">
                                <Plus size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-300 group-hover:text-white uppercase tracking-wider">Add Block</span>
                            <span className="text-[10px] text-slate-400 leading-tight">Append chord or pure tone with breath timer</span>
                        </div>

                        {/* Add Block Button for Mobile (when in LIST view) */}
                        {mobileViewMode === 'LIST' && (
                            <button
                                onClick={handleAddBlock}
                                className="md:hidden w-full py-3.5 rounded-2xl border-2 border-dashed border-white/20 active:border-teal-400/60 active:bg-teal-500/10 flex items-center justify-center gap-2 text-slate-300 active:text-white font-bold text-xs uppercase tracking-wider min-h-[44px]"
                            >
                                <Plus size={16} className="text-teal-400" />
                                <span>Add New Phase Block</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 4. UNIFIED BIRDS-EYE EXPERIENCE TIMELINE & SIDESCROLL (CLEAN, SPACIOUS, DESIGNER-CRAFTED) */}
                <div className="w-full bg-slate-950/95 border-t border-white/10 px-3 md:px-5 py-2.5 shrink-0 flex flex-col gap-2 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
                    {/* Top Status & Sequence Metrics Header */}
                    <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                isCurrentPlaying && !isPaused ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' :
                                isCurrentPlaying && isPaused ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-600'
                            }`} />
                            
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-white uppercase tracking-wider text-[11px] whitespace-nowrap">
                                    {isCurrentPlaying ? (
                                        currentExp.blocks[activeBlockIndex]?.breathPhase === 'INHALE' ? '🫁 Inhale Phase' :
                                        currentExp.blocks[activeBlockIndex]?.breathPhase === 'HOLD_IN' ? '⏸️ Apex Hold' :
                                        currentExp.blocks[activeBlockIndex]?.breathPhase === 'EXHALE' ? '🌬️ Exhale Phase' :
                                        currentExp.blocks[activeBlockIndex]?.breathPhase === 'HOLD_OUT' ? '⏹️ Nadir Rest' : '🌊 Breath Flow'
                                    ) : (
                                        'Sequence Timeline'
                                    )}
                                </span>
                                {isCurrentPlaying && (
                                    <span className="text-teal-300 font-bold text-[11px] shrink-0">
                                        · {((currentExp.blocks[activeBlockIndex]?.durationSeconds || 4) * (1 - blockProgress)).toFixed(1)}s left
                                    </span>
                                )}
                                {isCurrentPlaying && isPaused && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                                        PAUSED
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right Info Badges & Sequence Meta */}
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-[10px] sm:text-[11px] shrink-0 font-mono">
                            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300">
                                Phase {isCurrentPlaying ? activeBlockIndex + 1 : effectiveMobileIdx + 1} of {currentExp.blocks.length}
                            </span>
                            {currentExp?.loopMode === 'CYCLE_COUNT' && isCurrentPlaying && (
                                <span className="bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded text-amber-300 font-bold">
                                    Cycle {currentCycle}/{totalCycles}
                                </span>
                            )}
                            <span className="hidden sm:inline-block text-slate-500">· {totalCycleDuration.toFixed(1)}s total</span>
                            {isCurrentPlaying && (
                                <button
                                    onClick={() => onJumpToBlock && onJumpToBlock(0)}
                                    title="Restart sequence from Phase 1"
                                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all flex items-center justify-center ml-1"
                                >
                                    <RotateCcw size={11} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Birds-Eye Sidescroll Track of all Experience Elements */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
                        {(currentExp?.blocks || []).map((b, idx) => {
                            const isCurrent = isCurrentPlaying && activeBlockIndex === idx;
                            const isPast = isCurrentPlaying && idx < activeBlockIndex;
                            const isFocused = !isCurrentPlaying && effectiveMobileIdx === idx;
                            const color = 
                                b.breathPhase === 'INHALE' ? '#10b981' :
                                b.breathPhase === 'HOLD_IN' ? '#f59e0b' :
                                b.breathPhase === 'EXHALE' ? '#a855f7' :
                                b.breathPhase === 'HOLD_OUT' ? '#3b82f6' : '#06b6d4';

                            const soundDesc = b.soundType === 'CHORD'
                                ? (b.chord?.customNotes && b.chord.customNotes.length > 0
                                    ? b.chord.name || `${b.chord.customNotes.length} Notes`
                                    : `${b.chord?.root || 'C'}${b.chord?.type || 'maj7'}`)
                                : b.soundType === 'PURE_TONE'
                                ? `${Math.round(b.pureToneHz || 432)} Hz`
                                : 'Stack';

                            return (
                                <div
                                    key={b.id || idx}
                                    onClick={() => {
                                        if (isCurrentPlaying && onJumpToBlock) {
                                            onJumpToBlock(idx);
                                        }
                                        setMobileFocusedIdx(idx);
                                    }}
                                    className={`relative min-w-[180px] sm:min-w-[210px] flex-1 max-w-[280px] rounded-xl p-2.5 border transition-all cursor-pointer overflow-hidden select-none shrink-0 ${
                                        isCurrent
                                            ? 'border-teal-400 bg-slate-900/95 shadow-[0_0_14px_rgba(20,184,166,0.35)] ring-1 ring-teal-400/50'
                                            : isFocused
                                            ? 'border-teal-500/60 bg-slate-900/90 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                                            : isPast
                                            ? 'border-white/10 bg-slate-950/70 opacity-75 hover:opacity-95'
                                            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] opacity-60 hover:opacity-90'
                                    }`}
                                >
                                    {/* Real-time Dynamic Progress Fill Bar */}
                                    <div
                                        className="absolute inset-y-0 left-0 transition-all duration-75 pointer-events-none"
                                        style={{
                                            width: isPast ? '100%' : (isCurrent ? `${Math.min(100, Math.max(0, blockProgress * 100))}%` : '0%'),
                                            backgroundColor: color,
                                            opacity: isCurrent ? 0.25 : (isPast ? 0.12 : 0)
                                        }}
                                    />

                                    <div className="relative z-10 flex flex-col gap-1">
                                        {/* Top Line: Phase Index Badge & Duration */}
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                                isCurrent ? 'bg-teal-400 text-black' : 'bg-white/10 text-slate-300'
                                            }`}>
                                                #{idx + 1}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                {b.durationSeconds}s
                                            </span>
                                        </div>

                                        {/* Middle: Breath Phase with Color Pill */}
                                        <div className="flex items-center gap-1.5 pt-0.5">
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: color, boxShadow: isCurrent ? `0 0 6px ${color}` : 'none' }}
                                            />
                                            <span className="text-xs font-bold text-white whitespace-nowrap">
                                                {b.label || (
                                                    b.breathPhase === 'INHALE' ? 'Inhale' :
                                                    b.breathPhase === 'HOLD_IN' ? 'Hold In' :
                                                    b.breathPhase === 'EXHALE' ? 'Exhale' : 'Hold Out'
                                                )}
                                            </span>
                                        </div>

                                        {/* Bottom: Sound signature & glide */}
                                        <div className="text-[10px] font-mono text-teal-300/90 flex items-center justify-between pt-0.5 gap-1">
                                            <span className="whitespace-nowrap font-medium">{soundDesc}</span>
                                            {b.glideSeconds ? <span className="text-[9px] text-slate-500 font-normal shrink-0">{b.glideSeconds}s glide</span> : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 5. STICKY MOBILE ACTION BAR (Fixed at modal bottom for continuous access on mobile/tablet) */}
                <div className="md:hidden sticky bottom-0 left-0 right-0 p-2.5 bg-slate-950/95 border-t border-white/10 backdrop-blur-xl z-30 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-white/10 text-teal-300 shrink-0">
                            {isCurrentPlaying ? `Phase ${activeBlockIndex + 1}/${(currentExp.blocks || []).length}` : `${(currentExp.blocks || []).length} phases`}
                        </span>
                        {isCurrentPlaying && (
                            <span className="text-[10px] font-mono text-amber-300 truncate">
                                Cyc {currentCycle}/{currentExp.loopMode === 'CYCLE_COUNT' ? (currentExp.targetCycles || 4) : '∞'}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Master Transport Controls */}
                        <MasterTransportControls
                            status={masterStatus ?? (isCurrentPlaying ? (isPaused ? 'PAUSED' : 'PLAYING') : 'IDLE')}
                            onPlayPause={() => {
                                if (masterStatus === 'IDLE' && !isCurrentPlaying) {
                                    handleTriggerPlay(false);
                                } else if (onMasterPlayPause) {
                                    onMasterPlayPause();
                                } else {
                                    handleTriggerPlay(false);
                                }
                            }}
                            onStop={() => {
                                if (onMasterStop) onMasterStop();
                                else onStopExperience();
                            }}
                            onClear={() => {
                                if (onMasterClear) onMasterClear();
                                else onStopExperience();
                            }}
                            variant="modal"
                        />

                        {/* Play & Immerse */}
                        <button
                            onClick={() => handleTriggerPlay(true)}
                            title="Play and auto-enter fullscreen visualizer"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-black text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        >
                            <Maximize size={12} className="stroke-[2.5]" />
                            <span>Immerse</span>
                        </button>
                    </div>
                </div>

                {/* Tuning Architect Modal Overlay (Inspired by Music Mode Menu) */}
                {isTuningMenuOpen && (
                    <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <TuningArchitectPanel
                                currentPitch={currentExp.pitchRef || currentPitch || 432}
                                currentTemperament={currentExp.temperament || currentTemperament || 'JUST_INTONATION'}
                                onPitchChange={(p) => {
                                    setCurrentExp(prev => ({ ...prev, pitchRef: p }));
                                    onPitchChange?.(p);
                                    setHasUnsavedChanges(true);
                                }}
                                onTemperamentChange={(t) => {
                                    setCurrentExp(prev => ({ ...prev, temperament: t }));
                                    onTemperamentChange?.(t);
                                    setHasUnsavedChanges(true);
                                }}
                                onClose={() => setIsTuningMenuOpen(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
