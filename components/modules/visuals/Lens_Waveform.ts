import { VisualizerPlugin, VisualizerPreset } from './types/plugin';
import { LensContext, LATTICE_CHANNELS, HEART_CHANNELS, getFrequencyColor, getFrequencyHSL } from './shared';

// Helper conversions
const getVal = (v: unknown, fallback: number): number => {
    if (v === undefined || v === null) return fallback;
    const num = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(num) ? fallback : num;
};

const getStr = (v: unknown, fallback: string): string => {
    if (v === undefined || v === null || v === '') return fallback;
    return String(v);
};

const hexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.startsWith('#') ? hex.slice(1) : hex;
    if (clean.length === 3) {
        const r = parseInt(clean[0] + clean[0], 16);
        const g = parseInt(clean[1] + clean[1], 16);
        const b = parseInt(clean[2] + clean[2], 16);
        return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
    }
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
};

interface ActiveTone {
    id: string;
    freq: number;
    amp: number;
    color: string;
    rgb: [number, number, number];
}

// ── Curated Presets with Zen Breath & Entrainment Modulations ──
const PRESETS: VisualizerPreset[] = [
    {
        id: 'wf_quantum_neon',
        name: '01. Quantum Neon (Breathing Beam)',
        config: {
            waveStyle: 'COMPOSITE_BEAM',
            colorMode: 'Neon Prism',
            waveScale: 0.85,
            glowIntensity: 1.8,
            beamThickness: 2.2,
            travelSpeed: 0.5,
            waveDensity: 0.9,
            harmonicSpread: 0.4,
            symmetry: 1,
            trailDecay: 0.85,
            audioReactivity: 1.0,
            color1: '#00f5d4',
            color2: '#7928ca',
            color3: '#ff007f',
            bgColor: '#02040a',
            masterOpacity: 1.0
        },
        modulations: {
            waveScale: { enabled: true, min: 0.5, max: 1.4, amtBreath: 0.8, mixMode: 'MULT' },
            glowIntensity: { enabled: true, min: 1.0, max: 2.6, amtBreath: 0.7, amtBinaural: 0.4, mixMode: 'ADD' },
            beamThickness: { enabled: true, min: 1.5, max: 3.2, amtBreath: 0.5, mixMode: 'ADD' }
        }
    },
    {
        id: 'wf_harmonic_prism',
        name: '02. Multi-Harmonic Prism (Deconstruction)',
        config: {
            waveStyle: 'MULTI_HARMONIC',
            colorMode: 'Harmonic (Merrick)',
            waveScale: 0.75,
            glowIntensity: 1.7,
            beamThickness: 2.0,
            travelSpeed: 0.45,
            waveDensity: 0.95,
            harmonicSpread: 0.5,
            symmetry: 1,
            trailDecay: 0.86,
            audioReactivity: 1.0,
            color1: '#38bdf8',
            color2: '#a855f7',
            color3: '#f43f5e',
            bgColor: '#02040c',
            masterOpacity: 1.0
        },
        modulations: {
            harmonicSpread: { enabled: true, min: 0.2, max: 0.9, amtBreath: 0.8, mixMode: 'MULT' },
            glowIntensity: { enabled: true, min: 1.0, max: 2.4, amtBinaural: 0.6, amtBreath: 0.4, mixMode: 'ADD' },
            waveScale: { enabled: true, min: 0.5, max: 1.2, amtBreath: 0.6, mixMode: 'MULT' }
        }
    },
    {
        id: 'wf_cymatic_ring',
        name: '03. Polar Cymatic Ring (Breathing Mandala)',
        config: {
            waveStyle: 'CIRCULAR_RING',
            colorMode: 'Bioluminescent Aqua',
            waveScale: 0.8,
            glowIntensity: 1.9,
            beamThickness: 2.0,
            travelSpeed: 0.4,
            waveDensity: 1.0,
            harmonicSpread: 0.4,
            symmetry: 3,
            trailDecay: 0.88,
            audioReactivity: 1.0,
            color1: '#06b6d4',
            color2: '#10b981',
            color3: '#3b82f6',
            bgColor: '#010c14',
            masterOpacity: 1.0
        },
        modulations: {
            waveScale: { enabled: true, min: 0.6, max: 1.3, amtBreath: 0.8, mixMode: 'MULT' },
            glowIntensity: { enabled: true, min: 1.1, max: 2.6, amtBreath: 0.7, mixMode: 'ADD' },
            symmetry: { enabled: true, min: 2, max: 6, amtBinaural: 0.5, mixMode: 'ADD' }
        }
    },
    {
        id: 'wf_lissajous_orbit',
        name: '04. Lissajous Phase Orbit (Cosmic Attractor)',
        config: {
            waveStyle: 'LISSAJOUS_ORBIT',
            colorMode: 'Electric Violet',
            waveScale: 0.85,
            glowIntensity: 1.8,
            beamThickness: 2.0,
            travelSpeed: 0.4,
            waveDensity: 0.9,
            harmonicSpread: 0.4,
            symmetry: 1,
            trailDecay: 0.90,
            audioReactivity: 1.0,
            color1: '#d946ef',
            color2: '#8b5cf6',
            color3: '#06b6d4',
            bgColor: '#08020e',
            masterOpacity: 1.0
        },
        modulations: {
            travelSpeed: { enabled: true, min: 0.2, max: 1.0, amtBinaural: 0.6, mixMode: 'MULT' },
            glowIntensity: { enabled: true, min: 1.0, max: 2.5, amtBreath: 0.7, mixMode: 'ADD' },
            waveScale: { enabled: true, min: 0.6, max: 1.2, amtBreath: 0.6, mixMode: 'MULT' }
        }
    },
    {
        id: 'wf_phosphor_crt',
        name: '05. Vintage Phosphor CRT (Oscilloscope)',
        config: {
            waveStyle: 'PHOSPHOR_GRID',
            colorMode: 'Emerald CRT',
            waveScale: 0.8,
            glowIntensity: 2.0,
            beamThickness: 1.8,
            travelSpeed: 0.6,
            waveDensity: 0.9,
            harmonicSpread: 0.3,
            symmetry: 1,
            trailDecay: 0.91,
            audioReactivity: 1.0,
            color1: '#22c55e',
            color2: '#4ade80',
            color3: '#86efac',
            bgColor: '#010d05',
            masterOpacity: 1.0
        },
        modulations: {
            glowIntensity: { enabled: true, min: 1.2, max: 2.8, amtBreath: 0.8, amtBinaural: 0.4, mixMode: 'ADD' },
            waveScale: { enabled: true, min: 0.5, max: 1.3, amtBreath: 0.7, mixMode: 'MULT' }
        }
    },
    {
        id: 'wf_dual_ribbon',
        name: '06. Dual Ribbon Stream (Fluid Flow)',
        config: {
            waveStyle: 'DUAL_RIBBON',
            colorMode: 'Solar Gold',
            waveScale: 0.75,
            glowIntensity: 1.8,
            beamThickness: 2.2,
            travelSpeed: 0.4,
            waveDensity: 1.0,
            harmonicSpread: 0.5,
            symmetry: 1,
            trailDecay: 0.86,
            audioReactivity: 1.0,
            color1: '#f59e0b',
            color2: '#ef4444',
            color3: '#ec4899',
            bgColor: '#0d0402',
            masterOpacity: 1.0
        },
        modulations: {
            waveScale: { enabled: true, min: 0.5, max: 1.3, amtBreath: 0.8, mixMode: 'MULT' },
            harmonicSpread: { enabled: true, min: 0.2, max: 0.9, amtBreath: 0.7, mixMode: 'ADD' },
            glowIntensity: { enabled: true, min: 1.0, max: 2.5, amtBreath: 0.6, mixMode: 'ADD' }
        }
    }
];

export const Lens_Waveform: VisualizerPlugin = {
    id: 'WAVEFORM',
    name: 'Waveform',
    renderType: 'CANVAS_2D',
    parameters: [
        {
            id: 'waveStyle',
            label: 'Waveform Geometry',
            type: 'SELECT',
            section: 'GEOMETRY',
            icon: 'Activity',
            options: ['COMPOSITE_BEAM', 'MULTI_HARMONIC', 'CIRCULAR_RING', 'LISSAJOUS_ORBIT', 'DUAL_RIBBON', 'PHOSPHOR_GRID'],
            defaultValue: 'COMPOSITE_BEAM'
        },
        {
            id: 'colorMode',
            label: 'Color Palette',
            type: 'SELECT',
            section: 'COLOR',
            icon: 'Palette',
            options: ['Harmonic (Merrick)', 'Neon Prism', 'Bioluminescent Aqua', 'Electric Violet', 'Solar Gold', 'Emerald CRT', 'Custom'],
            defaultValue: 'Neon Prism'
        },
        {
            id: 'waveScale',
            label: 'Amplitude / Height',
            type: 'SLIDER',
            section: 'PHYSICS',
            icon: 'Maximize2',
            min: 0.1,
            max: 2.5,
            step: 0.05,
            color: '#00f5d4',
            defaultValue: 0.85
        },
        {
            id: 'glowIntensity',
            label: 'Glow Bloom & Aura',
            type: 'SLIDER',
            section: 'LIGHT',
            icon: 'Sparkles',
            min: 0.1,
            max: 3.5,
            step: 0.05,
            color: '#e879f9',
            defaultValue: 1.8
        },
        {
            id: 'beamThickness',
            label: 'Beam Core Thickness',
            type: 'SLIDER',
            section: 'GEOMETRY',
            icon: 'Minus',
            min: 0.5,
            max: 6.0,
            step: 0.1,
            color: '#38bdf8',
            defaultValue: 2.2
        },
        {
            id: 'travelSpeed',
            label: 'Phase Travel Speed',
            type: 'SLIDER',
            section: 'PHYSICS',
            icon: 'Wind',
            min: -2.5,
            max: 2.5,
            step: 0.05,
            color: '#2dd4bf',
            defaultValue: 0.5
        },
        {
            id: 'waveDensity',
            label: 'Wavelength Density',
            type: 'SLIDER',
            section: 'GEOMETRY',
            icon: 'Waves',
            min: 0.2,
            max: 3.0,
            step: 0.05,
            color: '#a855f7',
            defaultValue: 0.9
        },
        {
            id: 'harmonicSpread',
            label: 'Harmonic Separation',
            type: 'SLIDER',
            section: 'GEOMETRY',
            icon: 'Sliders',
            min: 0.0,
            max: 1.5,
            step: 0.05,
            color: '#f43f5e',
            defaultValue: 0.4
        },
        {
            id: 'symmetry',
            label: 'Radial / Mirror Symmetry',
            type: 'SLIDER',
            section: 'GEOMETRY',
            icon: 'Hexagon',
            min: 1,
            max: 8,
            step: 1,
            color: '#fbbf24',
            defaultValue: 1
        },
        {
            id: 'trailDecay',
            label: 'Phosphor Persistence',
            type: 'SLIDER',
            section: 'LIGHT',
            icon: 'Clock',
            min: 0.5,
            max: 0.98,
            step: 0.01,
            color: '#10b981',
            defaultValue: 0.86
        },
        {
            id: 'audioReactivity',
            label: 'Acoustic Reactivity',
            type: 'SLIDER',
            section: 'PHYSICS',
            icon: 'Zap',
            min: 0.0,
            max: 2.0,
            step: 0.05,
            color: '#fbbf24',
            defaultValue: 1.0
        },
        {
            id: 'color1',
            label: 'Primary Beam Color',
            type: 'COLOR',
            section: 'COLOR',
            defaultValue: '#00f5d4'
        },
        {
            id: 'color2',
            label: 'Secondary Beam Color',
            type: 'COLOR',
            section: 'COLOR',
            defaultValue: '#7928ca'
        },
        {
            id: 'color3',
            label: 'Accent Glow Color',
            type: 'COLOR',
            section: 'COLOR',
            defaultValue: '#ff007f'
        },
        {
            id: 'bgColor',
            label: 'Background Canvas',
            type: 'COLOR',
            section: 'COLOR',
            defaultValue: '#02040a'
        },
        {
            id: 'masterOpacity',
            label: 'Master Opacity',
            type: 'SLIDER',
            section: 'GLOBAL',
            icon: 'Eye',
            min: 0.0,
            max: 1.0,
            step: 0.01,
            color: '#ffffff',
            defaultValue: 1.0
        }
    ],
    defaultConfig: PRESETS[0].config,
    presets: PRESETS,
    render: (context: Record<string, unknown>, localConfig: Record<string, unknown>) => {
        const lensCtx = context as unknown as LensContext;
        const { ctx, w, h, cx, cy, time, dt, memory, breathRadius = 0.5, coherence = 1.0, globalBinauralBeat = 7.83 } = lensCtx;
        if (!ctx) return;

        const cfg = localConfig ? { ...lensCtx.config, ...localConfig } : lensCtx.config;

        // Config values
        const waveStyle = getStr(cfg.waveStyle, 'COMPOSITE_BEAM');
        const colorMode = getStr(cfg.colorMode, 'Neon Prism');
        const waveScale = getVal(cfg.waveScale, 0.85);
        const glowIntensity = getVal(cfg.glowIntensity, 1.8);
        const beamThickness = getVal(cfg.beamThickness, 2.2);
        const travelSpeed = getVal(cfg.travelSpeed, 0.5);
        const waveDensity = getVal(cfg.waveDensity, 0.9);
        const harmonicSpread = getVal(cfg.harmonicSpread, 0.4);
        const symmetry = Math.max(1, Math.round(getVal(cfg.symmetry, 1)));
        const trailDecay = Math.max(0.5, Math.min(0.98, getVal(cfg.trailDecay, 0.86)));
        const audioReactivity = getVal(cfg.audioReactivity, 1.0);
        const masterOpacity = getVal(cfg.masterOpacity, 1.0);

        const color1 = getStr(cfg.color1, '#00f5d4');
        const color2 = getStr(cfg.color2, '#7928ca');
        const color3 = getStr(cfg.color3, '#ff007f');
        const bgColor = getStr(cfg.bgColor, '#02040a');

        // Initialize persistent memory and offscreen trail canvas
        if (!memory.wf_trailCanvas || memory.wf_w !== w || memory.wf_h !== h) {
            memory.wf_w = w;
            memory.wf_h = h;
            memory.wf_trailCanvas = document.createElement('canvas');
            memory.wf_trailCanvas.width = w;
            memory.wf_trailCanvas.height = h;
            const tCtx = memory.wf_trailCanvas.getContext('2d');
            if (tCtx) {
                tCtx.fillStyle = bgColor;
                tCtx.fillRect(0, 0, w, h);
            }
            memory.wf_phaseAccum = 0;
            memory.wf_tones = [];
        }

        // Advance smooth phase
        memory.wf_phaseAccum = (memory.wf_phaseAccum || 0) + (dt * travelSpeed * 2.0);

        // 1. Gather ONLY actively playing acoustic tones
        const rawAmps = lensCtx.amplitudes;
        const customFreqs = (lensCtx.customFrequencies as Record<string, number>) || {};
        const activeTones: ActiveTone[] = [];

        if (rawAmps) {
            for (const [id, ampVal] of rawAmps.entries()) {
                if (ampVal > 0.002) {
                    let freq = customFreqs[id];
                    if (!freq) {
                        const stdCh = LATTICE_CHANNELS.find(c => c.id === id) || HEART_CHANNELS.find(c => c.id === id);
                        if (stdCh) freq = stdCh.freq;
                    }
                    if (!freq) {
                        const match = id.match(/\d+/);
                        if (match) {
                            const parsed = parseFloat(match[0]);
                            if (parsed >= 20 && parsed <= 2000) freq = parsed;
                        }
                    }
                    if (!freq) freq = 432.0;

                    let toneColor = '#06b6d4';
                    if (colorMode === 'Harmonic (Merrick)' || colorMode === 'Harmonic') {
                        toneColor = getFrequencyColor(freq);
                    } else if (colorMode === 'Neon Prism') {
                        const hues = ['#00f5d4', '#7928ca', '#ff007f', '#38bdf8', '#fbbf24', '#10b981', '#f43f5e'];
                        toneColor = hues[activeTones.length % hues.length];
                    } else if (colorMode === 'Bioluminescent Aqua') {
                        toneColor = activeTones.length % 2 === 0 ? '#00f5d4' : '#06b6d4';
                    } else if (colorMode === 'Electric Violet') {
                        toneColor = activeTones.length % 2 === 0 ? '#d946ef' : '#8b5cf6';
                    } else if (colorMode === 'Solar Gold') {
                        toneColor = activeTones.length % 2 === 0 ? '#f59e0b' : '#fbbf24';
                    } else if (colorMode === 'Emerald CRT') {
                        toneColor = '#22c55e';
                    } else {
                        toneColor = activeTones.length % 2 === 0 ? color1 : color2;
                    }

                    activeTones.push({
                        id,
                        freq,
                        amp: Math.min(1.0, ampVal) * audioReactivity,
                        color: toneColor,
                        rgb: hexToRgb(toneColor)
                    });
                }
            }
        }

        const isSilent = activeTones.length === 0;

        // 2. Manage Phosphor Decay & Trails Buffer
        const trailCanvas = memory.wf_trailCanvas as HTMLCanvasElement;
        const trailCtx = trailCanvas.getContext('2d');
        if (trailCtx) {
            trailCtx.globalCompositeOperation = 'source-over';
            const decayAlpha = Math.max(0.05, 1.0 - trailDecay);
            trailCtx.fillStyle = bgColor;
            trailCtx.globalAlpha = decayAlpha;
            trailCtx.fillRect(0, 0, w, h);
            trailCtx.globalAlpha = 1.0;
        }

        // Target drawing context
        ctx.save();
        ctx.globalAlpha = masterOpacity;

        // Background / Trail Blit
        if (trailCanvas) {
            ctx.drawImage(trailCanvas, -w/2, -h/2, w, h);
        }

        // 3. Central Zen Breathing Aura (Smooth & Ethereal)
        const breathExpansion = 0.85 + breathRadius * 0.3;
        const auraRadius = Math.min(w, h) * 0.38 * breathExpansion;
        const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraRadius);
        const primaryRgb = hexToRgb(color1);
        const auraAlpha = (isSilent ? 0.05 : 0.09) * glowIntensity * (0.7 + breathRadius * 0.3);
        auraGrad.addColorStop(0, `rgba(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]}, ${auraAlpha.toFixed(3)})`);
        auraGrad.addColorStop(0.5, `rgba(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]}, ${(auraAlpha * 0.25).toFixed(3)})`);
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // 4. Oscilloscope Reticle Grid (For PHOSPHOR_GRID mode)
        if (waveStyle === 'PHOSPHOR_GRID') {
            ctx.save();
            ctx.strokeStyle = colorMode === 'Emerald CRT' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            const gridSpacing = 40;
            ctx.beginPath();
            for (let x = cx - w/2; x <= cx + w/2; x += gridSpacing) {
                ctx.moveTo(x, cy - h/2);
                ctx.lineTo(x, cy + h/2);
            }
            for (let y = cy - h/2; y <= cy + h/2; y += gridSpacing) {
                ctx.moveTo(cx - w/2, y);
                ctx.lineTo(cx + w/2, y);
            }
            ctx.stroke();

            // Center crosshairs
            ctx.strokeStyle = colorMode === 'Emerald CRT' ? 'rgba(74, 222, 128, 0.18)' : 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            ctx.moveTo(cx - w/2, cy); ctx.lineTo(cx + w/2, cy);
            ctx.moveTo(cx, cy - h/2); ctx.lineTo(cx, cy + h/2);
            ctx.stroke();
            ctx.restore();
        }

        // 5. Waveform Geometry Engine with strict zen bounds and soft saturation
        const width = w;
        const height = h;
        const halfWidth = width / 2;
        const numSamples = Math.min(500, Math.max(160, Math.floor(width * 0.6)));
        
        // Controlled, serene max height: guaranteed to stay nicely framed within screen
        const maxExcursion = Math.min(height * 0.22, 120);
        const baseAmplitude = maxExcursion * waveScale * breathExpansion;

        // Accurate harmonic synthesizer function (Outputs exactly 0 when silent)
        const computeSample = (tNorm: number, phaseOffset: number = 0): { composite: number, individual: number[] } => {
            if (isSilent) {
                return { composite: 0, individual: [] };
            }

            let totalY = 0;
            const indY: number[] = [];
            const sampleTime = memory.wf_phaseAccum + phaseOffset;

            for (let i = 0; i < activeTones.length; i++) {
                const tone = activeTones[i];
                // Musical wavelength compression: normalize frequency to visually readable cycles (2 to 8 calm cycles across screen)
                const cycles = (2.0 + Math.log2(Math.max(20, tone.freq) / 20.0) * 1.0) * waveDensity;
                const phase = (tNorm * cycles * Math.PI * 2) + (sampleTime * (tone.freq / 256.0));
                
                const sineVal = Math.sin(phase);
                const toneY = sineVal * tone.amp;

                indY.push(toneY);
                totalY += toneY;
            }

            // Normalize and soft-compress with tanh so amplitude never explodes
            const normFactor = activeTones.length > 1 ? (1.0 / Math.sqrt(activeTones.length)) : 1.0;
            const composite = Math.tanh(totalY * normFactor);

            return { composite, individual: indY };
        };

        // Draw multi-layered soft laser glow paths
        const drawGlowPath = (pathFn: (ctx: CanvasRenderingContext2D) => void, strokeColor: string, thickness: number, glowMult: number = 1.0, isFilled: boolean = false, fillColor?: string) => {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            const [r, g, b] = hexToRgb(strokeColor);
            const effGlow = glowIntensity * glowMult;

            if (isFilled && fillColor) {
                ctx.save();
                ctx.fillStyle = fillColor;
                ctx.beginPath();
                pathFn(ctx);
                ctx.fill();
                ctx.restore();
            }

            // Layer 1: Wide Ethereal Bloom
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(0.14 * effGlow).toFixed(3)})`;
            ctx.lineWidth = thickness * 4.0;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            pathFn(ctx);
            ctx.stroke();

            // Layer 2: Soft Neon Halo
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(0.38 * effGlow).toFixed(3)})`;
            ctx.lineWidth = thickness * 2.0;
            ctx.beginPath();
            pathFn(ctx);
            ctx.stroke();

            // Layer 3: Clean Core Beam
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = thickness;
            ctx.beginPath();
            pathFn(ctx);
            ctx.stroke();

            // Layer 4: White-Hot Center Thread
            ctx.strokeStyle = `rgba(255, 255, 255, ${(0.75 * masterOpacity).toFixed(2)})`;
            ctx.lineWidth = Math.max(1.0, thickness * 0.3);
            ctx.beginPath();
            pathFn(ctx);
            ctx.stroke();

            ctx.restore();
        };

        // ── RENDER MODES ─────────────────────────────────────────────

        if (waveStyle === 'COMPOSITE_BEAM' || waveStyle === 'PHOSPHOR_GRID') {
            // 1. Single Master Glowing Oscilloscope Waveform (or resting flat horizon beam)
            for (let sym = 0; sym < symmetry; sym++) {
                const symAngle = (sym / symmetry) * Math.PI;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(symAngle);

                const wavePath = (c: CanvasRenderingContext2D) => {
                    for (let s = 0; s <= numSamples; s++) {
                        const t = s / numSamples;
                        const x = -halfWidth + (t * width);
                        // Hanning window edge tapering to smooth screen edges
                        const edgeWindow = Math.sin(t * Math.PI);
                        const { composite } = computeSample(t);
                        const y = composite * baseAmplitude * edgeWindow;

                        if (s === 0) c.moveTo(x, y);
                        else c.lineTo(x, y);
                    }
                };

                const masterColor = colorMode === 'Emerald CRT' ? '#22c55e' : (activeTones[0]?.color || color1);
                drawGlowPath(wavePath, masterColor, beamThickness, isSilent ? 0.7 : 1.0);

                ctx.restore();
            }

        } else if (waveStyle === 'MULTI_HARMONIC') {
            // 2. Individual Harmonic Beams fanning out with Merrick Pitch Colors
            ctx.save();
            ctx.translate(cx, cy);

            if (isSilent) {
                // Resting baseline beam
                const restPath = (c: CanvasRenderingContext2D) => {
                    c.moveTo(-halfWidth, 0);
                    c.lineTo(halfWidth, 0);
                };
                drawGlowPath(restPath, color1, beamThickness, 0.7);
            } else {
                const spreadStep = Math.min(height * 0.08, 45) * harmonicSpread * (0.8 + breathRadius * 0.3);

                // Draw individual tone beams
                for (let i = 0; i < activeTones.length; i++) {
                    const tone = activeTones[i];
                    const vOffset = (i - (activeTones.length - 1) / 2) * spreadStep;

                    const tonePath = (c: CanvasRenderingContext2D) => {
                        for (let s = 0; s <= numSamples; s++) {
                            const t = s / numSamples;
                            const x = -halfWidth + (t * width);
                            const edgeWindow = Math.sin(t * Math.PI);
                            const { individual } = computeSample(t);
                            const toneVal = individual[i] ? Math.tanh(individual[i]) : 0;
                            const y = vOffset + (toneVal * baseAmplitude * 0.75 * edgeWindow);

                            if (s === 0) c.moveTo(x, y);
                            else c.lineTo(x, y);
                        }
                    };

                    drawGlowPath(tonePath, tone.color, beamThickness * 0.8, 0.85);
                }

                // Draw master composite beam across the center connecting the harmonics
                const compositePath = (c: CanvasRenderingContext2D) => {
                    for (let s = 0; s <= numSamples; s++) {
                        const t = s / numSamples;
                        const x = -halfWidth + (t * width);
                        const edgeWindow = Math.sin(t * Math.PI);
                        const { composite } = computeSample(t);
                        const y = composite * baseAmplitude * edgeWindow;

                        if (s === 0) c.moveTo(x, y);
                        else c.lineTo(x, y);
                    }
                };
                drawGlowPath(compositePath, '#ffffff', beamThickness * 1.1, 1.2);
            }

            ctx.restore();

        } else if (waveStyle === 'CIRCULAR_RING') {
            // 3. Polar Cymatic Ring (Breathing Mandala Oscilloscope)
            ctx.save();
            ctx.translate(cx, cy);

            const baseRadius = Math.min(width, height) * 0.20 * (0.85 + breathRadius * 0.3);
            const numPolarPoints = 240;

            const ringPath = (c: CanvasRenderingContext2D) => {
                for (let i = 0; i <= numPolarPoints; i++) {
                    const theta = (i / numPolarPoints) * Math.PI * 2;
                    const tNorm = (i / numPolarPoints) * symmetry;
                    const { composite } = computeSample(tNorm);
                    const r = baseRadius + (composite * (baseAmplitude * 0.4));
                    const x = Math.cos(theta) * r;
                    const y = Math.sin(theta) * r;

                    if (i === 0) c.moveTo(x, y);
                    else c.lineTo(x, y);
                }
                c.closePath();
            };

            const ringColor = activeTones[0]?.color || color1;
            drawGlowPath(ringPath, ringColor, beamThickness, isSilent ? 0.7 : 1.1);

            // Inner harmonic resonant rings
            if (!isSilent && activeTones.length > 1) {
                for (let k = 1; k < Math.min(3, activeTones.length); k++) {
                    const innerR = baseRadius * (1.0 - k * 0.2);
                    if (innerR > 10) {
                        const innerPath = (c: CanvasRenderingContext2D) => {
                            for (let i = 0; i <= numPolarPoints; i++) {
                                const theta = (i / numPolarPoints) * Math.PI * 2;
                                const tNorm = (i / numPolarPoints) * symmetry;
                                const { individual } = computeSample(tNorm, k * 0.5);
                                const indVal = individual[k] ? Math.tanh(individual[k]) : 0;
                                const r = innerR + (indVal * (baseAmplitude * 0.25));
                                const x = Math.cos(theta) * r;
                                const y = Math.sin(theta) * r;

                                if (i === 0) c.moveTo(x, y);
                                else c.lineTo(x, y);
                            }
                            c.closePath();
                        };
                        drawGlowPath(innerPath, activeTones[k].color, beamThickness * 0.75, 0.75);
                    }
                }
            }

            ctx.restore();

        } else if (waveStyle === 'LISSAJOUS_ORBIT') {
            // 4. Lissajous Phase-Space Cosmic Orbit
            ctx.save();
            ctx.translate(cx, cy);

            const orbitRadius = Math.min(width, height) * 0.22 * waveScale * (0.85 + breathRadius * 0.3);
            const orbitPoints = 360;

            if (isSilent) {
                // Resting breathing circular halo
                const restCircle = (c: CanvasRenderingContext2D) => {
                    c.arc(0, 0, orbitRadius * 0.7, 0, Math.PI * 2);
                };
                drawGlowPath(restCircle, color2, beamThickness, 0.7);
            } else {
                const t1 = activeTones[0] || { freq: 432, amp: 1 };
                const t2 = activeTones[1] || activeTones[0];

                const ratio1 = Math.max(1, Math.min(6, Math.round(t1.freq / 64.0)));
                const ratio2 = Math.max(1, Math.min(6, Math.round(t2.freq / 64.0)));
                const phaseShift = memory.wf_phaseAccum * 0.6;

                const lissajousPath = (c: CanvasRenderingContext2D) => {
                    for (let i = 0; i <= orbitPoints; i++) {
                        const phi = (i / orbitPoints) * Math.PI * 2;
                        const x = Math.sin(phi * ratio1 + phaseShift) * orbitRadius;
                        const y = Math.cos(phi * ratio2) * orbitRadius;

                        if (i === 0) c.moveTo(x, y);
                        else c.lineTo(x, y);
                    }
                    c.closePath();
                };

                const lissColor = color2 || '#d946ef';
                drawGlowPath(lissajousPath, lissColor, beamThickness, 1.1);
            }

            ctx.restore();

        } else if (waveStyle === 'DUAL_RIBBON') {
            // 5. Dual Interleaving Ribbon Streams
            ctx.save();
            ctx.translate(cx, cy);

            if (isSilent) {
                // Resting dual horizon lines
                const restSpread = Math.min(height * 0.05, 25);
                const upperRest = (c: CanvasRenderingContext2D) => {
                    c.moveTo(-halfWidth, -restSpread); c.lineTo(halfWidth, -restSpread);
                };
                const lowerRest = (c: CanvasRenderingContext2D) => {
                    c.moveTo(-halfWidth, restSpread); c.lineTo(halfWidth, restSpread);
                };
                drawGlowPath(upperRest, color1, beamThickness, 0.7);
                drawGlowPath(lowerRest, color2, beamThickness, 0.7);
            } else {
                const ribbonSpread = Math.min(height * 0.08, 45) * harmonicSpread * (0.8 + breathRadius * 0.3);

                // Upper Ribbon
                const upperPath = (c: CanvasRenderingContext2D) => {
                    for (let s = 0; s <= numSamples; s++) {
                        const t = s / numSamples;
                        const x = -halfWidth + (t * width);
                        const edgeWindow = Math.sin(t * Math.PI);
                        const { composite } = computeSample(t, 0);
                        const y = -ribbonSpread + (composite * baseAmplitude * 0.8 * edgeWindow);

                        if (s === 0) c.moveTo(x, y);
                        else c.lineTo(x, y);
                    }
                };
                drawGlowPath(upperPath, color1, beamThickness, 0.9);

                // Lower Ribbon (Opposing Phase)
                const lowerPath = (c: CanvasRenderingContext2D) => {
                    for (let s = 0; s <= numSamples; s++) {
                        const t = s / numSamples;
                        const x = -halfWidth + (t * width);
                        const edgeWindow = Math.sin(t * Math.PI);
                        const { composite } = computeSample(t, Math.PI * 0.75);
                        const y = ribbonSpread + (composite * baseAmplitude * 0.8 * edgeWindow);

                        if (s === 0) c.moveTo(x, y);
                        else c.lineTo(x, y);
                    }
                };
                drawGlowPath(lowerPath, color2, beamThickness, 0.9);

                // Translucent ribbon gradient fill connecting them
                const fillRibbonPath = (c: CanvasRenderingContext2D) => {
                    for (let s = 0; s <= numSamples; s++) {
                        const t = s / numSamples;
                        const x = -halfWidth + (t * width);
                        const edgeWindow = Math.sin(t * Math.PI);
                        const { composite } = computeSample(t, 0);
                        const y = -ribbonSpread + (composite * baseAmplitude * 0.8 * edgeWindow);
                        if (s === 0) c.moveTo(x, y);
                        else c.lineTo(x, y);
                    }
                    for (let s = numSamples; s >= 0; s--) {
                        const t = s / numSamples;
                        const x = -halfWidth + (t * width);
                        const edgeWindow = Math.sin(t * Math.PI);
                        const { composite } = computeSample(t, Math.PI * 0.75);
                        const y = ribbonSpread + (composite * baseAmplitude * 0.8 * edgeWindow);
                        c.lineTo(x, y);
                    }
                    c.closePath();
                };

                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const ribbonGrad = ctx.createLinearGradient(0, -ribbonSpread, 0, ribbonSpread);
                const c1Rgb = hexToRgb(color1);
                const c2Rgb = hexToRgb(color2);
                ribbonGrad.addColorStop(0, `rgba(${c1Rgb[0]}, ${c1Rgb[1]}, ${c1Rgb[2]}, 0.08)`);
                ribbonGrad.addColorStop(1, `rgba(${c2Rgb[0]}, ${c2Rgb[1]}, ${c2Rgb[2]}, 0.08)`);
                ctx.fillStyle = ribbonGrad;
                ctx.beginPath();
                fillRibbonPath(ctx);
                ctx.fill();
                ctx.restore();
            }

            ctx.restore();
        }

        // 6. Snapshot current canvas to offscreen trails buffer for phosphor persistence
        if (trailCtx) {
            trailCtx.drawImage(ctx.canvas, 0, 0, w, h);
        }

        ctx.restore();
    },
    cleanup: (context: { gl: WebGL2RenderingContext | WebGLRenderingContext | null, memory: Record<string, unknown> }) => {
        if (context.memory) {
            context.memory.wf_trailCanvas = null;
            context.memory.wf_tones = [];
        }
    }
};
