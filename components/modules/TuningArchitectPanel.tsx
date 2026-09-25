import React, { useState } from 'react';
import { X, Music, Check, Sliders, RotateCcw, Info, Volume2 } from 'lucide-react';
import { TEMPERAMENTS, TuningTemperament, calculateMusicalScaleFreqs } from './visuals/shared';

interface TuningArchitectPanelProps {
    currentPitch: number;
    currentTemperament: TuningTemperament;
    onPitchChange: (pitch: number) => void;
    onTemperamentChange: (temperament: TuningTemperament) => void;
    onClose?: () => void;
}

const PITCH_PRESETS = [
    { label: '432 Hz', value: 432.0, tag: 'Verdi / Natural', desc: 'Acoustic geometry aligning with natural harmonics' },
    { label: '440 Hz', value: 440.0, tag: 'ISO Standard', desc: 'Modern international concert pitch standard' },
    { label: '444 Hz', value: 444.0, tag: 'Solfeggio C5=528', desc: 'Calibrated to yield C5 = 528.0 Hz miracle tone' },
    { label: '415 Hz', value: 415.0, tag: 'Baroque Pitch', desc: 'Historic European chamber & harpsichord tuning' },
    { label: '430.54 Hz', value: 430.54, tag: 'Scientific C=256', desc: 'Sauveur philosophical pitch with C4 = 256.0 Hz' },
    { label: '442 Hz', value: 442.0, tag: 'European Orch', desc: 'Vienna, Berlin & Russian symphony concert pitch' },
];

export const TuningArchitectPanel: React.FC<TuningArchitectPanelProps> = ({
    currentPitch,
    currentTemperament,
    onPitchChange,
    onTemperamentChange,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'TEMPERAMENT' | 'PITCH' | 'SCALE_MATRIX'>('TEMPERAMENT');
    const activeTempInfo = TEMPERAMENTS.find(t => t.id === currentTemperament) || TEMPERAMENTS[0];

    // Calculate Octave 4 scale for live comparison
    const sampleScale = calculateMusicalScaleFreqs(currentPitch, currentTemperament, 4, 1);
    const tetScale = calculateMusicalScaleFreqs(currentPitch, '12TET', 4, 1);

    // Audio preview note synthesizer
    const playNotePreview = (freq: number) => {
        try {
            const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtxClass) return;
            const ctx = new AudioCtxClass();
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.001, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.65);
            setTimeout(() => ctx.close().catch(() => {}), 800);
        } catch {
            // Audio fallback
        }
    };

    return (
        <div className="bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-white/10 bg-slate-900/90 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                        <Music size={16} />
                    </div>
                    <div>
                        <div className="text-xs sm:text-sm font-bold tracking-wide text-white uppercase flex items-center gap-2">
                            Scale & Tuning Architect
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                            Concert Pitch: A4 = <strong className="text-amber-300">{currentPitch.toFixed(2)}Hz</strong> · System: <strong className="text-cyan-300">{activeTempInfo.shortName}</strong>
                        </div>
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        title="Close tuning panel"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-white/10 bg-black/40 px-3 sm:px-4 pt-2 gap-1 sm:gap-2 shrink-0 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('TEMPERAMENT')}
                    className={`pb-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'TEMPERAMENT'
                            ? 'border-cyan-400 text-cyan-300'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    1. Temperament ({TEMPERAMENTS.length})
                </button>
                <button
                    onClick={() => setActiveTab('PITCH')}
                    className={`pb-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'PITCH'
                            ? 'border-cyan-400 text-cyan-300'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    2. Pitch ({currentPitch.toFixed(1)}Hz)
                </button>
                <button
                    onClick={() => setActiveTab('SCALE_MATRIX')}
                    className={`pb-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                        activeTab === 'SCALE_MATRIX'
                            ? 'border-cyan-400 text-cyan-300'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    3. Scale & Cents
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
                {/* TAB 1: TEMPERAMENTS */}
                {activeTab === 'TEMPERAMENT' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            <span>Historical & Harmonic Tuning Systems</span>
                            <span className="text-cyan-400 font-mono">Select to Retune</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {TEMPERAMENTS.map(t => {
                                const isSelected = currentTemperament === t.id;
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
                    </div>
                )}

                {/* TAB 2: PITCH */}
                {activeTab === 'PITCH' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            <span>Master Concert Reference Pitch</span>
                            <span className="text-amber-400 font-mono">A4 Fundamental</span>
                        </div>

                        {/* Presets Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {PITCH_PRESETS.map(preset => {
                                const isSelected = Math.abs(currentPitch - preset.value) < 0.05;
                                return (
                                    <div
                                        key={preset.label}
                                        onClick={() => onPitchChange(preset.value)}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                                            isSelected
                                                ? 'bg-amber-500/15 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                                : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className={`text-sm font-bold font-mono ${isSelected ? 'text-amber-300' : 'text-slate-200 group-hover:text-white'}`}>
                                                {preset.label}
                                            </span>
                                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                                                {preset.tag}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-slate-400 leading-relaxed">
                                            {preset.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Continuous Slider & Steppers */}
                        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Continuous Pitch Tuning</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="380"
                                        max="480"
                                        value={currentPitch.toFixed(1)}
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
                                value={currentPitch}
                                onChange={(e) => onPitchChange(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                            />

                            <div className="flex items-center justify-between gap-1 pt-1">
                                {[-5, -1, -0.1, 0.1, 1, 5].map(step => (
                                    <button
                                        key={step}
                                        onClick={() => onPitchChange(Math.max(380, Math.min(480, Math.round((currentPitch + step) * 10) / 10)))}
                                        className="flex-1 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-mono font-bold text-slate-300 hover:text-white transition-colors"
                                    >
                                        {step > 0 ? `+${step}` : step}
                                    </button>
                                ))}
                                <button
                                    onClick={() => onPitchChange(432.0)}
                                    className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[9px] font-bold uppercase text-amber-300 transition-colors"
                                    title="Reset to 432 Hz"
                                >
                                    432
                                </button>
                                <button
                                    onClick={() => onPitchChange(440.0)}
                                    className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-[9px] font-bold uppercase text-rose-300 transition-colors"
                                    title="Reset to 440 Hz"
                                >
                                    440
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
                                Octave 4 Chromatic Scale
                            </span>
                            <span className="text-[9px] font-mono text-cyan-400">
                                {activeTempInfo.shortName} vs 12-TET
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
                                        <th className="p-2 text-center w-8">Test</th>
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
                                                <td className="p-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => playNotePreview(item.freq)}
                                                        className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded"
                                                        title={`Play ${item.note} (${item.freq.toFixed(1)}Hz)`}
                                                    >
                                                        <Volume2 size={12} />
                                                    </button>
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

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10 bg-slate-900/90 flex items-center justify-between shrink-0">
                <div className="text-[9px] text-slate-400 flex items-center gap-1.5">
                    <Info size={12} className="text-cyan-400" />
                    <span>Real-time synthesis update</span>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-[10px] sm:text-xs rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all active:scale-95"
                    >
                        Done
                    </button>
                )}
            </div>
        </div>
    );
};
