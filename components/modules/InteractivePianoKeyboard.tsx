import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Volume2, RotateCcw, Square, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { TuningTemperament, calculateMusicalScaleFreqs } from './visuals/shared';

interface InteractivePianoKeyboardProps {
    selectedNotes: string[]; // e.g. ['C3', 'G3', 'C4', 'E4']
    onNotesChange: (notes: string[]) => void;
    basePitch: number;
    temperament: TuningTemperament;
    rootNote?: string;
    onRootChange?: (root: string) => void;
    chordOctave?: number;
    onAuditionChord?: () => void;
    isAuditioning?: boolean;
}

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Voicing semitone intervals from root
const CHORD_PRESETS = [
    { label: 'Major', intervals: [0, 4, 7], tag: '1-3-5' },
    { label: 'Minor', intervals: [0, 3, 7], tag: '1-♭3-5' },
    { label: 'Maj 7', intervals: [0, 4, 7, 11], tag: '1-3-5-7' },
    { label: 'Min 7', intervals: [0, 3, 7, 10], tag: '1-♭3-5-♭7' },
    { label: 'Sus 4', intervals: [0, 5, 7], tag: '1-4-5' },
    { label: 'Ambient 9', intervals: [0, 7, 14, 16], tag: '1-5-9-3' },
    { label: 'Octave Spread', intervals: [0, 7, 12, 16, 19], tag: '1-5-8-10-12' }
];

// Available 3-octave spans (Mid Warm is the default musical anchor spanning Octaves 3 to 6)
const OCTAVE_OPTIONS = [
    { start: 2, label: 'Octaves 2–5 (Deep)' },
    { start: 3, label: 'Octaves 3–6 (Mid Warm)' },
    { start: 4, label: 'Octaves 4–7 (High)' }
];

export const InteractivePianoKeyboard: React.FC<InteractivePianoKeyboardProps> = ({
    selectedNotes,
    onNotesChange,
    basePitch,
    temperament,
    rootNote = 'C',
    onRootChange,
    chordOctave,
    onAuditionChord,
    isAuditioning = false
}) => {
    // Determine initial octave range: default to Mid Warm (Octaves 3 to 6)
    const initialOctave = useMemo(() => {
        if (selectedNotes && selectedNotes.length > 0) {
            let minOct = 99;
            for (const n of selectedNotes) {
                const m = n.match(/\d+$/);
                if (m) {
                    const oct = parseInt(m[0], 10);
                    if (oct < minOct) minOct = oct;
                }
            }
            if (minOct <= 2) return 2;
            if (minOct >= 4) return 4;
            return 3;
        }
        if (chordOctave !== undefined) {
            if (chordOctave >= 5) return 4;
            if (chordOctave <= 2) return 2;
            return 3;
        }
        return 3;
    }, [selectedNotes, chordOctave]);

    const [startOctave, setStartOctave] = useState<number>(initialOctave);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const singleNoteCtxRef = useRef<AudioContext | null>(null);

    // Gesture drawing state
    const isDrawingRef = useRef<boolean>(false);
    const isAddingModeRef = useRef<boolean>(true);
    const autoScrollTimerRef = useRef<number | null>(null);
    const selectedNotesRef = useRef<string[]>(selectedNotes);
    useEffect(() => {
        selectedNotesRef.current = selectedNotes;
    }, [selectedNotes]);

    // Single note audio synthesizer preview
    const playNotePreview = useCallback((freq: number) => {
        try {
            const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtxClass) return;
            if (!singleNoteCtxRef.current || singleNoteCtxRef.current.state === 'closed') {
                singleNoteCtxRef.current = new AudioCtxClass();
            }
            const ctx = singleNoteCtxRef.current;
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.001, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        } catch {
            // Audio fallback
        }
    }, []);

    // Clean up single note preview AudioContext and auto-scroll timer on unmount
    useEffect(() => {
        return () => {
            if (singleNoteCtxRef.current && singleNoteCtxRef.current.state !== 'closed') {
                singleNoteCtxRef.current.close().catch(() => {});
            }
            if (autoScrollTimerRef.current) {
                cancelAnimationFrame(autoScrollTimerRef.current);
            }
        };
    }, []);

    // Calculate scale frequencies for the 3 full octaves plus top terminating key (4 octaves range to cover startOctave .. startOctave+3)
    const keyboardScale = useMemo(() => {
        return calculateMusicalScaleFreqs(basePitch, temperament, startOctave, 4);
    }, [basePitch, temperament, startOctave]);

    // Map of note name -> frequency
    const noteFreqMap = useMemo(() => {
        const map = new Map<string, number>();
        keyboardScale.forEach(item => {
            map.set(item.note, item.freq);
        });
        return map;
    }, [keyboardScale]);

    // Normalize note string for comparison
    const isNoteSelected = useCallback((noteName: string) => {
        const standard = noteName.trim();
        return selectedNotes.some(n => {
            const clean = n.trim();
            return clean === standard || clean.replace('♯', '#') === standard || clean.replace('#', '♯') === standard;
        });
    }, [selectedNotes]);

    // Wheel event handler: enables horizontal scrolling across the 3 octaves using mouse wheel
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            // If scrolling vertically, translate to horizontal scroll across the 3 octaves
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // Window pointerup listener to safely conclude chord drawing gestures
    useEffect(() => {
        const handlePointerUp = () => {
            isDrawingRef.current = false;
            if (autoScrollTimerRef.current) {
                cancelAnimationFrame(autoScrollTimerRef.current);
                autoScrollTimerRef.current = null;
            }
        };

        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
        return () => {
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, []);

    // Toggle note (add or remove)
    const toggleNote = useCallback((noteName: string, freq?: number) => {
        if (freq) {
            playNotePreview(freq);
        }
        const current = selectedNotesRef.current;
        const exists = current.some(n => {
            const clean = n.trim();
            return clean === noteName || clean.replace('♯', '#') === noteName || clean.replace('#', '♯') === noteName;
        });

        if (exists) {
            const next = current.filter(n => {
                const clean = n.trim();
                return clean !== noteName && clean.replace('♯', '#') !== noteName && clean.replace('#', '♯') !== noteName;
            });
            onNotesChange(next);
        } else {
            if (current.length >= 8) return; // Cap at 8 chord voices
            const next = [...current, noteName];
            onNotesChange(next);
        }
    }, [onNotesChange, playNotePreview]);

    // Add note specifically during drawing gesture
    const addNoteDuringDrag = useCallback((noteName: string, freq?: number) => {
        const current = selectedNotesRef.current;
        const exists = current.some(n => {
            const clean = n.trim();
            return clean === noteName || clean.replace('♯', '#') === noteName || clean.replace('#', '♯') === noteName;
        });

        if (!exists && current.length < 8) {
            if (freq) playNotePreview(freq);
            onNotesChange([...current, noteName]);
        }
    }, [onNotesChange, playNotePreview]);

    // Key pointer down handler (initiates drawing gesture)
    const handleKeyPointerDown = (noteName: string, freq: number, e: React.PointerEvent) => {
        e.preventDefault();
        isDrawingRef.current = true;
        const alreadyActive = isNoteSelected(noteName);
        isAddingModeRef.current = !alreadyActive;

        toggleNote(noteName, freq);
    };

    // Key pointer enter handler (draws notes as pointer slides across the 3 octaves)
    const handleKeyPointerEnter = (noteName: string, freq: number, e: React.PointerEvent) => {
        if (!isDrawingRef.current) return;
        if (isAddingModeRef.current) {
            addNoteDuringDrag(noteName, freq);
        }

        // Auto-scroll when drawing near edges of the scroll container
        if (scrollContainerRef.current) {
            const rect = scrollContainerRef.current.getBoundingClientRect();
            const edgeThreshold = 60;
            const x = e.clientX;

            if (autoScrollTimerRef.current) {
                cancelAnimationFrame(autoScrollTimerRef.current);
                autoScrollTimerRef.current = null;
            }

            if (x > rect.right - edgeThreshold) {
                const scrollStep = () => {
                    if (scrollContainerRef.current && isDrawingRef.current) {
                        scrollContainerRef.current.scrollLeft += 8;
                        autoScrollTimerRef.current = requestAnimationFrame(scrollStep);
                    }
                };
                autoScrollTimerRef.current = requestAnimationFrame(scrollStep);
            } else if (x < rect.left + edgeThreshold) {
                const scrollStep = () => {
                    if (scrollContainerRef.current && isDrawingRef.current) {
                        scrollContainerRef.current.scrollLeft -= 8;
                        autoScrollTimerRef.current = requestAnimationFrame(scrollStep);
                    }
                };
                autoScrollTimerRef.current = requestAnimationFrame(scrollStep);
            }
        }
    };

    // Smoothly scroll container
    const scrollByAmount = useCallback((offset: number) => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.scrollBy({
            left: offset,
            behavior: 'smooth'
        });
    }, []);

    // Jump scroll to specific octave within the 3 octaves
    const scrollToOctave = useCallback((octaveNum: number) => {
        if (!scrollContainerRef.current) return;
        const octaveIndex = octaveNum - startOctave;
        if (octaveIndex < 0) return;
        const whiteKeyWidth = 44; // average key width
        const targetScroll = octaveIndex * (7 * whiteKeyWidth);
        scrollContainerRef.current.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
    }, [startOctave]);

    // Apply chord preset based on active root and keyboard octave
    const applyPreset = useCallback((intervals: number[]) => {
        const rootIndex = CHROMATIC_NOTES.indexOf(rootNote);
        if (rootIndex === -1) return;

        const baseOct = startOctave;
        const newNotes: string[] = [];
        intervals.forEach(interval => {
            const totalIndex = rootIndex + interval;
            const noteIndex = totalIndex % 12;
            const octaveOffset = Math.floor(totalIndex / 12);
            const octave = baseOct + octaveOffset;
            newNotes.push(`${CHROMATIC_NOTES[noteIndex]}${octave}`);
        });

        onNotesChange(newNotes);
    }, [onNotesChange, rootNote, startOctave]);

    // Clear all selected notes
    const clearNotes = useCallback(() => {
        onNotesChange([]);
    }, [onNotesChange]);

    // Exactly 3 complete octaves in view
    const octaves = [startOctave, startOctave + 1, startOctave + 2];
    // Terminating high root key (e.g. C6 when startOctave is 3)
    const terminatingTopCName = `C${startOctave + 3}`;
    const terminatingTopCFreq = noteFreqMap.get(terminatingTopCName) || 523.25;
    const isTerminatingTopCActive = isNoteSelected(terminatingTopCName);

    // Musically sorted selected notes
    const sortedSelectedNotes = useMemo(() => {
        return [...selectedNotes].sort((a, b) => {
            const freqA = noteFreqMap.get(a) || 0;
            const freqB = noteFreqMap.get(b) || 0;
            return freqA - freqB;
        });
    }, [selectedNotes, noteFreqMap]);

    return (
        <div className="space-y-3 bg-slate-950/80 border border-white/10 rounded-xl p-3 sm:p-3.5 backdrop-blur-sm">
            {/* Top Toolbar: Octave Selector, Jump Buttons & Voicing Helpers */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10 text-xs">
                {/* 3-Octave Span Selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Span:</span>
                    <div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-0.5">
                        {OCTAVE_OPTIONS.map(opt => (
                            <button
                                key={opt.start}
                                type="button"
                                onClick={() => setStartOctave(opt.start)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                                    startOctave === opt.start
                                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Quick Octave Jump Pills within the 3 Octaves */}
                    <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-0.5 ml-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 px-1">Jump:</span>
                        {octaves.map(oct => (
                            <button
                                key={oct}
                                type="button"
                                onClick={() => scrollToOctave(oct)}
                                title={`Scroll to Octave ${oct}`}
                                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 text-[10px] font-mono font-bold transition-colors"
                            >
                                Oct {oct}
                            </button>
                        ))}
                    </div>

                    {/* Scroll nudge buttons */}
                    <div className="flex items-center gap-1 ml-1">
                        <button
                            type="button"
                            onClick={() => scrollByAmount(-180)}
                            title="Scroll left"
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors"
                        >
                            <ChevronLeft size={12} />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollByAmount(180)}
                            title="Scroll right"
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors"
                        >
                            <ChevronRight size={12} />
                        </button>
                    </div>
                </div>

                {/* Root Note Picker & Voicing Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                    {onRootChange && (
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Root:</span>
                            <select
                                value={rootNote}
                                onChange={(e) => onRootChange(e.target.value)}
                                className="bg-black/60 border border-white/15 rounded-md px-1.5 py-0.5 text-xs font-bold text-teal-300 focus:outline-none"
                            >
                                {CHROMATIC_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-1 flex-wrap">
                        {CHORD_PRESETS.map(preset => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => applyPreset(preset.intervals)}
                                title={`${rootNote} ${preset.label} (${preset.tag})`}
                                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-semibold text-slate-300 hover:text-teal-300 transition-colors"
                            >
                                {preset.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={clearNotes}
                            title="Clear selected notes"
                            className="px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-semibold flex items-center gap-0.5 ml-1"
                        >
                            <RotateCcw size={10} />
                            <span>Clear</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Gesture Draw Hint Banner */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span className="flex items-center gap-1 text-teal-300/90">
                    <Wand2 size={11} className="text-teal-400" />
                    <span>Click or drag across keys to draw chords spanning across the 3 octaves</span>
                </span>
                <span className="text-slate-500 hidden sm:inline">
                    Scroll wheel / Touch to pan
                </span>
            </div>

            {/* Interactive Piano Keyboard Canvas with 3 Full Octaves + Top C Span */}
            <div 
                ref={scrollContainerRef}
                className="relative w-full overflow-x-auto select-none py-1.5 px-0.5 scroll-smooth cursor-crosshair touch-pan-x"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(20, 184, 166, 0.5) rgba(15, 23, 42, 0.8)' }}
            >
                <div className="relative flex min-w-[880px] sm:min-w-[1020px] h-32 sm:h-36 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 shadow-inner">
                    {octaves.map((octave) => {
                        // 7 white notes per octave: C, D, E, F, G, A, B
                        const whiteNotes = [
                            { note: 'C', hasBlackAfter: true, blackNote: 'C#' },
                            { note: 'D', hasBlackAfter: true, blackNote: 'D#' },
                            { note: 'E', hasBlackAfter: false },
                            { note: 'F', hasBlackAfter: true, blackNote: 'F#' },
                            { note: 'G', hasBlackAfter: true, blackNote: 'G#' },
                            { note: 'A', hasBlackAfter: true, blackNote: 'A#' },
                            { note: 'B', hasBlackAfter: false }
                        ];

                        return (
                            <div key={octave} className="flex relative flex-1">
                                {whiteNotes.map((wn) => {
                                    const fullWhiteName = `${wn.note}${octave}`;
                                    const whiteFreq = noteFreqMap.get(fullWhiteName) || 261.6;
                                    const isWhiteActive = isNoteSelected(fullWhiteName);

                                    return (
                                        <div key={fullWhiteName} className="flex-1 relative flex flex-col items-center">
                                            {/* White Key */}
                                            <button
                                                type="button"
                                                onPointerDown={(e) => handleKeyPointerDown(fullWhiteName, whiteFreq, e)}
                                                onPointerEnter={(e) => handleKeyPointerEnter(fullWhiteName, whiteFreq, e)}
                                                className={`w-full h-full rounded-b-lg border flex flex-col justify-end items-center pb-2 transition-all duration-75 shadow-sm touch-none ${
                                                    isWhiteActive
                                                        ? 'bg-gradient-to-b from-teal-400 to-emerald-400 text-slate-950 font-extrabold border-teal-300 shadow-[0_0_14px_rgba(20,184,166,0.7)] z-0'
                                                        : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold border-slate-400/80 z-0'
                                                }`}
                                            >
                                                <span className="text-[10px] tracking-tight">{fullWhiteName}</span>
                                                {isWhiteActive && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 mt-0.5" />
                                                )}
                                            </button>

                                            {/* Black Key */}
                                            {wn.hasBlackAfter && wn.blackNote && (
                                                <div 
                                                    className="absolute top-0 right-0 translate-x-1/2 w-6 sm:w-7 h-[62%] z-20 pointer-events-auto"
                                                >
                                                    {(() => {
                                                        const fullBlackName = `${wn.blackNote}${octave}`;
                                                        const blackFreq = noteFreqMap.get(fullBlackName) || 277.2;
                                                        const isBlackActive = isNoteSelected(fullBlackName);

                                                        return (
                                                            <button
                                                                type="button"
                                                                onPointerDown={(e) => {
                                                                    e.stopPropagation();
                                                                    handleKeyPointerDown(fullBlackName, blackFreq, e);
                                                                }}
                                                                onPointerEnter={(e) => {
                                                                    e.stopPropagation();
                                                                    handleKeyPointerEnter(fullBlackName, blackFreq, e);
                                                                }}
                                                                className={`w-full h-full rounded-b-md border flex flex-col justify-end items-center pb-1.5 transition-all duration-75 shadow-md touch-none ${
                                                                    isBlackActive
                                                                        ? 'bg-gradient-to-b from-teal-400 to-emerald-400 text-slate-950 font-extrabold border-teal-300 shadow-[0_0_14px_rgba(20,184,166,0.9)]'
                                                                        : 'bg-slate-950 hover:bg-slate-800 active:bg-slate-700 text-slate-300 font-bold border-slate-700'
                                                                }`}
                                                            >
                                                                <span className="text-[9px] tracking-tighter leading-none">{fullBlackName}</span>
                                                                {isBlackActive && (
                                                                    <span className="w-1 h-1 rounded-full bg-slate-950 mt-0.5" />
                                                                )}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {/* Terminating Top Root C Key - completes the 3rd octave */}
                    <div className="relative flex flex-col items-center w-8 sm:w-9 shrink-0">
                        <button
                            type="button"
                            onPointerDown={(e) => handleKeyPointerDown(terminatingTopCName, terminatingTopCFreq, e)}
                            onPointerEnter={(e) => handleKeyPointerEnter(terminatingTopCName, terminatingTopCFreq, e)}
                            className={`w-full h-full rounded-b-lg border flex flex-col justify-end items-center pb-2 transition-all duration-75 shadow-sm touch-none ${
                                isTerminatingTopCActive
                                    ? 'bg-gradient-to-b from-teal-400 to-emerald-400 text-slate-950 font-extrabold border-teal-300 shadow-[0_0_14px_rgba(20,184,166,0.7)] z-0'
                                    : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold border-slate-400/80 z-0'
                            }`}
                        >
                            <span className="text-[10px] tracking-tight">{terminatingTopCName}</span>
                            {isTerminatingTopCActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 mt-0.5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Controls: Musically Sorted Selected Notes Badges & Audition Chord Toggle Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs">
                {/* Active Selected Notes Badges (Musically ordered across octaves) */}
                <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Selected ({selectedNotes.length}):</span>
                    {selectedNotes.length === 0 ? (
                        <span className="text-slate-500 italic text-[11px]">Click or drag across keys above to draw a chord</span>
                    ) : (
                        sortedSelectedNotes.map(n => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => toggleNote(n)}
                                title={`Click to remove ${n}`}
                                className="px-2 py-0.5 rounded-full bg-teal-500/20 hover:bg-rose-500/20 text-teal-300 hover:text-rose-300 border border-teal-500/30 hover:border-rose-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
                            >
                                <span>{n}</span>
                                <span className="text-[9px] opacity-70">×</span>
                            </button>
                        ))
                    )}
                </div>

                {/* Audition Chord Button */}
                {onAuditionChord && (
                    <button
                        type="button"
                        onClick={onAuditionChord}
                        title={isAuditioning ? "Stop playing chord" : "Audition full chord audio preview"}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all duration-200 shrink-0 ${
                            isAuditioning
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.6)] animate-pulse'
                                : 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30 hover:border-teal-400'
                        }`}
                    >
                        {isAuditioning ? (
                            <>
                                <Square size={12} className="fill-current text-slate-950" />
                                <span>Stop Audition</span>
                            </>
                        ) : (
                            <>
                                <Volume2 size={14} className="text-teal-400" />
                                <span>Audition Chord</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
