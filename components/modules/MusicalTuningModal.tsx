import React, { useState } from 'react';
import { X, Music, Sparkles, Check, Sliders, Info, RotateCcw, Volume2, ArrowRight } from 'lucide-react';
import { TEMPERAMENTS, TuningTemperament, calculateMusicalScaleFreqs, NOTE_NAMES } from './visuals/shared';

interface MusicalTuningModalProps {
    isOpen: boolean;
    onClose: () => void;
    pitch: number;
    onPitchChange: (pitch: number) => void;
    temperament: TuningTemperament;
    onTemperamentChange: (temperament: TuningTemperament) => void;
    octaveShift: number;
    onOctaveShiftChange: (shift: number) => void;
    uiConfig?: Record<string, unknown>;
}

const PITCH_PRESETS = [
    { label: '432 Hz', value: 432.0, tag: 'Verdi / Natural', desc: 'Acoustic geometry aligning with natural harmonics' },
    { label: '440 Hz', value: 440.0, tag: 'ISO Standard', desc: 'Modern international concert pitch standard' },
    { label: '444 Hz', value: 444.0, tag: 'Solfeggio C5=528', desc: 'Calibrated to yield C5 = 528.0 Hz miracle tone' },
    { label: '415 Hz', value: 415.0, tag: 'Baroque Pitch', desc: 'Historic European chamber & harpsichord tuning' },
    { label: '430.54 Hz', value: 430.54, tag: 'Scientific C=256', desc: 'Sauveur philosophical pitch with C4 = 256.0 Hz' },
    { label: '442 Hz', value: 442.0, tag: 'European Orch', desc: 'Vienna, Berlin & Russian symphony concert pitch' },
];

export const MusicalTuningModal: React.FC<MusicalTuningModalProps> = ({
    isOpen,
    onClose,
    pitch,
    onPitchChange,
    temperament,
    onTemperamentChange,
    octaveShift,
    onOctaveShiftChange
}) => {
    const [activeTab, setActiveTab] = useState<'TEMPERAMENT' | 'PITCH' | 'SCALE_MATRIX'>('TEMPERAMENT');

    if (!isOpen) return null;

    // Calculate sample octave 4 frequencies for live preview table
    const sampleScale = calculateMusicalScaleFreqs(pitch, temperament, 4, 1);
    const tetScale = calculateMusicalScaleFreqs(pitch, '12TET', 4, 1);

    const activeTempInfo = TEMPERAMENTS.find(t => t.id === temperament) || TEMPERAMENTS[0];

    return (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 pointer-events-auto">
            <div className="w-full max-w-2xl bg-slate-950 border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
                
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-white/10 bg-slate-900/90 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                            <Music size={18} />
                        </div>
                        <div>
                            <div className="text-sm font-bold tracking-wide text-white uppercase flex items-center gap-2">
                                Musical Scale & Tuning Architect
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                                Reference: A4 = {pitch.toFixed(2)}Hz · {activeTempInfo.shortName} · Octave {octaveShift >= 0 ? `+${octaveShift}` : octaveShift}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        title="Close tuning modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-white/10 bg-black/40 px-4 pt-2 gap-2 shrink-0">
                    <button
                        onClick={() => setActiveTab('TEMPERAMENT')}
                        className={`pb-2 px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'TEMPERAMENT' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        1. Temperament & Tuning ({TEMPERAMENTS.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('PITCH')}
                        className={`pb-2 px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'PITCH' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        2. Concert Pitch (A4: {pitch.toFixed(1)}Hz)
                    </button>
                    <button
                        onClick={() => setActiveTab('SCALE_MATRIX')}
                        className={`pb-2 px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'SCALE_MATRIX' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        3. Scale Frequencies & Cents
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    
                    {/* TAB 1: TEMPERAMENTS */}
                    {activeTab === 'TEMPERAMENT' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Historical & Harmonic Tuning Systems
                                </span>
                                <span className="text-[9px] text-cyan-400 font-mono">
                                    Select any temperament to retune the live keyboard
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {TEMPERAMENTS.map(t => {
                                    const isSelected = temperament === t.id;
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => onTemperamentChange(t.id)}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                                                isSelected 
                                                    ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                                                    : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'}`}>
                                                        {t.name}
                                                    </span>
                                                    <span className="text-[8px] font-mono uppercase tracking-wider text-slate-500">
                                                        {t.era}
                                                    </span>
                                                </div>
                                                {isSelected && (
                                                    <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center text-black shrink-0 shadow-[0_0_8px_currentColor]">
                                                        <Check size={10} className="stroke-[3]" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[9px] leading-relaxed text-slate-400 font-normal">
                                                {t.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Octave Range Selector */}
                            <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Keyboard Octave Span</div>
                                    <div className="text-[9px] text-slate-400">Shift the 3-octave span lower (bass) or higher (treble)</div>
                                </div>
                                <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-white/10">
                                    {[
                                        { shift: -1, label: 'C2 – B4 (Bass)' },
                                        { shift: 0, label: 'C3 – B5 (Standard)' },
                                        { shift: 1, label: 'C4 – B6 (Treble)' }
                                    ].map(opt => (
                                        <button
                                            key={opt.shift}
                                            onClick={() => onOctaveShiftChange(opt.shift)}
                                            className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase transition-all ${octaveShift === opt.shift ? 'bg-cyan-500 text-black font-extrabold shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: PITCH */}
                    {activeTab === 'PITCH' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/90 border border-white/10">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 block">
                                        Select Concert Pitch or Enter Custom Hz
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                        Calibrates A4 tuning reference frequency across all musical keyboard octaves.
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={PITCH_PRESETS.some(p => Math.abs(pitch - p.value) < 0.05) ? pitch.toString() : 'CUSTOM'}
                                        onChange={(e) => {
                                            if (e.target.value !== 'CUSTOM') {
                                                onPitchChange(parseFloat(e.target.value));
                                            }
                                        }}
                                        className="bg-black/80 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                                    >
                                        {PITCH_PRESETS.map(p => (
                                            <option key={p.value} value={p.value} className="bg-slate-950 text-white">
                                                {p.label} · {p.tag}
                                            </option>
                                        ))}
                                        <option value="CUSTOM" className="bg-slate-950 text-amber-400">Custom Pitch...</option>
                                    </select>
                                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-1 rounded-lg">
                                        {pitch.toFixed(2)} Hz
                                    </span>
                                </div>
                            </div>

                            {/* Fine Stepper & Slider */}
                            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Continuous Pitch Tuning</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="380"
                                            max="480"
                                            value={pitch.toFixed(1)}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val) && val >= 380 && val <= 480) onPitchChange(val);
                                            }}
                                            className="w-20 bg-black/60 border border-white/20 rounded px-2 py-0.5 text-xs font-mono font-bold text-cyan-400 text-right focus:border-cyan-400 focus:outline-none"
                                        />
                                        <span className="text-xs font-mono text-slate-400">Hz</span>
                                    </div>
                                </div>

                                <input
                                    type="range"
                                    min="400"
                                    max="460"
                                    step="0.1"
                                    value={pitch}
                                    onChange={(e) => onPitchChange(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                />

                                <div className="flex items-center justify-between gap-1 pt-1">
                                    {[-5, -1, -0.1, 0.1, 1, 5].map(step => (
                                        <button
                                            key={step}
                                            onClick={() => onPitchChange(Math.max(380, Math.min(480, Math.round((pitch + step) * 10) / 10)))}
                                            className="flex-1 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-mono font-bold text-slate-300 hover:text-white transition-colors"
                                        >
                                            {step > 0 ? `+${step}` : step}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => onPitchChange(440.0)}
                                        className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-[9px] font-bold uppercase text-rose-300 transition-colors"
                                        title="Reset to standard A440"
                                    >
                                        <RotateCcw size={10} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: SCALE MATRIX */}
                    {activeTab === 'SCALE_MATRIX' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Octave 4 Chromatic Note Frequencies
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">
                                    Comparing {activeTempInfo.shortName} vs 12-TET
                                </span>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                                <table className="w-full text-left text-[10px]">
                                    <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-white/10">
                                        <tr>
                                            <th className="p-2 pl-3">Note</th>
                                            <th className="p-2">Current ({activeTempInfo.shortName})</th>
                                            <th className="p-2">12-TET Equal</th>
                                            <th className="p-2 text-right pr-3">Delta (Cents)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-mono">
                                        {sampleScale.map((item, idx) => {
                                            const tetFreq = tetScale[idx]?.freq || item.freq;
                                            const centsDelta = Math.round(1200 * Math.log2(item.freq / tetFreq) * 10) / 10;
                                            const isBlack = item.note.includes('#');

                                            return (
                                                <tr key={item.note} className={isBlack ? 'bg-white/[0.02]' : ''}>
                                                    <td className="p-2 pl-3 font-bold text-white flex items-center gap-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${isBlack ? 'bg-slate-500' : 'bg-white'}`} />
                                                        {item.note}
                                                    </td>
                                                    <td className="p-2 text-cyan-300 font-bold">{item.freq.toFixed(2)} Hz</td>
                                                    <td className="p-2 text-slate-400">{tetFreq.toFixed(2)} Hz</td>
                                                    <td className={`p-2 text-right pr-3 font-bold ${centsDelta === 0 ? 'text-slate-500' : (centsDelta > 0 ? 'text-emerald-400' : 'text-amber-400')}`}>
                                                        {centsDelta > 0 ? `+${centsDelta.toFixed(1)}` : (centsDelta < 0 ? centsDelta.toFixed(1) : '0.0')} ¢
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <div className="px-5 py-3 border-t border-white/10 bg-slate-900/90 flex items-center justify-between shrink-0">
                    <div className="text-[9px] text-slate-400 flex items-center gap-1.5">
                        <Info size={12} className="text-cyan-400" />
                        <span>All changes update the synthesizer & visualizers immediately.</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-[10px] sm:text-xs rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all active:scale-95"
                    >
                        Done
                    </button>
                </div>

            </div>
        </div>
    );
};
