import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ResolvedChordInfo } from '../../services/audio/chordProgressions';
import { Activity, Disc, RefreshCw, Sparkles } from 'lucide-react';

interface HarmonicVisualizerProps {
    chordInfo: ResolvedChordInfo | null;
    isGliding?: boolean;
    abComparisonMode?: 'PRESET' | '12TET';
    onToggleAbComparison?: () => void;
    currentTemperamentName?: string;
}

export type GeometryDisplayMode = 'LISSAJOUS' | 'CIRCLE_OF_FIFTHS';

interface NoteNode {
    label: string;
    alt: string[];
    semitone: number;
    angle: number; // in radians, 0 = 12 o'clock (-PI/2)
}

// 12 chromatic pitches arranged in the classic Circle of Fifths order
// Clockwise from 12 o'clock (C at top)
const CIRCLE_OF_FIFTHS_NODES: NoteNode[] = [
    { label: 'C', alt: ['C', 'B#'], semitone: 0, angle: -Math.PI / 2 + 0 * (Math.PI / 6) },
    { label: 'G', alt: ['G'], semitone: 7, angle: -Math.PI / 2 + 1 * (Math.PI / 6) },
    { label: 'D', alt: ['D'], semitone: 2, angle: -Math.PI / 2 + 2 * (Math.PI / 6) },
    { label: 'A', alt: ['A'], semitone: 9, angle: -Math.PI / 2 + 3 * (Math.PI / 6) },
    { label: 'E', alt: ['E', 'Fb'], semitone: 4, angle: -Math.PI / 2 + 4 * (Math.PI / 6) },
    { label: 'B', alt: ['B', 'Cb'], semitone: 11, angle: -Math.PI / 2 + 5 * (Math.PI / 6) },
    { label: 'F#', alt: ['F#', 'Gb'], semitone: 6, angle: -Math.PI / 2 + 6 * (Math.PI / 6) },
    { label: 'Db', alt: ['Db', 'C#'], semitone: 1, angle: -Math.PI / 2 + 7 * (Math.PI / 6) },
    { label: 'Ab', alt: ['Ab', 'G#'], semitone: 8, angle: -Math.PI / 2 + 8 * (Math.PI / 6) },
    { label: 'Eb', alt: ['Eb', 'D#'], semitone: 3, angle: -Math.PI / 2 + 9 * (Math.PI / 6) },
    { label: 'Bb', alt: ['Bb', 'A#'], semitone: 10, angle: -Math.PI / 2 + 10 * (Math.PI / 6) },
    { label: 'F', alt: ['F', 'E#'], semitone: 5, angle: -Math.PI / 2 + 11 * (Math.PI / 6) },
];

const NOTE_PALETTE = ['#38bdf8', '#fbbf24', '#34d399', '#c084fc', '#f472b6', '#60a5fa'];

export const HarmonicVisualizer: React.FC<HarmonicVisualizerProps> = ({
    chordInfo,
    isGliding = false,
    abComparisonMode = 'PRESET',
    onToggleAbComparison,
    currentTemperamentName
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animRef = useRef<number | null>(null);

    const [geometryMode, setGeometryMode] = useState<GeometryDisplayMode>(() => {
        try {
            const saved = localStorage.getItem('ppl_harmonic_geometry_mode');
            if (saved === 'LISSAJOUS' || saved === 'CIRCLE_OF_FIFTHS') return saved;
        } catch {
            return 'CIRCLE_OF_FIFTHS';
        }
        return 'CIRCLE_OF_FIFTHS';
    });

    const handleModeChange = (mode: GeometryDisplayMode) => {
        setGeometryMode(mode);
        try {
            localStorage.setItem('ppl_harmonic_geometry_mode', mode);
        } catch {
            void mode;
        }
    };

    const notes = useMemo(() => chordInfo?.notes || [], [chordInfo]);
    const is12TetActive = abComparisonMode === '12TET';

    // Derive active Circle of Fifths node indices and beating metric declaratively
    const { activeNodeIndices, rootNodeIndex, dominantBeatFreq } = useMemo(() => {
        const f0 = notes[0]?.freq || 130.8;
        let maxBeat = 0;
        const activeIndices: number[] = [];
        let rootIdx = 0;

        notes.forEach((n, idx) => {
            const rawNoteName = n.note || n.name || '';
            const pitchClass = (typeof rawNoteName === 'string' ? rawNoteName.replace(/[0-9]/g, '') : '').trim();
            const foundIdx = CIRCLE_OF_FIFTHS_NODES.findIndex(
                node => node.label === pitchClass || node.alt.includes(pitchClass)
            );
            if (foundIdx !== -1 && !activeIndices.includes(foundIdx)) {
                activeIndices.push(foundIdx);
                if (idx === 0) rootIdx = foundIdx;
            }

            // Estimate acoustic beat frequency in 12-TET relative to nearest harmonic
            if (idx > 0) {
                const semitones = Math.round(12 * Math.log2(n.freq / f0));
                const justRatios: Record<number, number> = {
                    0: 1, 1: 16/15, 2: 9/8, 3: 6/5, 4: 5/4, 5: 4/3,
                    6: 45/32, 7: 3/2, 8: 8/5, 9: 5/3, 10: 9/5, 11: 15/8, 12: 2
                };
                const octaves = Math.floor(semitones / 12);
                const semInOct = ((semitones % 12) + 12) % 12;
                const ratio = (justRatios[semInOct] || 1) * Math.pow(2, octaves);
                const idealFreq = f0 * ratio;
                const beat = Math.abs(n.freq - idealFreq);
                if (beat > maxBeat) maxBeat = beat;
            }
        });

        activeIndices.sort((a, b) => a - b);
        return {
            activeNodeIndices: activeIndices,
            rootNodeIndex: rootIdx,
            dominantBeatFreq: is12TetActive ? (maxBeat > 0.05 ? maxBeat : 2.6) : 0
        };
    }, [notes, is12TetActive]);

    // State reference for smooth continuous phase & frequency interpolation
    const stateRef = useRef({
        time: 0,
        is12Tet: is12TetActive,
        isGliding: false,
        voices: [] as Array<{
            name: string;
            freq: number;
            targetFreq: number;
            amp: number;
            targetAmp: number;
            color: string;
        }>,
        activeNodeIndices: [] as number[],
        rootNodeIndex: 0,
        dominantBeatFreq: 0
    });

    // Sync chord parameters to animation state
    useEffect(() => {
        stateRef.current.isGliding = !!isGliding;
        stateRef.current.is12Tet = is12TetActive;
        stateRef.current.activeNodeIndices = activeNodeIndices;
        stateRef.current.rootNodeIndex = rootNodeIndex;
        stateRef.current.dominantBeatFreq = dominantBeatFreq;

        // Smooth voices interpolation
        const prevVoices = stateRef.current.voices;
        stateRef.current.voices = notes.map((n, idx) => {
            const prev = prevVoices[idx];
            return {
                name: n.name || (n.note ? `${n.note}${n.octave ?? ''}` : `V${idx + 1}`),
                freq: prev ? prev.freq : n.freq,
                targetFreq: n.freq,
                amp: prev ? prev.amp : 0,
                targetAmp: 1.0 / Math.max(1, Math.sqrt(notes.length || 1)),
                color: NOTE_PALETTE[idx % NOTE_PALETTE.length]
            };
        });
    }, [notes, isGliding, is12TetActive, activeNodeIndices, rootNodeIndex, dominantBeatFreq]);

    // Continuous 60fps animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let running = true;
        let lastTime = performance.now();

        const updateCanvasSize = () => {
            if (!canvas) return;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const rect = canvas.getBoundingClientRect();
            const w = Math.round((rect.width || 560) * dpr);
            const h = Math.round((rect.height || 280) * dpr);
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        const render = (now: number) => {
            if (!running) return;

            const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
            lastTime = now;

            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const logicalWidth = canvas.width / dpr;
            const logicalHeight = canvas.height / dpr;

            const state = stateRef.current;
            state.time += dt;

            // Interpolate voices
            const lerpSpeed = state.isGliding ? 14 : 22;
            state.voices.forEach((v) => {
                v.freq += (v.targetFreq - v.freq) * Math.min(1, dt * lerpSpeed);
                v.amp += (v.targetAmp - v.amp) * Math.min(1, dt * 16);
            });

            ctx.save();
            ctx.scale(dpr, dpr);

            // Clean dark background with soft luminous wash
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);

            // Breath wave (gentle 8-second organic expansion cycle: 0 to 1)
            // Gently dilates geometry and enhances luminous bloom
            const breathWave = 0.5 + 0.5 * Math.sin(state.time * (2 * Math.PI / 8));
            const breathScale = 1.0 + 0.04 * breathWave;
            const breathGlow = 0.7 + 0.3 * breathWave;

            if (geometryMode === 'CIRCLE_OF_FIFTHS') {
                renderCircleOfFifths({
                    ctx,
                    width: logicalWidth,
                    height: logicalHeight,
                    activeIndices: state.activeNodeIndices,
                    rootIndex: state.rootNodeIndex,
                    time: state.time,
                    breathScale,
                    breathGlow,
                    is12Tet: state.is12Tet
                });
            } else {
                renderLissajousGeometry({
                    ctx,
                    width: logicalWidth,
                    height: logicalHeight,
                    voices: state.voices,
                    time: state.time,
                    breathScale,
                    breathGlow,
                    is12Tet: state.is12Tet
                });
            }

            ctx.restore();

            animRef.current = requestAnimationFrame(render);
        };

        animRef.current = requestAnimationFrame(render);

        return () => {
            running = false;
            window.removeEventListener('resize', updateCanvasSize);
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [geometryMode]);

    if (!chordInfo) return null;

    const activeChordName = chordInfo.name || 'Chord';
    const noteNamesString = notes.map(n => n.name || (n.note ? `${n.note}${n.octave ?? ''}` : '')).filter(Boolean).join(' · ');

    return (
        <div className="w-full rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 border border-white/10 p-3 sm:p-4 flex flex-col gap-3 shadow-2xl backdrop-blur-xl">
            {/* Header: Clean, Typography-First with Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        <Sparkles size={15} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                                {activeChordName}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full shrink-0">
                                {noteNamesString}
                            </span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${is12TetActive ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                            <span>
                                {is12TetActive 
                                    ? '12-Tone Equal Temperament (Acoustic Beating)' 
                                    : `${currentTemperamentName || 'Just Intonation'} (Phase-Locked Harmonic Stillness)`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Controls: Segmented Geometry Mode Pills + A/B Temperament Switch */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <div className="flex items-center bg-black/70 p-0.5 rounded-lg border border-white/15">
                        <button
                            type="button"
                            onClick={() => handleModeChange('CIRCLE_OF_FIFTHS')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9.5px] font-bold tracking-wide transition-all ${
                                geometryMode === 'CIRCLE_OF_FIFTHS'
                                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Circle of Fifths Sacred Geometry Visualizer"
                        >
                            <Disc size={11} className={geometryMode === 'CIRCLE_OF_FIFTHS' ? 'text-emerald-400' : 'opacity-60'} />
                            <span>Circle of Fifths</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange('LISSAJOUS')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9.5px] font-bold tracking-wide transition-all ${
                                geometryMode === 'LISSAJOUS'
                                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Lissajous Acoustic Vectorscope Knot"
                        >
                            <Activity size={11} className={geometryMode === 'LISSAJOUS' ? 'text-cyan-400' : 'opacity-60'} />
                            <span>Lissajous Knot</span>
                        </button>
                    </div>

                    {/* Compact A/B Comparison Toggle */}
                    {onToggleAbComparison && (
                        <button
                            type="button"
                            onClick={onToggleAbComparison}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 border shadow-sm ${
                                is12TetActive
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                            }`}
                            title="Compare pure harmonic alignment against standard equal temperament"
                        >
                            <RefreshCw size={10} />
                            <span>{is12TetActive ? 'Reset to Just' : 'Test 12-TET'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Minimalist, Borderless Canvas Stage */}
            <div className="relative w-full flex items-center justify-center overflow-hidden rounded-xl bg-[#020617]/90 border border-white/5 py-2">
                <canvas
                    ref={canvasRef}
                    width={560}
                    height={300}
                    className="w-full max-w-[560px] h-[240px] sm:h-[280px] block relative z-10"
                />
            </div>

            {/* Understated Status Footer */}
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-1 pt-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 uppercase tracking-wider font-bold">
                        {geometryMode === 'CIRCLE_OF_FIFTHS' ? 'Geometric Formation:' : 'Acoustic Knot:'}
                    </span>
                    <span className="text-slate-300">
                        {geometryMode === 'CIRCLE_OF_FIFTHS'
                            ? `${activeNodeIndices.length}-Tone Harmonic Polygon${chordInfo.root ? ` · Root: ${chordInfo.root}` : notes[0]?.note ? ` · Root: ${notes[0].note}` : ''}`
                            : is12TetActive
                                ? `Continuous Drift (~${dominantBeatFreq.toFixed(2)} Hz Beating)`
                                : 'Stationary Phase Lock (0.00 Hz Beating)'}
                    </span>
                </div>
                <div className="text-[8.5px] text-slate-500 hidden sm:block">
                    Acoustic Sacred Geometry
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// 1. CIRCLE OF FIFTHS SACRED GEOMETRY RENDERER
// ============================================================================
function renderCircleOfFifths({
    ctx,
    width,
    height,
    activeIndices,
    rootIndex,
    time,
    breathScale,
    breathGlow,
    is12Tet
}: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    activeIndices: number[];
    rootIndex: number;
    time: number;
    breathScale: number;
    breathGlow: number;
    is12Tet: boolean;
}) {
    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.38;
    const radius = baseRadius * breathScale;

    // Background concentric sacred geometry rings
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.382, 0, Math.PI * 2); // Golden ratio inner circle
    ctx.arc(cx, cy, radius * 0.618, 0, Math.PI * 2); // Golden ratio mid circle
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);         // Outer perimeter circle
    ctx.stroke();

    // Subtle 12-ray radial guidelines
    for (let i = 0; i < 12; i++) {
        const a = CIRCLE_OF_FIFTHS_NODES[i].angle;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.stroke();
    }
    ctx.restore();

    // Compute coordinate points for each of the 12 nodes
    const nodeCoords = CIRCLE_OF_FIFTHS_NODES.map(node => ({
        x: cx + Math.cos(node.angle) * radius,
        y: cy + Math.sin(node.angle) * radius
    }));

    // If active chord notes exist, draw the Harmonic Chord Polygon
    if (activeIndices.length >= 2) {
        const activeCoords = activeIndices.map(idx => nodeCoords[idx]);

        // In 12-TET, add a gentle slow rotational vibration to visually represent acoustic beating
        const beatWobble = is12Tet ? Math.sin(time * 5.2) * 1.5 : 0;

        ctx.save();

        // 1. Polygon Fill with ethereal radial gradient
        const polyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const polyColor = is12Tet ? '245, 158, 11' : '16, 185, 129';
        polyGrad.addColorStop(0, `rgba(${polyColor}, ${0.28 * breathGlow})`);
        polyGrad.addColorStop(0.7, `rgba(${polyColor}, ${0.12 * breathGlow})`);
        polyGrad.addColorStop(1, `rgba(${polyColor}, 0.02)`);

        ctx.beginPath();
        activeCoords.forEach((pt, i) => {
            const px = pt.x + beatWobble;
            const py = pt.y + beatWobble;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fillStyle = polyGrad;
        ctx.fill();

        // 2. Harmonic Ray Lines connecting Root note to all chord tones
        const rootCoord = nodeCoords[rootIndex];
        if (rootCoord) {
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = is12Tet ? 'rgba(251, 191, 36, 0.45)' : 'rgba(56, 189, 248, 0.45)';
            activeIndices.forEach(idx => {
                if (idx !== rootIndex) {
                    const target = nodeCoords[idx];
                    ctx.beginPath();
                    ctx.moveTo(rootCoord.x, rootCoord.y);
                    ctx.lineTo(target.x, target.y);
                    ctx.stroke();
                }
            });
        }

        // 3. Glowing Chord Polygon Perimeter Outline
        ctx.shadowColor = is12Tet ? '#f59e0b' : '#34d399';
        ctx.shadowBlur = 14 * breathGlow;
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = is12Tet ? '#fbbf24' : '#10b981';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        activeCoords.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.stroke();

        // 4. Inner intense laser core
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.restore();
    }

    // Render the 12 Note Nodes around the Circle
    CIRCLE_OF_FIFTHS_NODES.forEach((node, i) => {
        const coord = nodeCoords[i];
        const isActive = activeIndices.includes(i);
        const isRoot = i === rootIndex && isActive;

        ctx.save();

        if (isActive) {
            // Radiant glow aura around active node
            const glowColor = isRoot ? '#38bdf8' : is12Tet ? '#f59e0b' : '#34d399';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = (isRoot ? 22 : 14) * breathGlow;

            // Outer ring
            ctx.beginPath();
            ctx.arc(coord.x, coord.y, isRoot ? 11 : 8.5, 0, Math.PI * 2);
            ctx.fillStyle = isRoot ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.25)';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = glowColor;
            ctx.stroke();

            // Concentric solid center core
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(coord.x, coord.y, isRoot ? 4.5 : 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Active Note Label (positioned outwards from circle)
            const textOffset = 22;
            const tx = coord.x + Math.cos(node.angle) * textOffset;
            const ty = coord.y + Math.sin(node.angle) * textOffset;

            ctx.font = isRoot ? 'bold 13px ui-sans-serif, system-ui, sans-serif' : 'bold 11.5px ui-sans-serif, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.fillText(node.label, tx, ty);
        } else {
            // Inactive subtle node dot
            ctx.beginPath();
            ctx.arc(coord.x, coord.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();

            // Inactive Note Label
            const textOffset = 18;
            const tx = coord.x + Math.cos(node.angle) * textOffset;
            const ty = coord.y + Math.sin(node.angle) * textOffset;

            ctx.font = '9.5px ui-sans-serif, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(148, 163, 184, 0.55)'; // slate-400 at half opacity
            ctx.fillText(node.label, tx, ty);
        }

        ctx.restore();
    });

    // Center Sacred Focal Point
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = is12Tet ? 'rgba(245, 158, 11, 0.6)' : 'rgba(56, 189, 248, 0.7)';
    ctx.shadowColor = is12Tet ? '#f59e0b' : '#38bdf8';
    ctx.shadowBlur = 8 * breathGlow;
    ctx.fill();
    ctx.restore();
}

// ============================================================================
// 2. LISSAJOUS SACRED HARMONIC KNOT RENDERER
// ============================================================================
function renderLissajousGeometry({
    ctx,
    width,
    height,
    voices,
    time,
    breathScale,
    breathGlow,
    is12Tet
}: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    voices: Array<{ freq: number; amp: number; color: string }>;
    time: number;
    breathScale: number;
    breathGlow: number;
    is12Tet: boolean;
}) {
    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.38;
    const maxRadius = baseRadius * breathScale;

    const v1 = voices[0];
    const upperVoices = voices.slice(1);

    if (!v1) return;

    const f0 = Math.max(20, v1.freq);
    const numFundamentalCycles = 4;
    const timeSpan = numFundamentalCycles / f0;
    const numPoints = 700;

    const points: Array<{ x: number; y: number }> = [];

    // Continuous time t produces continuous rotation in 12-TET, while freezing in Just Intonation
    for (let i = 0; i <= numPoints; i++) {
        const tau = (i / numPoints) * timeSpan;
        const currentT = time + tau;

        // X-Axis: Channel 1 (Root fundamental)
        const xVal = Math.cos(2 * Math.PI * v1.freq * currentT);

        // Y-Axis: Upper voices composite
        let yVal = 0;
        if (upperVoices.length === 0) {
            yVal = Math.sin(2 * Math.PI * v1.freq * currentT);
        } else {
            upperVoices.forEach(v => {
                yVal += Math.sin(2 * Math.PI * v.freq * currentT) * (v.amp * 1.6);
            });
            yVal = Math.tanh(yVal); // Smooth harmonic saturation
        }

        const screenX = cx + xVal * maxRadius;
        const screenY = cy - yVal * maxRadius;
        points.push({ x: screenX, y: screenY });
    }

    ctx.save();

    // Subtle background concentric guide rings
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.5, 0, Math.PI * 2);
    ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 1. Outer Phosphor Bloom Aura
    const glowColor = is12Tet ? '#f59e0b' : '#10b981';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18 * breathGlow;
    ctx.beginPath();
    points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 2. High-intensity electron core trace
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#ffffff';
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    ctx.restore();
}
