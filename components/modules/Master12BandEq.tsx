import React, { useMemo, useCallback } from 'react';
import { SlidersHorizontal, RotateCcw, Power, Sparkles, ChevronDown, Check } from 'lucide-react';
import { MASTER_EQ_FREQUENCIES, MASTER_EQ_PRESETS, EqPreset } from '../../services/audio/AudioTypes';

interface Master12BandEqProps {
    masterEq: number[]; // Array of 12 numbers in dB (-12 to +12)
    onBandChange: (index: number, gainDb: number) => void;
    onResetEq: () => void;
    onApplyPreset: (gains: number[]) => void;
    isBypassed: boolean;
    onToggleBypass: () => void;
}

const BAND_DESCRIPTIONS = [
    'Sub', 'Bass', 'Low', 'Warm', 'Body', 'Mid', 'Clar', 'Pres', 'Treb', 'Air', 'Sheen', 'Aether'
];

export const Master12BandEq: React.FC<Master12BandEqProps> = ({
    masterEq,
    onBandChange,
    onResetEq,
    onApplyPreset,
    isBypassed,
    onToggleBypass
}) => {
    // Current active preset identification
    const currentPresetId = useMemo(() => {
        const found = MASTER_EQ_PRESETS.find(p => 
            p.gains.every((val, idx) => Math.abs(val - (masterEq[idx] ?? 0)) < 0.1)
        );
        return found ? found.id : 'custom';
    }, [masterEq]);

    // Format frequency display (e.g., 32, 500, 1k, 16k)
    const formatFreq = useCallback((freq: number) => {
        if (freq >= 1000) return `${freq / 1000}k`;
        return `${freq}`;
    }, []);

    // SVG curve calculation for the frequency response visualizer
    const curvePath = useMemo(() => {
        const width = 500;
        const height = 90;
        const paddingX = 20;
        const usableWidth = width - paddingX * 2;
        const midY = height / 2;
        const maxDb = 15;

        const points = MASTER_EQ_FREQUENCIES.map((_, i) => {
            const x = paddingX + (i / (MASTER_EQ_FREQUENCIES.length - 1)) * usableWidth;
            const db = isBypassed ? 0 : (masterEq[i] ?? 0);
            // Invert db for SVG coordinates (positive db goes up)
            const y = midY - (db / maxDb) * (midY - 8);
            return { x, y, db };
        });

        // Generate smooth Bezier curve
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cpX = (p0.x + p1.x) / 2;
            d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
        }

        // Generate area fill path
        const lastP = points[points.length - 1];
        const firstP = points[0];
        const areaPath = `${d} L ${lastP.x} ${midY} L ${firstP.x} ${midY} Z`;

        return { linePath: d, areaPath, points, midY, width, height };
    }, [masterEq, isBypassed]);

    return (
        <div className="rounded-xl bg-black/50 border border-white/10 p-3.5 sm:p-4 space-y-3.5 shadow-xl">
            {/* Header & Main Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border transition-colors ${
                        isBypassed 
                            ? 'bg-amber-950/30 border-amber-500/30 text-amber-400' 
                            : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    }`}>
                        <SlidersHorizontal size={14} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-white">Master 12-Band EQ</span>
                            {isBypassed ? (
                                <span className="px-1.5 py-0.5 rounded text-[7.5px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    Bypassed
                                </span>
                            ) : (
                                <span className="px-1.5 py-0.5 rounded text-[7.5px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                                    Active
                                </span>
                            )}
                        </div>
                        <span className="text-[8px] text-slate-400">Master Output Bus • 20 Hz – 20 kHz Precision Shaper</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Bypass Toggle */}
                    <button
                        onClick={onToggleBypass}
                        title={isBypassed ? "Enable Equalizer" : "Bypass Equalizer (Flat)"}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[8.5px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                            isBypassed
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                                : 'bg-white/5 text-slate-400 hover:text-white border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <Power size={10} />
                        <span>{isBypassed ? 'Engage' : 'Bypass'}</span>
                    </button>

                    {/* Reset Flat Button */}
                    <button
                        onClick={onResetEq}
                        title="Reset all bands to 0 dB"
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[8.5px] font-mono font-bold uppercase bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                    >
                        <RotateCcw size={10} />
                        <span>Flat</span>
                    </button>
                </div>
            </div>

            {/* Presets Selector Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1">
                        <Sparkles size={10} className="text-amber-400" /> EQ Acoustic Profiles
                    </span>
                    <span className="font-mono text-cyan-300">
                        {currentPresetId === 'custom' ? 'Custom Curve' : MASTER_EQ_PRESETS.find(p => p.id === currentPresetId)?.name}
                    </span>
                </div>
                <div className="flex flex-wrap gap-1">
                    {MASTER_EQ_PRESETS.map((preset) => {
                        const isSelected = currentPresetId === preset.id;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => onApplyPreset(preset.gains)}
                                title={preset.description}
                                className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                                    isSelected
                                        ? 'bg-cyan-500/25 text-cyan-200 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                                        : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] border-white/5'
                                }`}
                            >
                                {preset.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Visual Frequency Response Curve */}
            <div className="relative rounded-lg bg-black/70 border border-white/10 p-2 overflow-hidden shadow-inner">
                <svg
                    viewBox={`0 0 ${curvePath.width} ${curvePath.height}`}
                    className="w-full h-16 sm:h-20"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="eqCurveGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="eqStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="35%" stopColor="#06b6d4" />
                            <stop offset="70%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {/* +12 dB line */}
                    <line x1="0" y1={curvePath.height * 0.1} x2={curvePath.width} y2={curvePath.height * 0.1} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    {/* +6 dB line */}
                    <line x1="0" y1={curvePath.height * 0.3} x2={curvePath.width} y2={curvePath.height * 0.3} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    {/* 0 dB Center Zero line */}
                    <line x1="0" y1={curvePath.midY} x2={curvePath.width} y2={curvePath.midY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    {/* -6 dB line */}
                    <line x1="0" y1={curvePath.height * 0.7} x2={curvePath.width} y2={curvePath.height * 0.7} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    {/* -12 dB line */}
                    <line x1="0" y1={curvePath.height * 0.9} x2={curvePath.width} y2={curvePath.height * 0.9} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                    {/* Filled Area */}
                    <path d={curvePath.areaPath} fill="url(#eqCurveGradient)" />

                    {/* Response Curve Line */}
                    <path
                        d={curvePath.linePath}
                        fill="none"
                        stroke={isBypassed ? "#94a3b8" : "url(#eqStrokeGradient)"}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Band Handle Dots */}
                    {curvePath.points.map((pt, idx) => {
                        const isBoost = pt.db > 0.5;
                        const isCut = pt.db < -0.5;
                        return (
                            <circle
                                key={idx}
                                cx={pt.x}
                                cy={pt.y}
                                r="3.2"
                                fill={isBypassed ? "#64748b" : isBoost ? "#38bdf8" : isCut ? "#f43f5e" : "#e2e8f0"}
                                stroke="#020617"
                                strokeWidth="1.5"
                            />
                        );
                    })}
                </svg>

                {/* Left/Right dB Reference Labels */}
                <div className="absolute left-2 top-1.5 bottom-1.5 flex flex-col justify-between text-[7px] font-mono text-white/30 pointer-events-none select-none">
                    <span>+12</span>
                    <span>0</span>
                    <span>-12</span>
                </div>
            </div>

            {/* 12 Vertical Band Sliders */}
            <div className="overflow-x-auto pb-1 pt-1 -mx-1 px-1 custom-scrollbar">
                <div className="grid grid-cols-12 gap-1 sm:gap-1.5 min-w-[480px]">
                    {MASTER_EQ_FREQUENCIES.map((freq, idx) => {
                        const currentDb = masterEq[idx] ?? 0;
                        const isBoost = currentDb > 0.2;
                        const isCut = currentDb < -0.2;
                        const isZero = Math.abs(currentDb) <= 0.2;

                        return (
                            <div
                                key={freq}
                                className="flex flex-col items-center p-1 sm:p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors group"
                            >
                                {/* Band Gain readout badge (Click to zero) */}
                                <button
                                    onClick={() => onBandChange(idx, 0)}
                                    title="Click to reset band to 0 dB"
                                    className={`text-[8px] font-mono font-bold leading-none mb-1 px-0.5 py-0.5 rounded transition-colors cursor-pointer ${
                                        isZero 
                                            ? 'text-slate-500 hover:text-white' 
                                            : isBoost 
                                            ? 'text-cyan-300 font-bold hover:text-cyan-100' 
                                            : 'text-rose-400 font-bold hover:text-rose-200'
                                    }`}
                                >
                                    {currentDb > 0 ? `+${currentDb.toFixed(1)}` : currentDb.toFixed(1)}
                                </button>

                                {/* Vertical Slider Track Container */}
                                <div className="relative h-28 sm:h-32 w-5 flex items-center justify-center my-0.5">
                                    {/* Track Center Line (0 dB tick mark) */}
                                    <div className="absolute top-1/2 left-0.5 right-0.5 h-[1.5px] bg-white/25 -translate-y-1/2 pointer-events-none z-10" />

                                    {/* Visual Fill Bar from 0 dB */}
                                    <div className="absolute w-1.5 rounded-full bg-slate-800 top-1 bottom-1 pointer-events-none" />
                                    {isBoost && (
                                        <div
                                            className="absolute w-1.5 rounded-full bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_8px_#06b6d4] pointer-events-none"
                                            style={{
                                                bottom: '50%',
                                                height: `${Math.min(50, (currentDb / 15) * 50)}%`
                                            }}
                                        />
                                    )}
                                    {isCut && (
                                        <div
                                            className="absolute w-1.5 rounded-full bg-gradient-to-b from-rose-600 to-rose-400 shadow-[0_0_8px_#f43f5e] pointer-events-none"
                                            style={{
                                                top: '50%',
                                                height: `${Math.min(50, (Math.abs(currentDb) / 15) * 50)}%`
                                            }}
                                        />
                                    )}

                                    {/* Standard HTML5 Vertical Range Input */}
                                    <input
                                        type="range"
                                        min="-12"
                                        max="12"
                                        step="0.5"
                                        value={currentDb}
                                        onChange={(e) => onBandChange(idx, parseFloat(e.target.value))}
                                        className="appearance-none h-28 sm:h-32 w-5 bg-transparent cursor-pointer relative z-20 [writing-mode:vertical-lr] [direction:rtl] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cyan-500 [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                                        title={`${formatFreq(freq)} Hz: ${currentDb > 0 ? '+' : ''}${currentDb} dB`}
                                    />
                                </div>

                                {/* Frequency Label */}
                                <span className="text-[8.5px] font-mono font-bold text-slate-200 mt-1">
                                    {formatFreq(freq)}
                                </span>

                                {/* Band Description Tag */}
                                <span className="text-[6.5px] uppercase tracking-wider text-slate-500 group-hover:text-slate-400 leading-none mt-0.5">
                                    {BAND_DESCRIPTIONS[idx]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Tips Footer */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[7.5px] text-slate-500">
                <span>Tip: Click any band's dB value to zero it • Range: -12 dB to +12 dB</span>
                <span className="font-mono">12 ISO Bands • 48 kHz Processing</span>
            </div>
        </div>
    );
};
