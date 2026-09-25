import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Plus, Trash2, ArrowLeft, ArrowRight, Copy, Play, Square, 
    Save, Sparkles, Check, Music, Sliders, RotateCcw, Volume2
} from 'lucide-react';
import { 
    ChordDef, 
    ProgressionDef, 
    MusicalMood, 
    MOOD_CATEGORIES, 
    CHORD_TYPE_OPTIONS, 
    NOTE_NAMES,
    getChordFrequencies,
    addOrUpdateCustomProgression,
    deleteCustomProgression,
    loadCustomProgressions
} from '../../services/audio/chordProgressions';
import { TuningTemperament, TEMPERAMENTS } from './visuals/shared';

interface ProgressionDesignerProps {
    currentProgression?: ProgressionDef;
    onSaveAndActivate: (progression: ProgressionDef) => void;
    onPlaySingleChord?: (chord: ChordDef) => void;
    onCustomProgressionsChange?: () => void;
    currentPitch: number;
    currentTemperament: TuningTemperament;
}

const TEMPLATES: Array<{
    name: string;
    mood: MusicalMood;
    description: string;
    temperament: TuningTemperament;
    pitch: number;
    chords: ChordDef[];
}> = [
    {
        name: 'Major 7th Dream',
        mood: 'SERENITY',
        description: 'Warm, airy modal drift with expansive major seventh chords.',
        temperament: 'JUST_INTONATION',
        pitch: 432.0,
        chords: [
            { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
            { name: 'Fmaj7', root: 'F', type: 'maj7', octave: 3 },
            { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
            { name: 'Gsus4', root: 'G', type: 'sus4', octave: 3 }
        ]
    },
    {
        name: 'Neo-Soul Ambient 2-5-1',
        mood: 'MELANCHOLY',
        description: 'Rich jazz ninths and eleventh suspensions with smooth voice-leading.',
        temperament: 'VALLOTTI',
        pitch: 432.0,
        chords: [
            { name: 'Dm9', root: 'D', type: 'min9', octave: 3 },
            { name: 'G7sus4', root: 'G', type: '7sus4', octave: 3 },
            { name: 'Cmaj9', root: 'C', type: 'maj9', octave: 3 },
            { name: 'Am7', root: 'A', type: 'min7', octave: 3 }
        ]
    },
    {
        name: 'Lydian Star Flight',
        mood: 'MYSTIC',
        description: 'Raised fourth brightness creating weightless hovering feeling.',
        temperament: 'PYTHAGOREAN',
        pitch: 430.54,
        chords: [
            { name: 'Cmaj7#11', root: 'C', type: 'maj7#11', octave: 3 },
            { name: 'D', root: 'D', type: 'maj', octave: 3 },
            { name: 'Em9', root: 'E', type: 'min9', octave: 3 },
            { name: 'Bm7', root: 'B', type: 'min7', octave: 3 }
        ]
    },
    {
        name: 'Prana Solar Lift',
        mood: 'EUPHORIA',
        description: 'Uplifting major triads inspiring deep breath and heart coherence.',
        temperament: '12TET',
        pitch: 444.0,
        chords: [
            { name: 'D', root: 'D', type: 'maj', octave: 3 },
            { name: 'Aadd9', root: 'A', type: 'add9', octave: 3 },
            { name: 'Bm7', root: 'B', type: 'min7', octave: 3 },
            { name: 'Gadd9', root: 'G', type: 'add9', octave: 3 }
        ]
    },
    {
        name: 'Terra Fifths (Drone)',
        mood: 'GROUNDING',
        description: 'Pure acoustic open fifths removing dissonance for somatic settling.',
        temperament: 'PYTHAGOREAN',
        pitch: 432.0,
        chords: [
            { name: 'C5', root: 'C', type: '5', octave: 3 },
            { name: 'G5', root: 'G', type: '5', octave: 3 },
            { name: 'F5', root: 'F', type: '5', octave: 3 },
            { name: 'C5', root: 'C', type: '5', octave: 3 }
        ]
    },
    {
        name: 'Aetheric Open Crown',
        mood: 'TRANSCENDENCE',
        description: 'Spacious suspended 2nds and 4ths dissolving bodily tension.',
        temperament: 'JUST_INTONATION',
        pitch: 432.0,
        chords: [
            { name: 'Fsus2', root: 'F', type: 'sus2', octave: 3 },
            { name: 'C', root: 'C', type: 'maj', octave: 3 },
            { name: 'Gsus4', root: 'G', type: 'sus4', octave: 3 },
            { name: 'Am7', root: 'A', type: 'min7', octave: 3 }
        ]
    },
    {
        name: "Neo-Soul 8-Bar Velvet (D'Angelo)",
        mood: 'NEO_SOUL',
        description: '8-chord lush Rhodes progression with 13ths, 11ths, and altered dominants.',
        temperament: 'VALLOTTI',
        pitch: 432.0,
        chords: [
            { name: 'F#m9', root: 'F#', type: 'min9', octave: 3 },
            { name: 'B13', root: 'B', type: '13', octave: 3 },
            { name: 'Emaj9', root: 'E', type: 'maj9', octave: 3 },
            { name: 'C#m9', root: 'C#', type: 'min9', octave: 3 },
            { name: 'F#m11', root: 'F#', type: 'min11', octave: 3 },
            { name: 'G#m7', root: 'G#', type: 'min7', octave: 3 },
            { name: 'Amaj9', root: 'A', type: 'maj9', octave: 3 },
            { name: 'G#7#9', root: 'G#', type: '7#9', octave: 3 }
        ]
    },
    {
        name: 'Gospel 8-Chord Turnaround (7-3-6-2-5-1)',
        mood: 'GOSPEL',
        description: 'Anointed church cadence with diminished/altered tensions resolving into lush major 9th.',
        temperament: 'VALLOTTI',
        pitch: 432.0,
        chords: [
            { name: 'Fmaj9', root: 'F', type: 'maj9', octave: 3 },
            { name: 'Em7b5', root: 'E', type: 'm7b5', octave: 3 },
            { name: 'A7#9', root: 'A', type: '7#9', octave: 3 },
            { name: 'Dm9', root: 'D', type: 'min9', octave: 3 },
            { name: 'G7', root: 'G', type: '7', octave: 3 },
            { name: 'Gm7', root: 'G', type: 'min7', octave: 3 },
            { name: 'C7sus4', root: 'C', type: '7sus4', octave: 3 },
            { name: 'Fmaj9', root: 'F', type: 'maj9', octave: 3 }
        ]
    }
];

export const ProgressionDesigner: React.FC<ProgressionDesignerProps> = ({
    currentProgression,
    onSaveAndActivate,
    onPlaySingleChord,
    onCustomProgressionsChange,
    currentPitch: _currentPitch,
    currentTemperament: _currentTemperament
}) => {
    // Designer state
    const [progName, setProgName] = useState<string>('My Custom Progression');
    const [progMood, setProgMood] = useState<MusicalMood>('SERENITY');
    const [progDesc, setProgDesc] = useState<string>('Created in Progression Designer');
    const [progTemperament, setProgTemperament] = useState<TuningTemperament>('JUST_INTONATION');
    const [progPitch, setProgPitch] = useState<number>(432.0);
    const [editingProgId, setEditingProgId] = useState<string | null>(null);

    const [chords, setChords] = useState<ChordDef[]>([
        { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
        { name: 'Fmaj7', root: 'F', type: 'maj7', octave: 3 },
        { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
        { name: 'Gsus4', root: 'G', type: 'sus4', octave: 3 }
    ]);

    const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0);
    const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
    const [auditionStep, setAuditionStep] = useState<number>(0);
    const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
    const [savedCustomList, setSavedCustomList] = useState<ProgressionDef[]>([]);

    const auditionTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Refresh custom list
    useEffect(() => {
        setSavedCustomList(loadCustomProgressions());
    }, []);

    const showToast = (msg: string) => {
        setFeedbackToast(msg);
        setTimeout(() => setFeedbackToast(null), 3000);
    };

    // Load template
    const handleLoadTemplate = (tpl: typeof TEMPLATES[0]) => {
        setProgName(tpl.name);
        setProgMood(tpl.mood);
        setProgDesc(tpl.description);
        setProgTemperament(tpl.temperament);
        setProgPitch(tpl.pitch);
        setChords(tpl.chords.map(c => ({ ...c })));
        setSelectedStepIdx(0);
        setEditingProgId(null);
        showToast(`Loaded "${tpl.name}" template`);
    };

    // Clone currently active progression
    const handleCloneActive = () => {
        if (!currentProgression) return;
        setProgName(`${currentProgression.name} (Custom)`);
        setProgMood(currentProgression.mood);
        setProgDesc(currentProgression.description || 'Customized from built-in progression');
        setProgTemperament(currentProgression.recommendedTemperament);
        setProgPitch(currentProgression.recommendedPitch);
        setChords(currentProgression.chords.map(c => ({ ...c })));
        setSelectedStepIdx(0);
        setEditingProgId(null);
        showToast(`Cloned "${currentProgression.name}" into Designer`);
    };

    // Load existing custom progression for re-editing
    const handleEditCustom = (prog: ProgressionDef) => {
        setProgName(prog.name);
        setProgMood(prog.mood);
        setProgDesc(prog.description);
        setProgTemperament(prog.recommendedTemperament);
        setProgPitch(prog.recommendedPitch);
        setChords(prog.chords.map(c => ({ ...c })));
        setSelectedStepIdx(0);
        setEditingProgId(prog.id);
        showToast(`Editing custom "${prog.name}"`);
    };

    const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = deleteCustomProgression(id);
        setSavedCustomList(updated);
        onCustomProgressionsChange?.();
        if (editingProgId === id) {
            setEditingProgId(null);
        }
        showToast('Custom progression removed');
    };

    // Current selected chord
    const selectedChord = chords[selectedStepIdx] || chords[0];

    // Helper to format chord name automatically
    const getChordDisplayName = (root: string, type: string): string => {
        if (type === 'maj') return root;
        if (type === 'min') return `${root}m`;
        return `${root}${type}`;
    };

    // Update selected chord root
    const handleUpdateRoot = (newRoot: string) => {
        setChords(prev => {
            const next = [...prev];
            const current = next[selectedStepIdx];
            const newName = getChordDisplayName(newRoot, current.type);
            next[selectedStepIdx] = { ...current, root: newRoot, name: newName };
            return next;
        });
        if (onPlaySingleChord && selectedChord) {
            onPlaySingleChord({
                ...selectedChord,
                root: newRoot,
                name: getChordDisplayName(newRoot, selectedChord.type)
            });
        }
    };

    // Update selected chord type
    const handleUpdateType = (newType: string) => {
        setChords(prev => {
            const next = [...prev];
            const current = next[selectedStepIdx];
            const newName = getChordDisplayName(current.root, newType);
            next[selectedStepIdx] = { ...current, type: newType, name: newName };
            return next;
        });
        if (onPlaySingleChord && selectedChord) {
            onPlaySingleChord({
                ...selectedChord,
                type: newType,
                name: getChordDisplayName(selectedChord.root, newType)
            });
        }
    };

    // Update octave
    const handleUpdateOctave = (oct: number) => {
        setChords(prev => {
            const next = [...prev];
            next[selectedStepIdx] = { ...next[selectedStepIdx], octave: oct };
            return next;
        });
    };

    // Add step
    const handleAddStep = () => {
        if (chords.length >= 12) {
            showToast('Max 12 chords per progression');
            return;
        }
        // Clone last chord or create gentle next chord
        const last = chords[chords.length - 1];
        const nextChord: ChordDef = {
            name: last ? last.name : 'Cmaj7',
            root: last ? last.root : 'C',
            type: last ? last.type : 'maj7',
            octave: last ? (last.octave || 3) : 3
        };
        setChords(prev => [...prev, nextChord]);
        setSelectedStepIdx(chords.length);
    };

    // Duplicate step
    const handleDuplicateStep = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (chords.length >= 12) return;
        const target = chords[idx];
        setChords(prev => {
            const next = [...prev];
            next.splice(idx + 1, 0, { ...target });
            return next;
        });
        setSelectedStepIdx(idx + 1);
    };

    // Delete step
    const handleDeleteStep = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (chords.length <= 1) {
            showToast('A progression requires at least 1 chord');
            return;
        }
        setChords(prev => prev.filter((_, i) => i !== idx));
        setSelectedStepIdx(prev => Math.max(0, Math.min(prev, chords.length - 2)));
    };

    // Move step left
    const handleMoveStep = (idx: number, dir: -1 | 1, e: React.MouseEvent) => {
        e.stopPropagation();
        const targetIdx = idx + dir;
        if (targetIdx < 0 || targetIdx >= chords.length) return;
        setChords(prev => {
            const next = [...prev];
            const temp = next[idx];
            next[idx] = next[targetIdx];
            next[targetIdx] = temp;
            return next;
        });
        setSelectedStepIdx(targetIdx);
    };

    // Play single chord audition
    const handleAuditionSelected = () => {
        if (onPlaySingleChord && selectedChord) {
            onPlaySingleChord(selectedChord);
        }
    };

    // Stop audition loop
    const stopAuditionLoop = () => {
        if (auditionTimerRef.current) {
            clearInterval(auditionTimerRef.current);
            auditionTimerRef.current = null;
        }
        setIsAuditioning(false);
    };

    // Audition full sequence loop
    const handleToggleAuditionSequence = () => {
        if (isAuditioning) {
            stopAuditionLoop();
            return;
        }
        if (chords.length === 0) return;

        setIsAuditioning(true);
        let step = 0;
        setAuditionStep(0);
        if (onPlaySingleChord) {
            onPlaySingleChord(chords[0]);
        }

        auditionTimerRef.current = setInterval(() => {
            step = (step + 1) % chords.length;
            setAuditionStep(step);
            if (onPlaySingleChord) {
                onPlaySingleChord(chords[step]);
            }
        }, 2200);
    };

    useEffect(() => {
        return () => {
            if (auditionTimerRef.current) {
                clearInterval(auditionTimerRef.current);
            }
        };
    }, []);

    // Build the ProgressionDef object
    const currentBuiltProgression: ProgressionDef = useMemo(() => {
        const id = editingProgId || `custom_${Date.now()}`;
        return {
            id,
            name: progName.trim() || 'Untitled Progression',
            mood: progMood,
            description: progDesc.trim() || 'Custom user crafted harmonic progression',
            recommendedTemperament: progTemperament,
            recommendedPitch: progPitch,
            chords: chords.map(c => ({ ...c })),
            isCustom: true
        };
    }, [editingProgId, progName, progMood, progDesc, progTemperament, progPitch, chords]);

    // Save progression
    const handleSaveProgression = () => {
        stopAuditionLoop();
        const updatedList = addOrUpdateCustomProgression(currentBuiltProgression);
        setSavedCustomList(updatedList);
        setEditingProgId(currentBuiltProgression.id);
        onCustomProgressionsChange?.();
        showToast(`Saved "${currentBuiltProgression.name}" to custom progressions!`);
    };

    // Save and activate immediately
    const handleSaveAndActivate = () => {
        stopAuditionLoop();
        addOrUpdateCustomProgression(currentBuiltProgression);
        setSavedCustomList(loadCustomProgressions());
        onCustomProgressionsChange?.();
        onSaveAndActivate(currentBuiltProgression);
        showToast(`Activated "${currentBuiltProgression.name}" with preferred tuning!`);
    };

    // Resolved frequencies of currently selected chord in designer's chosen tuning & pitch
    const resolvedNotes = useMemo(() => {
        if (!selectedChord) return [];
        const info = getChordFrequencies(selectedChord, progPitch, progTemperament, 0);
        return info.notes;
    }, [selectedChord, progPitch, progTemperament]);

    return (
        <div className="space-y-4">
            {/* Notification Toast */}
            {feedbackToast && (
                <div className="p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-cyan-400 shrink-0" />
                        <span>{feedbackToast}</span>
                    </div>
                </div>
            )}

            {/* Quick Actions & Templates Bar */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-400" />
                        Templates:
                    </span>
                    {TEMPLATES.map(tpl => (
                        <button
                            key={tpl.name}
                            onClick={() => handleLoadTemplate(tpl)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] font-semibold border border-white/10 transition-colors"
                        >
                            {tpl.name}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {currentProgression && (
                        <button
                            onClick={handleCloneActive}
                            className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-[10px] font-bold border border-cyan-500/40 flex items-center gap-1 transition-all"
                            title="Copy active progression into designer"
                        >
                            <Copy size={11} />
                            <span>Clone Active ({currentProgression.name})</span>
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setProgName('New Harmonic Sequence');
                            setChords([
                                { name: 'Cmaj7', root: 'C', type: 'maj7', octave: 3 },
                                { name: 'G', root: 'G', type: 'maj', octave: 3 },
                                { name: 'Am7', root: 'A', type: 'min7', octave: 3 },
                                { name: 'Fmaj7', root: 'F', type: 'maj7', octave: 3 }
                            ]);
                            setSelectedStepIdx(0);
                            setEditingProgId(null);
                            showToast('Started fresh progression');
                        }}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-[10px] font-medium border border-white/10 flex items-center gap-1"
                        title="Reset to default"
                    >
                        <RotateCcw size={11} />
                        <span>Reset</span>
                    </button>
                </div>
            </div>

            {/* Progression Settings Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10 space-y-3.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Sliders size={12} className="text-cyan-400" />
                    Progression Metadata & Preferred Tuning
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Name */}
                    <div className="sm:col-span-4 space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Progression Name</label>
                        <input
                            type="text"
                            value={progName}
                            onChange={e => setProgName(e.target.value)}
                            placeholder="e.g. Lydian Sunrise"
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                        />
                    </div>

                    {/* Mood Category */}
                    <div className="sm:col-span-3 space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Atmosphere / Mood</label>
                        <select
                            value={progMood}
                            onChange={e => setProgMood(e.target.value as MusicalMood)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-400"
                        >
                            {MOOD_CATEGORIES.map(m => (
                                <option key={m.mood} value={m.mood} className="bg-slate-900 text-white">
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Preferred Temperament */}
                    <div className="sm:col-span-3 space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <span>Preferred Tuning</span>
                            <span className="text-[8px] text-cyan-400 font-mono">(Anti-Dissonance)</span>
                        </label>
                        <select
                            value={progTemperament}
                            onChange={e => setProgTemperament(e.target.value as TuningTemperament)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
                        >
                            {TEMPERAMENTS.map(t => (
                                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Preferred Pitch */}
                    <div className="sm:col-span-2 space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pitch Ref</label>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                step="0.1"
                                min="380"
                                max="550"
                                value={progPitch}
                                onChange={e => setProgPitch(parseFloat(e.target.value) || 432)}
                                className="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-cyan-300 font-mono text-center focus:outline-none focus:border-cyan-400"
                            />
                            <span className="text-[10px] text-slate-400 font-mono">Hz</span>
                        </div>
                    </div>
                </div>

                {/* Description input */}
                <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Description / Intention</label>
                    <input
                        type="text"
                        value={progDesc}
                        onChange={e => setProgDesc(e.target.value)}
                        placeholder="e.g. 4-bar relaxing breath cycle with gentle 7ths"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-white/30"
                    />
                </div>
            </div>

            {/* Step Chain / Visual Chord Timeline */}
            <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1.5 truncate">
                            <Music size={12} className="text-amber-400 shrink-0" />
                            <span>Sequence ({chords.length})</span>
                        </div>
                        {isAuditioning && (
                            <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse shrink-0">
                                Step {auditionStep + 1}/{chords.length}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleToggleAuditionSequence}
                            className={`px-2.5 py-1 rounded-lg text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
                                isAuditioning
                                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                    : 'bg-white/10 text-slate-200 hover:text-white border-white/20 hover:bg-white/15'
                            }`}
                        >
                            {isAuditioning ? <Square size={11} className="fill-current" /> : <Play size={11} className="fill-current" />}
                            <span className="sm:hidden">{isAuditioning ? 'Stop' : 'Audition'}</span>
                            <span className="hidden sm:inline">{isAuditioning ? 'Stop Audition' : 'Audition Sequence'}</span>
                        </button>

                        <button
                            onClick={handleAddStep}
                            className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-[9.5px] sm:text-[10px] font-bold border border-cyan-500/40 flex items-center gap-1 transition-all"
                        >
                            <Plus size={12} />
                            <span>Add Chord</span>
                        </button>
                    </div>
                </div>

                {/* Timeline cards */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                    {chords.map((chord, idx) => {
                        const isSelected = idx === selectedStepIdx;
                        const isCurrentPlaying = isAuditioning && auditionStep === idx;
                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedStepIdx(idx)}
                                className={`shrink-0 p-2.5 rounded-xl border transition-all cursor-pointer min-w-[110px] space-y-1.5 relative ${
                                    isCurrentPlaying
                                        ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.4)] scale-105'
                                        : isSelected
                                            ? 'bg-slate-800 border-cyan-400/90 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                            : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                                    <span>Step {idx + 1}</span>
                                    <div className="flex items-center gap-0.5">
                                        <button
                                            onClick={(e) => handleMoveStep(idx, -1, e)}
                                            disabled={idx === 0}
                                            className="p-0.5 hover:text-white disabled:opacity-20 text-slate-400"
                                            title="Move Left"
                                        >
                                            <ArrowLeft size={10} />
                                        </button>
                                        <button
                                            onClick={(e) => handleMoveStep(idx, 1, e)}
                                            disabled={idx === chords.length - 1}
                                            className="p-0.5 hover:text-white disabled:opacity-20 text-slate-400"
                                            title="Move Right"
                                        >
                                            <ArrowRight size={10} />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-center py-1">
                                    <div className={`text-base font-bold font-mono ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                                        {chord.name}
                                    </div>
                                    <div className="text-[8px] text-slate-400 uppercase tracking-wider">
                                        Octave {chord.octave ?? 3}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-white/10 pt-1 text-slate-400">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onPlaySingleChord) onPlaySingleChord(chord);
                                        }}
                                        className="p-1 hover:text-amber-300 hover:bg-white/10 rounded transition-colors"
                                        title="Play this chord"
                                    >
                                        <Volume2 size={11} />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => handleDuplicateStep(idx, e)}
                                            className="p-1 hover:text-cyan-300 hover:bg-white/10 rounded transition-colors"
                                            title="Duplicate"
                                        >
                                            <Copy size={10} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteStep(idx, e)}
                                            disabled={chords.length <= 1}
                                            className="p-1 hover:text-rose-400 hover:bg-white/10 rounded transition-colors disabled:opacity-20"
                                            title="Delete"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Active Chord Builder Panel */}
            {selectedChord && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 shrink-0">
                                Editing Step {selectedStepIdx + 1}:
                            </span>
                            <span className="text-base sm:text-lg font-bold font-mono text-white truncate">
                                {selectedChord.name}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <div className="flex items-center gap-1 text-[10px] text-slate-300">
                                <span className="text-slate-400 text-[9px]">Oct:</span>
                                {[2, 3, 4].map(oct => (
                                    <button
                                        key={oct}
                                        onClick={() => handleUpdateOctave(oct)}
                                        className={`px-1.5 sm:px-2 py-0.5 rounded text-[9.5px] sm:text-[10px] font-mono font-bold transition-all ${
                                            (selectedChord.octave ?? 3) === oct
                                                ? 'bg-cyan-500 text-black font-extrabold'
                                                : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                        }`}
                                    >
                                        {oct}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleAuditionSelected}
                                className="px-2.5 sm:px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[9.5px] sm:text-[10px] font-bold border border-amber-500/40 flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                            >
                                <Play size={10} className="fill-current" />
                                <span>Audition</span>
                            </button>
                        </div>
                    </div>

                    {/* Root Note Selector */}
                    <div className="space-y-1.5">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Root Note
                        </div>
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                            {NOTE_NAMES.map(note => {
                                const isRoot = selectedChord.root === note;
                                return (
                                    <button
                                        key={note}
                                        onClick={() => handleUpdateRoot(note)}
                                        className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                                            isRoot
                                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                                                : 'bg-black/30 border-white/10 hover:border-white/30 text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        {note}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chord Quality / Type Selector */}
                    <div className="space-y-1.5">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Chord Quality / Voicing Structure
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                            {CHORD_TYPE_OPTIONS.map(opt => {
                                const isType = selectedChord.type === opt.type;
                                return (
                                    <button
                                        key={opt.type}
                                        onClick={() => handleUpdateType(opt.type)}
                                        className={`p-1.5 rounded-lg text-left transition-all border ${
                                            isType
                                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                                                : 'bg-black/30 border-white/10 hover:border-white/20 text-slate-300 hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        <div className="text-xs font-bold font-mono truncate">{opt.label}</div>
                                        <div className="text-[8px] text-slate-400 truncate leading-tight">{opt.description}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Voicing Pitches Preview */}
                    <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                Voicing Tones in Preferred Tuning ({progTemperament} @ {progPitch} Hz)
                            </div>
                            <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                {resolvedNotes.map((n, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                                        <span className="font-bold text-white">{n.note}{n.octave}</span>
                                        <span className="text-slate-400">({n.freq.toFixed(1)} Hz)</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="text-[9px] text-slate-400 italic">
                            All notes seamlessly glide using optimal polyphonic voice leading.
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Actions: Save & Play */}
            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <Check size={12} className="text-emerald-400" />
                    <span>Auto-saves locally. Automatically locks into preferred temperament to avoid dissonance.</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                    <button
                        onClick={handleSaveProgression}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider border border-white/20 flex items-center justify-center gap-1.5 transition-all"
                    >
                        <Save size={13} />
                        <span>Save to Library</span>
                    </button>

                    <button
                        onClick={handleSaveAndActivate}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-extrabold uppercase tracking-wider border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center gap-1.5 transition-all"
                    >
                        <Play size={13} className="fill-black" />
                        <span>Save & Activate Now</span>
                    </button>
                </div>
            </div>

            {/* Custom Progressions Library Section */}
            {savedCustomList.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        My Saved Custom Progressions ({savedCustomList.length})
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {savedCustomList.map(prog => (
                            <div
                                key={prog.id}
                                onClick={() => handleEditCustom(prog)}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                    editingProgId === prog.id
                                        ? 'bg-slate-800 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                        : 'bg-black/30 border-white/10 hover:border-white/20'
                                }`}
                            >
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-white truncate">{prog.name}</span>
                                        <span className="px-1.5 py-0.2 rounded text-[7px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                                            Custom
                                        </span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 truncate">
                                        {prog.chords.map(c => c.name).join(' → ')}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSaveAndActivate(prog);
                                        }}
                                        className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[9px] font-bold border border-amber-500/40"
                                        title="Activate this progression"
                                    >
                                        Play
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteCustom(prog.id, e)}
                                        className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-white/10 transition-colors"
                                        title="Delete custom progression"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
