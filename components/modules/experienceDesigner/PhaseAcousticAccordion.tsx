import React, { useState } from 'react';
import { Music, Volume2, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { ExperienceBlock, SoundSourceType, resolveBlockFrequencies } from '../../../services/audio/experienceDesigner';
import { TuningTemperament, TEMPERAMENTS } from '../visuals/shared';
import { InteractivePianoKeyboard } from '../InteractivePianoKeyboard';

interface Props {
    block: ExperienceBlock;
    blockIndex: number;
    updateBlock: (index: number, patch: Partial<ExperienceBlock>) => void;
    basePitch: number;
    temperament: TuningTemperament;
    isAuditioning: boolean;
    onAudition: () => void;
    onOpenTuningMenu: () => void;
    defaultOpen?: boolean;
    isOpen?: boolean;
    onToggleOpen?: () => void;
}

const NOTE_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CHORD_TYPE_OPTIONS: { type: string; label: string }[] = [
    { type: 'maj', label: 'Major Triad (1-3-5)' },
    { type: 'min', label: 'Minor Triad (1-b3-5)' },
    { type: 'maj7', label: 'Major 7th (1-3-5-7)' },
    { type: 'min7', label: 'Minor 7th (1-b3-5-b7)' },
    { type: 'dom7', label: 'Dominant 7th (1-3-5-b7)' },
    { type: 'sus2', label: 'Suspended 2 (1-2-5)' },
    { type: 'sus4', label: 'Suspended 4 (1-4-5)' },
    { type: 'dim', label: 'Diminished (1-b3-b5)' },
    { type: 'aug', label: 'Augmented (1-3-#5)' },
    { type: 'halfDim7', label: 'Half Dim 7 (m7b5)' },
    { type: 'dim7', label: 'Diminished 7th' },
    { type: 'add9', label: 'Add 9 (1-3-5-9)' },
    { type: 'maj9', label: 'Major 9th (1-3-5-7-9)' },
    { type: 'min9', label: 'Minor 9th (1-b3-5-b7-9)' },
    { type: '5', label: 'Power Chord (1-5)' }
];

export const PhaseAcousticAccordion: React.FC<Props> = ({
    block,
    blockIndex,
    updateBlock,
    basePitch,
    temperament,
    isAuditioning,
    onAudition,
    onOpenTuningMenu,
    defaultOpen = true,
    isOpen: controlledOpen,
    onToggleOpen
}) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const handleToggle = () => {
        if (onToggleOpen) onToggleOpen();
        else setInternalOpen(!isOpen);
    };
    const [inputMode, setInputMode] = useState<'KEYBOARD' | 'THEORY'>('KEYBOARD');

    const soundType: SoundSourceType = block.soundType || 'CHORD';
    const resolved = resolveBlockFrequencies(block, basePitch, temperament);

    // Compute compact summary label for header badge
    const getSummaryBadge = () => {
        if (soundType === 'CHORD') {
            if (block.chord?.customNotes && block.chord.customNotes.length > 0) {
                const count = block.chord.customNotes.length;
                return `${count} Note${count === 1 ? '' : 's'} (${block.chord.customNotes.join('·')})`;
            }
            const root = block.chord?.root || 'C';
            const type = block.chord?.type || 'maj7';
            const oct = block.chord?.octave ?? 3;
            return `${root}${type} (Oct ${oct})`;
        }
        if (soundType === 'PURE_TONE') {
            return `${(block.pureToneHz || 432).toFixed(1)} Hz`;
        }
        if (soundType === 'TONE_STACK') {
            const count = block.toneStack?.length || 3;
            return `Stack (${count} Voices)`;
        }
        return 'Acoustic Voicing';
    };

    return (
        <div className="border border-cyan-500/30 rounded-xl bg-slate-950/80 overflow-hidden transition-all shadow-[0_2px_12px_rgba(6,182,212,0.08)]">
            {/* Tinted Accordion Header - Spacious min-h to prevent text clipping */}
            <div
                onClick={handleToggle}
                className="min-h-[68px] sm:min-h-[64px] py-2.5 px-3 sm:px-3.5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-slate-950/90 hover:from-cyan-950/90 hover:via-slate-900 transition-all select-none border-b border-cyan-500/20"
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className="w-8 h-8 rounded-lg border bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)] flex items-center justify-center shrink-0 self-center">
                        <Music size={15} />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                            <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                                Acoustic Sound
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                                {getSummaryBadge()}
                            </span>
                        </div>
                        <span className="text-[10.5px] text-cyan-300/85 block leading-normal">
                            {resolved.frequencies.length} harmonic {resolved.frequencies.length === 1 ? 'voice' : 'voices'} · {temperament.replace(/_/g, ' ')} · {basePitch.toFixed(1)} Hz
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center pl-1">
                    {/* Instant Audition Button */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAudition();
                        }}
                        title={isAuditioning ? "Stop audio preview" : "Audition current acoustic voices"}
                        className={`px-2.5 py-1 rounded-lg border transition-all text-[10px] font-bold flex items-center gap-1.5 ${
                            isAuditioning
                                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
                                : 'bg-white/5 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border-white/10'
                        }`}
                    >
                        {isAuditioning ? (
                            <>
                                <Square size={10} className="fill-current" />
                                <span>Stop</span>
                            </>
                        ) : (
                            <>
                                <Volume2 size={12} className="text-teal-400" />
                                <span>Audition</span>
                            </>
                        )}
                    </button>

                    {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
            </div>

            {/* Accordion Body */}
            {isOpen && (
                <div className="p-3 sm:p-3.5 space-y-3 bg-black/40 border-t border-white/5">
                    {/* Sound Source Type Switcher */}
                    <div className="grid grid-cols-3 gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
                        {(['CHORD', 'PURE_TONE', 'TONE_STACK'] as SoundSourceType[]).map(st => {
                            const isActive = soundType === st;
                            return (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => updateBlock(blockIndex, { soundType: st })}
                                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        isActive
                                            ? 'bg-white/20 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {st === 'CHORD' ? 'Chord' : st === 'PURE_TONE' ? 'Pure Tone' : 'Tone Stack'}
                                </button>
                            );
                        })}
                    </div>

                    {/* Mode A: Musical Chord Controls */}
                    {soundType === 'CHORD' && (
                        <div className="space-y-3 bg-black/40 p-2.5 rounded-xl border border-white/10">
                            {/* Sub-header: Keyboard vs Theory + Tuning Access */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-white/5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5 text-[11px]">
                                        <button
                                            type="button"
                                            onClick={() => setInputMode('KEYBOARD')}
                                            className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                                                inputMode === 'KEYBOARD'
                                                    ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40 shadow-sm'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <span>🎹 Visual Keyboard</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInputMode('THEORY')}
                                            className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                                                inputMode === 'THEORY'
                                                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <span>🎼 Music Theory</span>
                                        </button>
                                    </div>

                                    {/* Tuning & Temperament Button */}
                                    <button
                                        type="button"
                                        onClick={onOpenTuningMenu}
                                        title="Open Tuning Architect: Reference pitch, temperaments & scale intervals"
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 shadow-sm transition-all"
                                    >
                                        <Music size={11} className="text-cyan-400 shrink-0" />
                                        <span>Tuning: <strong className="text-white font-mono">{basePitch}Hz</strong> · {TEMPERAMENTS.find(t => t.id === temperament)?.shortName || 'Just'}</span>
                                    </button>
                                </div>

                                <span className="text-[10px] font-mono font-bold text-teal-300 whitespace-nowrap">
                                    {block.chord?.customNotes && block.chord.customNotes.length > 0
                                        ? `${block.chord.customNotes.length} Custom Notes`
                                        : `${block.chord?.root || 'C'}${block.chord?.type || 'maj7'} (Oct ${block.chord?.octave ?? 3})`}
                                </span>
                            </div>

                            {/* View 1: Interactive Piano Keyboard with 3-Octave Scroll & Chord Drawing */}
                            {inputMode === 'KEYBOARD' ? (
                                <InteractivePianoKeyboard
                                    selectedNotes={block.chord?.customNotes || []}
                                    onNotesChange={(notes) => {
                                        updateBlock(blockIndex, {
                                            soundType: 'CHORD',
                                            chord: {
                                                ...(block.chord || { name: 'Custom Chord', root: 'C', type: 'custom', octave: 3 }),
                                                customNotes: notes,
                                                name: notes.length > 0
                                                    ? (notes.length <= 3 ? notes.join('·') : `${notes.length} Notes`)
                                                    : 'Empty Chord'
                                            }
                                        });
                                    }}
                                    basePitch={basePitch}
                                    temperament={temperament}
                                    rootNote={block.chord?.root || 'C'}
                                    onRootChange={(r) => {
                                        updateBlock(blockIndex, {
                                            soundType: 'CHORD',
                                            chord: {
                                                ...(block.chord || { name: `${r}maj7`, type: 'maj7', octave: 3 }),
                                                root: r
                                            }
                                        });
                                    }}
                                    chordOctave={block.chord?.octave ?? 3}
                                    onAuditionChord={onAudition}
                                    isAuditioning={isAuditioning}
                                />
                            ) : (
                                /* View 2: Traditional Music Theory Dropdowns */
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[9px] uppercase text-slate-400 font-bold block mb-1">Root</label>
                                            <select
                                                value={block.chord?.root || 'C'}
                                                onChange={(e) => {
                                                    const root = e.target.value;
                                                    const type = block.chord?.type || 'maj7';
                                                    updateBlock(blockIndex, {
                                                        chord: {
                                                            name: `${root}${type}`,
                                                            root,
                                                            type,
                                                            octave: block.chord?.octave ?? 3,
                                                            customNotes: undefined
                                                        }
                                                    });
                                                }}
                                                className="w-full bg-slate-900 border border-white/15 rounded-lg px-2 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-teal-400"
                                            >
                                                {NOTE_OPTIONS.map(note => <option key={note} value={note}>{note}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[9px] uppercase text-slate-400 font-bold block mb-1">Octave</label>
                                            <select
                                                value={block.chord?.octave ?? 3}
                                                onChange={(e) => {
                                                    const octave = parseInt(e.target.value) || 3;
                                                    updateBlock(blockIndex, {
                                                        chord: {
                                                            ...(block.chord || { name: 'Cmaj7', root: 'C', type: 'maj7' }),
                                                            octave,
                                                            customNotes: undefined
                                                        }
                                                    });
                                                }}
                                                className="w-full bg-slate-900 border border-white/15 rounded-lg px-2 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-teal-400"
                                            >
                                                {[1, 2, 3, 4, 5, 6].map(oct => <option key={oct} value={oct}>Octave {oct}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[9px] uppercase text-slate-400 font-bold block mb-1">Quality</label>
                                            <select
                                                value={block.chord?.type || 'maj7'}
                                                onChange={(e) => {
                                                    const type = e.target.value;
                                                    const root = block.chord?.root || 'C';
                                                    updateBlock(blockIndex, {
                                                        chord: {
                                                            name: `${root}${type}`,
                                                            root,
                                                            type,
                                                            octave: block.chord?.octave ?? 3,
                                                            customNotes: undefined
                                                        }
                                                    });
                                                }}
                                                className="w-full bg-slate-900 border border-white/15 rounded-lg px-2 py-1.5 text-xs font-bold text-teal-300 focus:outline-none focus:border-teal-400"
                                            >
                                                {CHORD_TYPE_OPTIONS.map(opt => <option key={opt.type} value={opt.type}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mode B: Pure Tone */}
                    {soundType === 'PURE_TONE' && (
                        <div className="space-y-3 bg-black/40 p-2.5 rounded-xl border border-white/10">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300 font-medium">Frequency</span>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="20"
                                        max="2000"
                                        value={block.pureToneHz || 432.0}
                                        onChange={(e) => updateBlock(blockIndex, { pureToneHz: parseFloat(e.target.value) || 432.0 })}
                                        className="w-20 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs"
                                    />
                                    <span className="text-xs text-slate-400 font-mono">Hz</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="55"
                                max="880"
                                step="0.5"
                                value={block.pureToneHz || 432.0}
                                onChange={(e) => updateBlock(blockIndex, { pureToneHz: parseFloat(e.target.value) })}
                                className="w-full accent-teal-400 h-2 bg-slate-800 rounded-lg"
                            />
                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {[136.1, 216.0, 432.0, 528.0, 639.0].map(hz => (
                                    <button
                                        key={hz}
                                        type="button"
                                        onClick={() => updateBlock(blockIndex, { pureToneHz: hz })}
                                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-teal-500/20 border border-white/10 text-[9px] font-mono text-slate-300 hover:text-teal-300 transition-colors"
                                    >
                                        {hz}Hz
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mode C: Tone Stack */}
                    {soundType === 'TONE_STACK' && (
                        <div className="space-y-3 bg-black/40 p-2.5 rounded-xl border border-white/10">
                            <div className="space-y-1.5">
                                {(block.toneStack || [216.0, 432.0, 648.0]).map((freq, sIdx) => (
                                    <div key={sIdx} className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-slate-400 font-mono">Voice {sIdx + 1}</span>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="20"
                                                max="2000"
                                                value={freq}
                                                onChange={(e) => {
                                                    const cur = [...(block.toneStack || [216.0, 432.0, 648.0])];
                                                    cur[sIdx] = parseFloat(e.target.value) || 432.0;
                                                    updateBlock(blockIndex, { toneStack: cur });
                                                }}
                                                className="w-20 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs"
                                            />
                                            <span className="text-[10px] text-slate-400 font-mono">Hz</span>
                                            {(block.toneStack || []).length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const cur = (block.toneStack || [216.0, 432.0, 648.0]).filter((_, i) => i !== sIdx);
                                                        updateBlock(blockIndex, { toneStack: cur });
                                                    }}
                                                    className="w-5 h-5 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold hover:bg-rose-500/30"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const cur = [...(block.toneStack || [216.0, 432.0, 648.0]), 864.0];
                                        updateBlock(blockIndex, { toneStack: cur });
                                    }}
                                    className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[9px] font-bold"
                                >
                                    + Add Voice
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateBlock(blockIndex, { toneStack: [136.1, 272.2, 408.3] })}
                                    className="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-emerald-400/40 text-[9px] text-slate-300"
                                >
                                    Om Triad
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateBlock(blockIndex, { toneStack: [216.0, 432.0, 648.0] })}
                                    className="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-emerald-400/40 text-[9px] text-slate-300"
                                >
                                    432 Triad
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateBlock(blockIndex, { toneStack: [396.0, 528.0, 639.0] })}
                                    className="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-emerald-400/40 text-[9px] text-slate-300"
                                >
                                    Solfeggio
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Acoustic Array Inspector readout */}
                    <div className="bg-black/60 rounded-xl p-2 border border-white/5">
                        <div className="text-[9px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                            <span>Acoustic Array ({resolved.frequencies.length} Voices)</span>
                            <span className="text-[9px] text-teal-400 font-mono font-bold">{resolved.secondaryInfo}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {resolved.labels.map((lbl, voiceIdx) => (
                                <span
                                    key={voiceIdx}
                                    className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-[9px] font-mono text-slate-200"
                                >
                                    {lbl}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
